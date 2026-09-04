/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 技能构建工作台入口：
 * - remix AOP 全能力（草稿 / ZIP / 校验发布 / 测试）
 * - 左对话「确认坞」：AI Skill 草案 + 实时进展 + 点选/轻改
 * - 右侧可收展：长表单 / 文档 / 测试（默认收起，避免与左坞重复）
 */

import React from 'react';
import type { Skill } from '@/src/types';
import { BuildSkillModal } from './BuildSkillModal';

export type SkillStudioPublishPayload = {
  name: string;
  description: string;
  skillCode: string;
  draftId: string;
  files: Array<{ path: string; content: string }>;
  source: NonNullable<Skill['source']>;
  skillId?: string;
  versionNote?: string;
};

export interface SkillStudioWorkspaceProps {
  editingSkill?: Skill | null;
  onBack: () => void;
  onPublish: (payload: SkillStudioPublishPayload) => void;
  showToast?: (message: string) => void;
  initialMode?: 'interactive' | 'zip';
  /** 智能创作入口带入，进入后自动开聊 */
  initialPrompt?: string | null;
  /** 未进入多轮时的返回文案 */
  closeLabel?: string;
}

export const SkillStudioWorkspace: React.FC<SkillStudioWorkspaceProps> = ({
  editingSkill,
  onBack,
  onPublish,
  initialMode = 'interactive',
  initialPrompt,
  closeLabel,
}) => {
  return (
    <BuildSkillModal
      open
      onClose={onBack}
      draftSkillId={editingSkill?.id ?? null}
      initialMode={initialMode}
      initialPrompt={initialPrompt}
      closeLabel={closeLabel}
      onPublished={(skill) => {
        const note =
          (skill as Skill & { versionNote?: string }).versionNote ||
          (skill.status === 'draft' ? '保存草稿' : 'AOP 工作台发布');
        onPublish({
          name: skill.name,
          description: skill.description,
          skillCode: skill.skillCode || skill.enId || skill.id,
          draftId: skill.id,
          files: skill.files || [],
          source: skill.source || (initialMode === 'zip' ? 'upload' : 'nl'),
          skillId: skill.id,
          versionNote: note,
        });
      }}
    />
  );
};
