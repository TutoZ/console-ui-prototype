/**
 * 导航底栏 · 通知中心演示数据
 */

export type SubUserJoinApplication = {
  id: string;
  name: string;
  account: string;
  avatarInitial: string;
  inviteLabel: '京东邀请' | '微信邀请';
  inviteTone: 'jd' | 'wechat';
  seatId: string;
  email: string;
  accountPin?: string;
  wechatNickname?: string;
  phone: string;
  presetRole: string;
  inviteLink: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  /** 审批人（已审批时有值） */
  approverName?: string;
  /** 审批时间（已审批时有值） */
  processedAt?: string;
};

export type NavNotificationCategory = 'official' | 'service' | 'feature';

export type NavNotificationKind = 'task' | 'invite';

export type NavNotification = {
  id: string;
  kind: NavNotificationKind;
  category: NavNotificationCategory;
  tag: string;
  message: string;
  dateGroup: string;
  read: boolean;
  application?: SubUserJoinApplication;
};

export const SUB_USER_JOIN_APPLICATIONS: SubUserJoinApplication[] = [
  {
    id: 'app-gaozhenyu',
    name: '高振宇',
    account: 'gaozhenyu.01',
    avatarInitial: '高',
    inviteLabel: '京东邀请',
    inviteTone: 'jd',
    seatId: 'GZY009',
    email: 'gaozhenyu@jd.com',
    accountPin: 'jd_gaozhenyu_88',
    phone: '13800112233',
    presetRole: '坐席',
    inviteLink: 'https://jingxiaoling.jd.com/invite/join?t=gaozhenyu',
    status: 'pending',
    appliedAt: '2026-08-14 20:15',
  },
  {
    id: 'app-guolina',
    name: '郭丽娜',
    account: 'guolina.22',
    avatarInitial: '郭',
    inviteLabel: '微信邀请',
    inviteTone: 'wechat',
    seatId: 'GLN010',
    email: 'guolina@jd.com',
    wechatNickname: 'wx_guolina_sz',
    phone: '13911223344',
    presetRole: '坐席',
    inviteLink: 'https://jingxiaoling.jd.com/invite/join?t=guolina',
    status: 'pending',
    appliedAt: '2026-08-14 20:45',
  },
];

export const PROCESSED_SUB_USER_JOIN_APPLICATIONS: SubUserJoinApplication[] = [
  {
    id: 'app-lvziliang',
    name: '吕梓良',
    account: 'lvziliang.5',
    avatarInitial: '吕',
    inviteLabel: '京东邀请',
    inviteTone: 'jd',
    seatId: 'LZL001',
    email: 'lvziliang.5@jd.com',
    accountPin: 'jd_lvziliang',
    phone: '13812345678',
    presetRole: '坐席',
    inviteLink: 'https://jingxiaoling.jd.com/invite/join?t=lvziliang',
    status: 'approved',
    appliedAt: '2026-08-14 17:05',
    approverName: 'cooper',
    processedAt: '2026-08-14 17:10',
  },
  {
    id: 'app-zhurui',
    name: '朱瑞',
    account: 'zhurui.88',
    avatarInitial: '朱',
    inviteLabel: '微信邀请',
    inviteTone: 'wechat',
    seatId: 'ZR088',
    email: 'zhurui.88@jd.com',
    wechatNickname: 'wx_zhurui_88',
    phone: '13900001111',
    presetRole: '坐席',
    inviteLink: 'https://jingxiaoling.jd.com/invite/join?t=zhurui',
    status: 'approved',
    appliedAt: '2026-08-14 16:20',
    approverName: 'cooper',
    processedAt: '2026-08-14 16:25',
  },
  {
    id: 'app-wangwei',
    name: '王伟',
    account: 'wangwei.01',
    avatarInitial: '王',
    inviteLabel: '京东邀请',
    inviteTone: 'jd',
    seatId: 'WW001',
    email: 'wangwei.01@jd.com',
    accountPin: 'jd_wangwei_01',
    phone: '13700002222',
    presetRole: '语音坐席',
    inviteLink: 'https://jingxiaoling.jd.com/invite/join?t=wangwei',
    status: 'rejected',
    appliedAt: '2026-08-13 14:30',
    approverName: 'cooper',
    processedAt: '2026-08-13 14:35',
  },
];

export function buildDemoNavNotifications(): NavNotification[] {
  return [
    {
      id: 'n-invite-1',
      kind: 'invite',
      category: 'official',
      tag: '子用户邀请',
      message: '高振宇 申请加入团队，预设角色：坐席',
      dateGroup: '2026-08-14',
      read: false,
      application: SUB_USER_JOIN_APPLICATIONS[0],
    },
    {
      id: 'n-invite-2',
      kind: 'invite',
      category: 'official',
      tag: '子用户邀请',
      message: '郭丽娜 申请加入团队，预设角色：坐席',
      dateGroup: '2026-08-14',
      read: false,
      application: SUB_USER_JOIN_APPLICATIONS[1],
    },
    {
      id: 'n-task-1',
      kind: 'task',
      category: 'service',
      tag: '数字员工',
      message: '您委托的任务 室内设计小红书文案创作 已完成，请查看结果',
      dateGroup: '2026-05-08',
      read: false,
    },
    {
      id: 'n-task-2',
      kind: 'task',
      category: 'service',
      tag: '数字员工',
      message: '您委托的任务 阿里巴巴服务器营销文案 已完成，请查看结果',
      dateGroup: '2026-05-08',
      read: true,
    },
    {
      id: 'n-task-3',
      kind: 'task',
      category: 'feature',
      tag: '数字员工',
      message: '您委托的任务 阿里巴巴服务器推广文案 已完成，请查看结果',
      dateGroup: '2026-05-03',
      read: false,
    },
    {
      id: 'n-task-4',
      kind: 'task',
      category: 'feature',
      tag: '数字员工',
      message: '技能创建流程已更新，支持确认写入与专家视图 Diff',
      dateGroup: '2026-05-03',
      read: true,
    },
  ];
}

export type NavNotificationTab = 'all' | 'official' | 'approval';

export function countUnreadNotifications(items: NavNotification[]): number {
  return items.filter((item) => !item.read).length;
}

export function countByCategory(items: NavNotification[], category: NavNotificationCategory): number {
  return items.filter((item) => item.category === category && !item.read).length;
}

export function countApprovalNotifications(items: NavNotification[]): number {
  return items.filter(
    (item) => item.kind === 'invite' && item.application?.status === 'pending' && !item.read,
  ).length;
}

export function filterNotifications(items: NavNotification[], tab: NavNotificationTab): NavNotification[] {
  if (tab === 'all') return items;
  if (tab === 'approval') return items.filter((item) => item.kind === 'invite');
  return items.filter((item) => item.category === 'official');
}

export function groupNotificationsByDate(items: NavNotification[]): Array<[string, NavNotification[]]> {
  const map = new Map<string, NavNotification[]>();
  for (const item of items) {
    const list = map.get(item.dateGroup) ?? [];
    list.push(item);
    map.set(item.dateGroup, list);
  }
  return [...map.entries()];
}
