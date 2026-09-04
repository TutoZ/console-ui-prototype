/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 按钮原地反馈：loading → done，替代轻量成功 Toast。
 */

import { useCallback, useRef, useState } from 'react';
import {
  pickMockLatencyMs,
  type MockLatencyProfile,
} from '@/lib/mockLatency';

export type InlineActionPhase = 'idle' | 'loading' | 'done';

type UseInlineActionOptions = {
  profile?: MockLatencyProfile;
  /** done 停留后回到 idle；0 表示保持 done */
  resetAfterMs?: number;
};

export function useInlineAction(
  action: () => void | Promise<void>,
  options: UseInlineActionOptions = {},
) {
  const { profile = 'save', resetAfterMs = 0 } = options;
  const [phase, setPhase] = useState<InlineActionPhase>('idle');
  const busyRef = useRef(false);
  const actionRef = useRef(action);
  actionRef.current = action;

  const run = useCallback(async () => {
    if (busyRef.current || phase === 'loading') return;
    busyRef.current = true;
    setPhase('loading');
    const ms = pickMockLatencyMs(profile);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });
    try {
      await actionRef.current();
      setPhase('done');
      if (resetAfterMs > 0) {
        window.setTimeout(() => {
          setPhase('idle');
          busyRef.current = false;
        }, resetAfterMs);
      } else {
        busyRef.current = false;
      }
    } catch {
      setPhase('idle');
      busyRef.current = false;
    }
  }, [phase, profile, resetAfterMs]);

  const reset = useCallback(() => {
    busyRef.current = false;
    setPhase('idle');
  }, []);

  return { phase, run, reset, busy: phase === 'loading' };
}
