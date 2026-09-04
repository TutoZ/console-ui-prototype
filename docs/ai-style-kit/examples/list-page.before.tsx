/** 外来 AI 常见稿：shadcn + 蓝主色 + 卡片包表 + 大按钮。仅作反例，禁止照抄。 */
export function KnowledgeListBefore() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">知识库</h1>
        <p className="mt-2 text-slate-500">管理你的知识文档</p>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex gap-3">
          <input
            className="h-12 flex-1 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-blue-500"
            placeholder="搜索..."
          />
          <button className="h-12 rounded-xl bg-blue-600 px-6 font-medium text-white">
            新建知识库
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-slate-100 text-left text-sm text-slate-600">
            <tr>
              <th className="p-4">名称</th>
              <th className="p-4">状态</th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-4">售后政策库</td>
              <td className="p-4">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                  解析中
                </span>
              </td>
              <td className="p-4">
                <button className="text-blue-600">编辑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="mt-6 flex justify-center gap-2">
          <button className="rounded-lg border px-3 py-2">1</button>
          <button className="rounded-lg bg-blue-600 px-3 py-2 text-white">2</button>
        </div>
      </div>
    </div>
  );
}
