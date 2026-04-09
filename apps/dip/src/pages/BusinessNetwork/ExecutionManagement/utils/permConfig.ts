enum RoleIdEnum {
  SuperAdmin = '7dcfcc9c-ad02-11e8-aa06-000c29358ad6',
  SysAdmin = 'd2bd2082-ad03-11e8-aa06-000c29358ad6',
  SecAdmin = 'd8998f72-ad03-11e8-aa06-000c29358ad6',
  AuditAdmin = 'def246f2-ad03-11e8-aa06-000c29358ad6',
  OrgManager = 'e63e1c88-ad03-11e8-aa06-000c29358ad6',
  OrgAudit = 'f06ac18e-ad03-11e8-aa06-000c29358ad6',
}

enum RoleTypeEnum {
  SuperAdmin = 'super_admin',
  SysAdmin = 'sys_admin',
  SecAdmin = 'sec_admin',
  OrgAudit = 'org_audit',
  OrgManager = 'org_manager',
  AuditAdmin = 'audit_admin',
  NormalUser = 'normal_user',
}

let hasSetupDipComponents = false;

const getRoleByUserInfo = (userInfo: any) => {
  const roles = userInfo?.user?.roles || [];
  let isAdmin = false;
  let roleType: RoleTypeEnum = RoleTypeEnum.NormalUser;
  const roleIds = roles.map((item: { id: string }) => item.id);
  const adminRoleMap: Array<[RoleIdEnum, RoleTypeEnum]> = [
    [RoleIdEnum.SuperAdmin, RoleTypeEnum.SuperAdmin],
    [RoleIdEnum.SysAdmin, RoleTypeEnum.SysAdmin],
    [RoleIdEnum.SecAdmin, RoleTypeEnum.SecAdmin],
    [RoleIdEnum.AuditAdmin, RoleTypeEnum.AuditAdmin],
    [RoleIdEnum.OrgManager, RoleTypeEnum.OrgManager],
    [RoleIdEnum.OrgAudit, RoleTypeEnum.OrgAudit],
  ];
  for (const [roleId, role] of adminRoleMap) {
    if (roleIds.includes(roleId)) {
      isAdmin = true;
      roleType = role;
      break;
    }
  }
  return { isAdmin, roleType };
};

export const transformArray = (arr: Array<{ resource_type: string; operation: string[] }>) => {
  return arr.reduce(
    (acc, cur) => {
      acc[cur.resource_type] = cur.operation;
      return acc;
    },
    {} as Record<string, string[]>
  );
};

export const openPermConfig = async (resource: { id: string; name: string; type: string }, microWidgetProps: any) => {
  const mod = await import('@aishu-tech/components/dist/dip-components.min');
  await import('@aishu-tech/components/dist/dip-components.min.css');
  const { apis, components } = mod as any;
  if (!hasSetupDipComponents) {
    const protocol = microWidgetProps?.config?.systemInfo?.location?.protocol || window.location.protocol;
    const host = microWidgetProps?.config?.systemInfo?.location?.hostname || window.location.hostname;
    const port = microWidgetProps?.config?.systemInfo?.location?.port || window.location.port || 443;
    const prefix = microWidgetProps?.prefix || '';
    const lang = microWidgetProps?.language?.getLanguage || 'zh-cn';
    const getToken = () => microWidgetProps?.token?.getToken?.access_token || '';
    const refreshToken = microWidgetProps?.token?.refreshOauth2Token;
    const onTokenExpired = microWidgetProps?.token?.onTokenExpired;
    const theme = microWidgetProps?.theme || '#126ee3';

    apis.setup({
      protocol,
      host,
      port,
      lang,
      prefix,
      getToken,
      refreshToken,
      onTokenExpired,
      theme,
      popupContainer: document.body,
    });
    hasSetupDipComponents = true;
  }

  const { isAdmin, roleType } = getRoleByUserInfo(microWidgetProps?.config?.userInfo);
  const unmount = apis.mountComponent(
    components.PermConfig,
    {
      resource,
      pickerParams: {
        tabs: ['organization', 'group', 'app'],
        range: ['user', 'department', 'group', 'app'],
        isAdmin,
        role: roleType,
      },
      onCancel: () => {
        unmount();
      },
    },
    document.createElement('div')
  );
};
