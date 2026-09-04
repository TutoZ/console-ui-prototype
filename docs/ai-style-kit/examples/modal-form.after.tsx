import {
  BTN_INK,
  BTN_SOFT,
  FIELD,
  FIELD_CTRL,
  LABEL,
  Modal,
  cn,
} from '@joysupport/ui';
import '@joysupport/ui/styles.css';

/** 弹窗 CRUD 权威写法：Modal 壳、字段不套卡、取消+确定右下、输入 32px。 */
export function CreateKbModalAfter({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="创建知识库"
      footer={
        <>
          <button type="button" className={BTN_SOFT} onClick={onClose}>
            取消
          </button>
          <button type="button" className={BTN_INK}>
            确定
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={LABEL}>知识库名称</label>
          <input className={cn(FIELD, FIELD_CTRL)} placeholder="请输入" />
        </div>
        <div>
          <label className={LABEL}>说明</label>
          <textarea className={cn(FIELD, 'min-h-[80px] py-2')} placeholder="选填" />
        </div>
      </div>
    </Modal>
  );
}
