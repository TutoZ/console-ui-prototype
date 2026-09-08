export type MemoryPayload = {
  sessionId: string | null;
  userId: string;
  userText: string;
  assistantText: string;
  skillId?: string | null;
  taskType?: string;
  generatedImageUrls?: string[];
};

/** 侧车记忆已移除：写入暂为空操作，保留签名供调用方兼容。 */
export async function writeMemory(_payload: MemoryPayload): Promise<void> {
  return;
}
