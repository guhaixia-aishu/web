import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { handleError, getServerErrorMsg } from '@/utils/http/error-handler';
import { message } from 'antd';
import intl from 'react-intl-universal';
import { httpConfig } from '@/utils/http/token-config';

// Mock 依赖
vi.mock('antd', () => ({
  message: {
    warning: vi.fn(),
  },
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: vi.fn((key) => key), // 默认返回key本身
  },
}));

vi.mock('@/utils/http/token-config', () => ({
  httpConfig: {
    onTokenExpired: vi.fn(),
  },
}));

describe('error-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 清除错误消息缓存
    const errorMessageCache = new Map();
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getServerErrorMsg', () => {
    it('应该返回对应状态码的错误消息', () => {
      expect(getServerErrorMsg(500)).toBe('error.500');
      expect(getServerErrorMsg(502)).toBe('error.502');
      expect(getServerErrorMsg(404)).toBe('error.404');
      // 模拟intl.get返回undefined的情况
      vi.mocked(intl.get).mockImplementation((key) => key === 'error.999' ? undefined : key);
      expect(getServerErrorMsg(999)).toBe('error.serverError'); // 不存在的状态码返回默认
    });
  });

  describe('handleError', () => {
    const mockReject = vi.fn();

    it('应该忽略特定接口的错误', async () => {
      await handleError({
        error: {},
        url: '/v1/ping',
        reject: mockReject,
      });
      expect(mockReject).toHaveBeenCalledWith(0);
      expect(message.warning).not.toHaveBeenCalled();

      mockReject.mockClear();
      await handleError({
        error: {},
        url: '/v1/profile',
        reject: mockReject,
      });
      expect(mockReject).toHaveBeenCalledWith(0);
    });

    it('应该处理离线错误', async () => {
      await handleError({
        error: {},
        url: '/api/test',
        reject: mockReject,
        isOffline: true,
      });
      expect(message.warning).toHaveBeenCalledWith('error.networkError');
      expect(mockReject).toHaveBeenCalledWith(0);
    });

    it('应该处理超时错误', async () => {
      await handleError({
        error: { code: 'ECONNABORTED', message: 'TIMEOUT' },
        url: '/api/test',
        reject: mockReject,
      });
      expect(message.warning).toHaveBeenCalledWith('error.timeoutError');
      expect(mockReject).toHaveBeenCalledWith(0);
    });

    it('应该处理取消错误', async () => {
      await handleError({
        error: { message: 'CANCEL' },
        url: '/api/test',
        reject: mockReject,
      });
      expect(message.warning).not.toHaveBeenCalled();
      expect(mockReject).toHaveBeenCalledWith('CANCEL');
    });

    it('应该处理无响应错误', async () => {
      await handleError({
        error: {},
        url: '/api/test',
        reject: mockReject,
      });
      expect(message.warning).toHaveBeenCalledWith('error.serverError');
      expect(mockReject).toHaveBeenCalledWith(0);
    });

    it('应该处理401错误并调用token过期回调', async () => {
      await handleError({
        error: {
          response: {
            status: 401,
            data: { code: 'TOKEN_EXPIRED' },
          },
        },
        url: '/api/test',
        reject: mockReject,
      });
      expect(httpConfig.onTokenExpired).toHaveBeenCalledWith('TOKEN_EXPIRED');
      expect(mockReject).toHaveBeenCalledWith(401);
    });

    it('应该处理500错误并显示描述', async () => {
      const errorData = { description: '服务器内部错误' };
      await handleError({
        error: {
          response: {
            status: 500,
            data: errorData,
          },
        },
        url: '/api/test',
        reject: mockReject,
      });
      expect(message.warning).not.toHaveBeenCalled();
      expect(mockReject).toHaveBeenCalledWith(errorData);
    });

    it('应该处理500错误并显示默认消息', async () => {
      await handleError({
        error: {
          response: {
            status: 500,
            data: {},
          },
        },
        url: '/api/test',
        reject: mockReject,
      });
      expect(message.warning).toHaveBeenCalledWith('error.500');
      expect(mockReject).toHaveBeenCalledWith(500);
    });

    it('应该处理其他状态码错误', async () => {
      const errorData = { code: 400, message: '参数错误' };
      await handleError({
        error: {
          response: {
            status: 400,
            data: errorData,
          },
        },
        url: '/api/test',
        reject: mockReject,
      });
      expect(message.warning).not.toHaveBeenCalled();
      expect(mockReject).toHaveBeenCalledWith(errorData);
    });

    it('应该对相同错误消息进行去重（2秒内只显示一次）', async () => {
      const error = {
        code: 'ECONNABORTED',
        message: 'TIMEOUT',
      };

      // Mock intl 返回具体的错误消息
      vi.mocked(intl.get).mockReturnValue('请求超时，请稍后重试');

      // 第一次调用
      await handleError({ error, url: '/api/test', reject: mockReject });
      expect(message.warning).toHaveBeenCalledTimes(1);
      expect(message.warning).toHaveBeenCalledWith('请求超时，请稍后重试');

      // 1秒后再次调用，应该被去重
      vi.spyOn(Date, 'now').mockReturnValue(2000);
      await handleError({ error, url: '/api/test', reject: mockReject });
      expect(message.warning).toHaveBeenCalledTimes(1);

      // 3秒后再次调用，应该显示
      vi.spyOn(Date, 'now').mockReturnValue(4000);
      await handleError({ error, url: '/api/test', reject: mockReject });
      expect(message.warning).toHaveBeenCalledTimes(2);
    });
  });
});
