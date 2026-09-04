import {
  BTN_INK,
  LIST_PAGE_SIZE,
  ListPagination,
  OnlineEmptyRow,
  OnlinePageHeader,
  OnlineSectionHeader,
  PAGE,
  SEARCH_FIELD,
  badgeClass,
  onlineTableClass,
} from '@joysupport/ui';
import '@joysupport/ui/styles.css';

/** 列表 CRUD 权威写法：标题与工具同一行，扁平表，语义徽章，ListPagination。 */
export function KnowledgeListAfter() {
  const total = 12;
  const page = 1;
  const rows = [{ id: '1', name: '售后政策库', status: 'live' as const }];

  return (
    <div className={PAGE}>
      <OnlinePageHeader title="知识库">
        <input className={SEARCH_FIELD} placeholder="搜索知识库" />
        <button type="button" className={BTN_INK}>
          新建
        </button>
      </OnlinePageHeader>

      <OnlineSectionHeader title="全部知识库" description="文档解析完成后可用于员工检索" />

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
                    <button type="button" className="text-xs font-medium text-neutral-600 hover:text-neutral-900">
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
