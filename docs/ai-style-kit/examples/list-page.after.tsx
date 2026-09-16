import {
  BTN_INK,
  LIST_PAGE_SIZE,
  ListPagination,
  ONLINE_PAGE,
  OnlineEmptyRow,
  OnlinePageHeader,
  SEARCH_FIELD,
  badgeClass,
  cn,
  onlineTableClass,
} from '@joysupport/ui';
import '@joysupport/ui/styles.css';

/** 列表 CRUD 权威写法（对齐员工知识）：标题与工具同一行，扁平表，无表上区块头。 */
export function KnowledgeListAfter() {
  const total = 12;
  const page = 1;
  const rows = [{ id: '1', name: '售后政策库', status: 'live' as const }];

  return (
    <div className={ONLINE_PAGE}>
      <OnlinePageHeader title="员工知识">
        <div className="relative w-full sm:w-64 shrink-0">
          <input
            className={cn(SEARCH_FIELD, 'w-full pl-9 pr-4')}
            placeholder="搜索知识库名..."
          />
        </div>
        <button type="button" className={BTN_INK}>
          新建知识库
        </button>
      </OnlinePageHeader>

      <div className={onlineTableClass.wrap}>
        <table className={onlineTableClass.table}>
          <thead>
            <tr className={onlineTableClass.headRow}>
              <th className={onlineTableClass.thFirst}>名称</th>
              <th className={onlineTableClass.th}>状态</th>
              <th className={onlineTableClass.thLast}>操作</th>
            </tr>
          </thead>
          <tbody className={onlineTableClass.body}>
            {rows.length === 0 ? (
              <OnlineEmptyRow colSpan={3}>暂无数据</OnlineEmptyRow>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className={onlineTableClass.row}>
                  <td className={onlineTableClass.tdFirst}>{row.name}</td>
                  <td className={onlineTableClass.td}>
                    <span className={badgeClass('live')}>解析中</span>
                  </td>
                  <td className={onlineTableClass.tdLast}>
                    <button
                      type="button"
                      className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > LIST_PAGE_SIZE ? (
        <ListPagination page={page} total={total} onPageChange={() => {}} />
      ) : null}
    </div>
  );
}
