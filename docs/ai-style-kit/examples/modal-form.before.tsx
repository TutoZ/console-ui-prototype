/** 外来 AI 常见稿：蓝主按钮、红底删除、表单套大卡片、蓝 focus、大圆角。仅作反例。 */
export function CreateKbModalBefore() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <h2 className="text-2xl font-bold">创建知识库</h2>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <label className="text-sm font-semibold text-slate-800">名称</label>
          <input
            className="mt-2 h-12 w-full rounded-xl border px-4 focus:ring-2 focus:ring-indigo-500"
            placeholder="请输入名称"
          />
          <label className="mt-4 text-sm font-semibold text-slate-800">说明</label>
          <textarea className="mt-2 h-28 w-full rounded-xl border px-4 py-3" />
        </div>
        <div className="mt-8 flex justify-between">
          <button className="h-11 rounded-xl bg-red-600 px-5 text-white">删除</button>
          <div className="flex gap-3">
            <button className="h-11 rounded-xl px-5 text-slate-600">取消</button>
            <button className="h-11 rounded-xl bg-indigo-600 px-6 text-white">保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}
