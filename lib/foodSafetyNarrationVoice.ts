/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 食安险讲解配音：按句串行；支持暂停/继续；解锁不重播、不探听正文。
 */

import {
  formatNarrationSubtitle,
  getNarrationCues,
  type NarrationCue,
  type NarrationSegmentId,
} from '@/lib/foodSafetyNarrationScript';

export type NarrationCueView = {
  segment: NarrationSegmentId;
  index: number;
  text: string;
  audioId: string;
};

type CueListener = (cue: NarrationCueView | null) => void;
type IdleListener = () => void;

let currentAudio: HTMLAudioElement | null = null;
let advanceTimer: number | null = null;
let muted = false;
let unlocked = false;
let playing = false;
let paused = false;
let currentSegment: NarrationSegmentId | null = null;
let queue: NarrationCue[] = [];
let index = 0;
let segmentFinished = true;
let pendingSegment: NarrationSegmentId | null = null;
let generation = 0;
/** 当前句已播放偏移（暂停用） */
let cueElapsedMs = 0;
let cueStartedAt = 0;

const cueListeners = new Set<CueListener>();
const idleListeners = new Set<IdleListener>();

function clearAdvanceTimer() {
  if (advanceTimer != null) {
    window.clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

function emitCue(cue: NarrationCueView | null) {
  cueListeners.forEach((fn) => fn(cue));
}

function emitIdle() {
  // copy：回调里可能删自己
  [...idleListeners].forEach((fn) => fn());
}

function stopAudioElement() {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio.removeAttribute('src');
    currentAudio.load();
    currentAudio = null;
  }
}

export function isNarrationMuted(): boolean {
  return muted;
}

export function isNarrationUnlocked(): boolean {
  return unlocked;
}

export function isNarrationPlaying(): boolean {
  return playing && !paused;
}

export function isNarrationPaused(): boolean {
  return paused;
}

export function subscribeNarrationCue(listener: CueListener): () => void {
  cueListeners.add(listener);
  return () => cueListeners.delete(listener);
}

export function subscribeNarrationIdle(listener: IdleListener): () => void {
  idleListeners.add(listener);
  return () => idleListeners.delete(listener);
}

/** 当前段全部播完后执行一次；若已空闲则立即执行 */
export function whenNarrationIdle(fn: () => void): () => void {
  if (!playing && !paused) {
    fn();
    return () => undefined;
  }
  const wrap = () => {
    idleListeners.delete(wrap);
    fn();
  };
  idleListeners.add(wrap);
  return () => idleListeners.delete(wrap);
}

export function setNarrationMuted(next: boolean): void {
  muted = next;
  if (muted) {
    stopAudioElement();
  } else if (playing && !paused && unlocked) {
    // 取消静音：从当前句重播剩余（简化为重播当句）
    playCurrent({ resume: true });
  }
}

/** 解锁自动播放；绝不探听正文音频，避免首句叠播 */
export function unlockNarrationVoice(): void {
  unlocked = true;
}

export function stopNarrationVoice(): void {
  generation += 1;
  clearAdvanceTimer();
  stopAudioElement();
  playing = false;
  paused = false;
  pendingSegment = null;
  currentSegment = null;
  segmentFinished = true;
  cueElapsedMs = 0;
  cueStartedAt = 0;
  emitCue(null);
}

/** 暂停：停音频与推进；无声间隙也挂起，避免后续段自动开声 */
export function pauseNarrationVoice(): void {
  if (paused) return;
  paused = true;
  if (cueStartedAt) {
    cueElapsedMs += Math.max(0, Date.now() - cueStartedAt);
  }
  cueStartedAt = 0;
  clearAdvanceTimer();
  if (currentAudio) {
    currentAudio.pause();
  }
}

/** 继续：从当前句剩余时长播完；若段已就绪但未开声则开播 */
export function resumeNarrationVoice(): void {
  if (!paused) return;
  paused = false;
  unlockNarrationVoice();
  if (playing && queue.length) {
    playCurrent({ resume: true });
    return;
  }
  // 停在段间空档时：解除挂起并通知空闲，让自动连播继续
  if (segmentFinished) {
    emitIdle();
  }
}

function scheduleAdvance(ms: number) {
  clearAdvanceTimer();
  const gen = generation;
  const wait = Math.max(80, ms);
  cueStartedAt = Date.now();
  advanceTimer = window.setTimeout(() => {
    if (gen !== generation || paused) return;
    advance();
  }, wait);
}

function advance() {
  clearAdvanceTimer();
  stopAudioElement();
  cueElapsedMs = 0;
  cueStartedAt = 0;

  if (index < queue.length - 1) {
    index += 1;
    playCurrent();
    return;
  }

  playing = false;
  paused = false;
  segmentFinished = true;
  emitIdle();

  if (pendingSegment && !paused) {
    const next = pendingSegment;
    pendingSegment = null;
    startSegment(next);
  }
}

function playCurrent(opts?: { resume?: boolean }) {
  const cue = queue[index];
  if (!cue) {
    playing = false;
    segmentFinished = true;
    emitIdle();
    return;
  }

  playing = true;
  segmentFinished = false;
  emitCue({
    segment: currentSegment!,
    index,
    text: formatNarrationSubtitle(cue.text),
    audioId: cue.audioId,
  });

  const gen = generation;
  const remain = Math.max(200, cue.durationMs - (opts?.resume ? cueElapsedMs : 0));
  if (!opts?.resume) cueElapsedMs = 0;

  if (muted || !unlocked || paused) {
    if (!paused) scheduleAdvance(remain);
    return;
  }

  stopAudioElement();
  const audio = new Audio(`/narration/${cue.audioId}.mp3`);
  audio.preload = 'auto';
  currentAudio = audio;

  const finish = () => {
    if (gen !== generation || paused) return;
    clearAdvanceTimer();
    if (currentAudio === audio) currentAudio = null;
    advance();
  };

  audio.onended = finish;
  audio.onerror = finish;

  const startAt = opts?.resume ? Math.min(cue.durationMs / 1000, cueElapsedMs / 1000) : 0;

  void audio
    .play()
    .then(() => {
      if (gen !== generation || paused) return;
      if (startAt > 0.05 && Number.isFinite(startAt)) {
        try {
          audio.currentTime = startAt;
        } catch {
          /* ignore seek errors */
        }
      }
      // 有声时以 onended 为准；定时器只做兜底，避免 durationMs 偏短提前切字幕
      const mediaMs =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? Math.ceil(audio.duration * 1000)
          : remain;
      scheduleAdvance(Math.max(remain, mediaMs) + 1200);
    })
    .catch(() => {
      // 未解锁时按时长推进；解锁后由 resume/外层再播
      scheduleAdvance(remain);
    });
}

function startSegment(segment: NarrationSegmentId) {
  generation += 1;
  clearAdvanceTimer();
  stopAudioElement();

  currentSegment = segment;
  queue = getNarrationCues(segment);
  index = 0;
  pendingSegment = null;
  // 保留用户暂停态：切段后仍挂起，等 resume 再出声
  cueElapsedMs = 0;
  cueStartedAt = 0;

  if (queue.length === 0) {
    playing = false;
    segmentFinished = true;
    emitCue(null);
    if (!paused) emitIdle();
    return;
  }

  playCurrent();
}

/**
 * 请求播放某段。
 * force：立即切段（仅重置/进页用）
 * 同段播放中或已播完：不重播
 */
export function requestNarrationSegment(
  segment: NarrationSegmentId | null,
  opts?: { force?: boolean },
): void {
  if (!segment) {
    if (opts?.force) stopNarrationVoice();
    return;
  }

  // Strict Mode / 连点：同段已在播首句时，force 也不重开，避免首句叠播
  if (
    currentSegment === segment &&
    playing &&
    index === 0 &&
    !segmentFinished
  ) {
    return;
  }

  if (!opts?.force && currentSegment === segment) {
    if (playing || segmentFinished) return;
  }

  if ((playing || paused) && !opts?.force) {
    pendingSegment = segment;
    return;
  }

  startSegment(segment);
}

/** 解锁后：若正在播但没有真实音频，补播当前句（不重开整段；不解除用户暂停） */
export function ensureNarrationAudible(): void {
  unlockNarrationVoice();
  if (paused) return;
  if (playing && !currentAudio && !muted) {
    playCurrent({ resume: true });
  }
}
