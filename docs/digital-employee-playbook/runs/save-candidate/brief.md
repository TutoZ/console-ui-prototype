# 原始需求与意图冻结

原始试跑需求：让业务管理者先保存数字员工的新培训要求，不影响当前接待；保存失败时能保留输入并重试。

由 Agent 理解并生成 plan.json，产品经理不需要填写这个文件。业务域 online_service；对象 training_snapshot；动作 save_candidate；结果 candidate_saved。

复用当前组件库；这次只做候选保存。测试资格与正式应用不在当前实现范围，不通过成功提示假装完成它们。数据仅在独立页面内存中，刷新重置，未接真实后端。规则采自 product.md、domain.md 的候选保存契约与 05-training-spec.md。
