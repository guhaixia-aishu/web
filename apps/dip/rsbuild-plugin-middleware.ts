import type { RsbuildPlugin } from "@rsbuild/core";
import express from "express";
import axios from "axios";
import { Agent } from "https";
import { randomBytes } from "crypto";

/**
 * 开发环境登录和服务转发中间件插件
 */
export function rsbuildMiddlewarePlugin(): RsbuildPlugin {
  return {
    name: "rsbuild-plugin-middleware",

    setup(rsbuild) {
      // 只在开发环境启用
      if (process.env.NODE_ENV !== "development") {
        return;
      }

      // 获取环境变量
      const DEBUG_ORIGIN = process.env.DEBUG_ORIGIN || "https://10.4.111.24";

      // 创建 Express 应用
      const app = express();

      // 注意：不在此处使用 express.json() / express.urlencoded()
      // 否则会消费请求 body 流，导致后续代理转发时 body 为空，PUT/POST 等带 body 的请求会失败（ECONNRESET）
      // 当前认证路由均为 GET，均不需要解析 body

      // 手动解析 cookies（Express 4.x 不自动解析 cookies）
      app.use((req: any, res: any, next: any) => {
        const cookieHeader = req.headers.cookie;
        if (cookieHeader) {
          req.cookies = {};
          cookieHeader.split(";").forEach((cookie: string) => {
            const parts = cookie.trim().split("=");
            if (parts.length === 2) {
              req.cookies[parts[0]] = decodeURIComponent(parts[1]);
            }
          });
        } else {
          req.cookies = {};
        }
        next();
      });

      // 用于存储实际端口的变量
      let actualPort: number | null = null;

      // 共享的客户端缓存，确保所有路由使用同一个客户端
      let clientCache: any = null;
      let clientCachePromise: Promise<any> | null = null;

      // 在服务器启动前设置中间件
      rsbuild.onBeforeStartDevServer(({ server }) => {
        // 添加根路径重定向中间件（必须在最前面）
        server.middlewares.use((req: any, res: any, next: any) => {
          // 只处理根路径，重定向到 /dip-hub/
          if (req.url === "/" || req.url === "") {
            console.log("🔄 重定向根路径到 /dip-hub/");
            res.writeHead(301, { Location: "/dip-hub/" });
            res.end();
            return;
          }
          next();
        });

        // 设置认证路由（使用动态端口获取函数和共享的客户端缓存）
        setupAuthRoutes(app, DEBUG_ORIGIN, () => actualPort || 3001, {
          getCache: () => clientCache,
          setCache: (cache: any) => {
            clientCache = cache;
          },
          getCachePromise: () => clientCachePromise,
          setCachePromise: (promise: Promise<any> | null) => {
            clientCachePromise = promise;
          },
        });
        console.log("✅ 认证路由已初始化");

        // 挂载 Express 应用到 /api/dip-hub 路径
        server.middlewares.use("/api/dip-hub", app);
      });

      // 在服务器启动后获取实际端口
      rsbuild.onAfterStartDevServer((devServer) => {
        // 获取实际端口
        const server = devServer as any;
        actualPort = server.httpServer?.address()?.port || 3001;
        console.log(`✅ 服务器已启动，端口: ${actualPort}`);
      });
    },
  };
}

function setupAuthRoutes(
  app: express.Application,
  DEBUG_ORIGIN: string,
  getPort: (() => number) | number,
  cacheManager: {
    getCache: () => any;
    setCache: (cache: any) => void;
    getCachePromise: () => Promise<any> | null;
    setCachePromise: (promise: Promise<any> | null) => void;
  },
) {
  // 支持函数或直接传入端口值
  const getPortValue =
    typeof getPort === "function"
      ? getPort
      : () => (typeof getPort === "string" ? parseInt(getPort, 10) : getPort);

  // 与 rsbuild 的 publicPath 保持一致，用于登录回调重定向的完整路径
  const BASE_PATH =
    (process.env.PUBLIC_PATH || "/dip-hub/").replace(/\/$/, "") || "/dip-hub";

  // 动态获取端口和URI的函数
  const getConfig = () => {
    const PORT = getPortValue();
    const ORIGIN = `http://localhost:${PORT}`;
    const REDIRECT_URI = `${ORIGIN}/api/dip-hub/v1/login/callback`;
    const POST_LOGOUT_REDIRECT_URI = `${ORIGIN}/api/dip-hub/v1/logout/callback`;
    return { ORIGIN, REDIRECT_URI, POST_LOGOUT_REDIRECT_URI };
  };

  // 注册 OAuth2 客户端（使用共享缓存，防止并发注册）
  const registerClient = async () => {
    // 如果已有缓存，直接返回
    const cached = cacheManager.getCache();
    if (cached) {
      return cached;
    }

    // 如果正在注册，等待注册完成
    const existingPromise = cacheManager.getCachePromise();
    if (existingPromise) {
      return existingPromise;
    }

    // 创建新的注册 Promise
    const registerPromise = (async () => {
      try {
        const config = getConfig();
        console.log("📝 正在注册 OAuth2 客户端，端口:", getPortValue());
        const { data } = await axios.post(
          "/oauth2/clients",
          {
            grant_types: ["authorization_code", "refresh_token", "implicit"],
            scope: "offline openid all",
            redirect_uris: [config.REDIRECT_URI],
            post_logout_redirect_uris: [config.POST_LOGOUT_REDIRECT_URI],
            client_name: "WebDebugClient",
            metadata: {
              device: {
                name: "WebDebugClient",
                client_type: "unknown",
                description: "WebDebugClient",
              },
            },
            response_types: ["token id_token", "code", "token"],
          },
          {
            baseURL: DEBUG_ORIGIN,
            httpsAgent: new Agent({ rejectUnauthorized: false }),
          },
        );

        cacheManager.setCache(data);
        cacheManager.setCachePromise(null);
        console.log("✅ OAuth2 客户端注册成功，client_id:", data.client_id);
        return data;
      } catch (error: any) {
        cacheManager.setCachePromise(null);
        console.error("❌ OAuth2 客户端注册失败:", error.message);
        throw error;
      }
    })();

    // 保存 Promise，防止并发注册
    cacheManager.setCachePromise(registerPromise);
    return registerPromise;
  };

  // 登录路由
  app.get("/v1/login", async (req, res) => {
    try {
      console.log("🔄 登录路由请求:", {
        url: req.url,
        query: req.query,
      });

      const config = getConfig();
      console.log("📋 OAuth 配置:", config);

      const clientData = await registerClient();
      if (!clientData) {
        return res.status(500).send("OAuth 客户端注册失败");
      }

      const { client_id } = clientData;
      console.log("🔑 使用客户端 ID:", client_id);
      const { asredirect } = req.query;

      // 将重定向地址编码为 state，如果没有重定向地址则生成随机 state
      // OAuth 服务器要求 state 至少 8 个字符
      let state: string;
      const redirectPath = (asredirect as string) || "";
      if (redirectPath) {
        // 拼上 basePath，登录回调重定向到完整路径（如 /dip-hub/store/my-app）
        const fullPath = redirectPath.startsWith(BASE_PATH)
          ? redirectPath
          : `${BASE_PATH}${redirectPath.startsWith("/") ? "" : "/"}${redirectPath}`;
        state = Buffer.from(decodeURIComponent(fullPath)).toString("base64");
      } else {
        // 如果没有重定向地址，生成随机 state（至少 16 字节，base64 编码后约 24 字符）
        state = randomBytes(16).toString("base64");
      }

      // 生成 nonce（用于 OpenID Connect，防止重放攻击）
      const nonce = randomBytes(16).toString("base64");

      // 使用 dip. 前缀保持一致性
      res.cookie("dip.state", state, { httpOnly: true });
      res.cookie("dip.nonce", nonce, { httpOnly: true });

      const authUrl = `${DEBUG_ORIGIN}/oauth2/auth?client_id=${client_id}&response_type=code&scope=offline+openid+all&redirect_uri=${encodeURIComponent(
        config.REDIRECT_URI,
      )}&state=${encodeURIComponent(state)}&nonce=${encodeURIComponent(
        nonce,
      )}&lang=zh-cn&product=dip`;

      console.log("🔗 重定向到 OAuth 服务器:", authUrl);
      res.redirect(authUrl);
    } catch (error: any) {
      console.error("❌ 登录路由错误:", error);
      res.status(500).send("登录处理失败");
    }
  });

  // 登录回调
  app.get("/v1/login/callback", async (req, res) => {
    try {
      console.log("🔄 登录回调请求:", {
        url: req.url,
        query: req.query,
        headers: req.headers,
      });

      const config = getConfig();
      const clientData = await registerClient();
      if (!clientData) {
        return res.status(500).send("OAuth 客户端注册失败");
      }

      const { client_secret, client_id } = clientData;
      console.log("🔑 回调使用客户端 ID:", client_id);
      const { code, state, error, error_description } = req.query;

      // 检查是否有错误
      if (error) {
        console.error("❌ OAuth 授权错误:", error, error_description);
        return res
          .status(400)
          .send(`OAuth 授权失败: ${error_description || error}`);
      }

      // 验证 code 参数
      if (!code || typeof code !== "string") {
        console.error("❌ 缺少授权码:", { code, query: req.query });
        return res.status(400).send("缺少授权码参数");
      }

      // 验证 state 参数（CSRF 保护）
      const cookieState = req.cookies?.["dip.state"];
      const urlState = state as string;

      if (!urlState || !cookieState) {
        console.error("❌ State 验证失败: 缺少 state 参数", {
          urlState,
          cookieState,
        });
        return res.status(400).send("State 参数验证失败");
      }

      // 比较 state（需要处理 URL 编码）
      const decodedUrlState = decodeURIComponent(urlState);
      const decodedCookieState = decodeURIComponent(cookieState);

      if (decodedUrlState !== decodedCookieState) {
        console.error("❌ State 验证失败: state 不匹配", {
          urlState: decodedUrlState,
          cookieState: decodedCookieState,
        });
        return res.status(400).send("State 参数不匹配，可能存在 CSRF 攻击");
      }

      console.log("✅ State 验证通过");

      const params = new URLSearchParams();

      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", config.REDIRECT_URI);

      const {
        data: { access_token, id_token, refresh_token },
      } = await axios.post(`${DEBUG_ORIGIN}/oauth2/token`, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${encodeURIComponent(client_id)}:${encodeURIComponent(
              client_secret,
            )}`,
          ).toString("base64")}`,
        },
        httpsAgent: new Agent({
          rejectUnauthorized: false,
        }),
      });

      // 使用与后端一致的 cookie 名称（dip. 前缀）
      res.cookie("dip.oauth2_token", access_token, { httpOnly: false });
      // 注意：后端不设置 id_token，但保留以兼容可能的其他用途，使用 dip. 前缀保持一致性
      res.cookie("dip.id_token", id_token, { httpOnly: false });
      res.cookie("dip.refresh_token", refresh_token, { httpOnly: false });
      res.clearCookie("dip.state");

      // 解码 state 获取重定向地址
      let redirectUrl = "/dip-hub/login-success";
      if (state && typeof state === "string" && state.length > 0) {
        try {
          const decodedState = Buffer.from(state, "base64").toString();
          // 检查解码后的内容是否看起来像一个路径（以 / 开头）
          // 如果是随机生成的 state，解码后可能包含不可打印字符，不是有效路径
          if (decodedState && decodedState.startsWith("/")) {
            redirectUrl = decodedState;
          }
          // 如果不是以 / 开头，可能是相对路径，添加 /
          else if (
            decodedState &&
            decodedState.length > 0 &&
            /^[\w/_-]+$/.test(decodedState)
          ) {
            redirectUrl = decodedState.startsWith("/")
              ? decodedState
              : `/${decodedState}`;
          }
          // 否则使用默认路径（可能是随机生成的 state）
        } catch (e) {
          // 忽略解码错误，使用默认重定向地址
          console.log("⚠️ State 解码失败，使用默认重定向地址");
        }
      }

      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error("❌ 登录回调错误:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        },
      });

      // 如果是 400 错误，显示更详细的错误信息
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        const errorMsg =
          errorData?.error_description || errorData?.error || "请求参数错误";
        return res.status(400).send(`登录失败: ${errorMsg}`);
      }

      res.status(500).send("登录回调处理失败");
    }
  });

  // 登出
  app.get("/v1/logout", async (req, res) => {
    // 清除所有使用 dip. 前缀的 cookie，与后端保持一致
    res.clearCookie("dip.oauth2_token");
    res.clearCookie("dip.session_id");
    res.clearCookie("dip.userid");
    res.clearCookie("dip.id_token");
    res.clearCookie("dip.refresh_token");
    res.clearCookie("dip.state");
    res.redirect("/api/dip-hub/v1/logout/callback");
  });

  // 登出回调
  app.get("/v1/logout/callback", async (req, res) => {
    res.redirect("/dip-hub/");
  });

  // 对于未匹配的路由，调用 next() 传递给下一个中间件（代理）
  // 这样非登录相关的请求就能通过代理转发到 Mock 服务
  app.use((req, res, next) => {
    next();
  });
}
