import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Download,
  Play,
  Pause,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  FileText,
  AlertCircle as Flag,
  RotateCcw,
} from '@/lib/icons';
import { CallRecord, CallUtterance } from './callRecordsTypes';
import { CallLabelDetailModal } from './CallLabelDetailModal';
import { audioSynth, formatDurationSeconds, downloadFileBlob } from './audioHelper';
import { cn } from '@/lib/utils';

interface CallDetailDrawerProps {
  call: CallRecord;
  currentIndex: number;
  totalCalls: number;
  onClose: () => void;
  onPrevCall: () => void;
  onNextCall: () => void;
  onUpdateCall: (updated: CallRecord) => void;
  showToast: (msg: string) => void;
}

export const CallDetailDrawer: React.FC<CallDetailDrawerProps> = ({
  call,
  currentIndex,
  totalCalls,
  onClose,
  onPrevCall,
  onNextCall,
  onUpdateCall,
  showToast,
}) => {
  // Label Detail Modal
  const [showLabelModal, setShowLabelModal] = useState(false);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackSec, setCurrentPlaybackSec] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [playingUtteranceId, setPlayingUtteranceId] = useState<string | null>(null);

  // Utterance Correcting & Flagging Modals
  const [correctingUtterance, setCorrectingUtterance] = useState<{ id: string; originalText: string; correctedText: string } | null>(null);
  const [flaggingUtteranceId, setFlaggingUtteranceId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state when call record changes
  useEffect(() => {
    setCurrentPlaybackSec(0);
    if (autoPlayNext) {
      setIsPlaying(true);
      audioSynth.startCallStreamingTone();
    } else {
      setIsPlaying(false);
      audioSynth.stopTone();
    }
  }, [call.id, autoPlayNext]);

  // Handle global playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentPlaybackSec((prev) => {
          if (prev >= call.durationSeconds) {
            setIsPlaying(false);
            audioSynth.stopTone();
            return call.durationSeconds;
          }
          return Math.min(prev + 1 * playbackSpeed, call.durationSeconds);
        });
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, call.durationSeconds]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showLabelModal && !correctingUtterance) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showLabelModal, correctingUtterance]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioSynth.stopTone();
    };
  }, []);

  const toggleGlobalPlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioSynth.stopTone();
    } else {
      setIsPlaying(true);
      audioSynth.startCallStreamingTone();
      showToast('开始播放录音');
    }
  };

  const handleSpeedCycle = () => {
    const speeds: (1 | 1.25 | 1.5 | 2)[] = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
    showToast(`播放倍速切换为 ${speeds[nextIdx]}x`);
  };

  const playUtteranceAudio = (utt: CallUtterance) => {
    setPlayingUtteranceId(utt.id);
    audioSynth.playSentenceBeep(utt.sender, (utt.audioDurationSeconds || 2) * 1000);
    setTimeout(() => {
      setPlayingUtteranceId(null);
    }, (utt.audioDurationSeconds || 2) * 1000);
  };

  const handleCopyCallId = async () => {
    try {
      await navigator.clipboard.writeText(call.id);
      showToast(`已复制会话 ID: ${call.id}`);
    } catch {
      showToast(`会话 ID: ${call.id}`);
    }
  };

  const handleDownloadAudio = () => {
    const wavBlob = audioSynth.generateCallWavBlob(call.durationSeconds);
    downloadFileBlob(wavBlob, `${call.id}-audio.wav`);
    showToast(`已导出并下载录音文件: ${call.id}-audio.wav`);
  };

  const handleDownloadTranscript = () => {
    let content = `==============================\n`;
    content += `呼叫记录对话明细\n`;
    content += `Call ID: ${call.id}\n`;
    content += `呼入时间: ${call.callInTime}\n`;
    content += `客户号码: ${call.customerPhone}\n`;
    content += `数字员工: ${call.agentName}\n`;
    content += `号码归属地: ${call.location}\n`;
    content += `通话时长: ${call.duration}\n`;
    content += `挂断方: ${call.hangupParty}\n`;
    content += `通话标签: ${call.tags.join(', ')}\n`;
    content += `判定标签: ${call.llmLabel}\n`;
    content += `==============================\n\n`;

    call.utterances.forEach((u, i) => {
      content += `[${i + 1}] [${u.timestamp}] [${u.speakerName}]`;
      if (u.nodeName) content += ` (${u.nodeName})`;
      content += `\n${u.text}\n`;
      if (u.correction) {
        content += `【文本纠错】原内容: ${u.correction.originalText} => 修正: ${u.correction.correctedText}\n`;
      }
      if (u.remark) {
        content += `【质检备注】${u.remark}\n`;
      }
      if (u.flag) {
        content += `【质检标记】${u.flag}\n`;
      }
      content += `\n`;
    });

    if (call.sessionRemark) {
      content += `==============================\n会话备注: ${call.sessionRemark}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadFileBlob(blob, `${call.id}-transcript.txt`);
    showToast(`已导出对话记录: ${call.id}-transcript.txt`);
  };

  // Save utterance correction
  const handleSaveUtteranceCorrection = () => {
    if (!correctingUtterance) return;
    const updatedUtterances = call.utterances.map((u) => {
      if (u.id === correctingUtterance.id) {
        return {
          ...u,
          text: correctingUtterance.correctedText,
          correction: {
            originalText: correctingUtterance.originalText,
            correctedText: correctingUtterance.correctedText,
            correctedAt: new Date().toLocaleTimeString(),
          },
        };
      }
      return u;
    });
    onUpdateCall({ ...call, utterances: updatedUtterances });
    setCorrectingUtterance(null);
    showToast('ASR 转写纠错已生效');
  };

  // Set utterance flag
  const handleSetUtteranceFlag = (flagName: string) => {
    if (!flaggingUtteranceId) return;
    const updatedUtterances = call.utterances.map((u) =>
      u.id === flaggingUtteranceId ? { ...u, flag: u.flag === flagName ? undefined : flagName } : u,
    );
    onUpdateCall({ ...call, utterances: updatedUtterances });
    setFlaggingUtteranceId(null);
    showToast(`质检标记已更新为: ${flagName}`);
  };

  return (
    <>
      {/* Background Overlay (Grays out table) */}
      <div
        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] z-40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-detail-drawer-title"
        className="fixed top-0 right-0 bottom-0 w-[88vw] max-w-[1440px] min-w-[960px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-250 border-l border-neutral-200"
      >
        {/* 1. Header Bar */}
        <div className="h-14 px-5 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center cursor-pointer transition-colors"
              title="关闭详情"
            >
              <X size={18} />
            </button>
            <span className="text-neutral-300 select-none">|</span>
            <span id="call-detail-drawer-title" className="text-base font-semibold text-neutral-900 tracking-tight">
              {call.customerPhone}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCallId}
              className="h-8 px-2.5 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Copy size={13} className="text-neutral-400" />
              查看会话ID
            </button>
            <button
              type="button"
              onClick={handleDownloadAudio}
              className="h-8 px-2.5 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download size={13} className="text-neutral-400" />
              下载音频
            </button>
            <button
              type="button"
              onClick={handleDownloadTranscript}
              className="h-8 px-2.5 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileText size={13} className="text-neutral-400" />
              下载会话
            </button>
          </div>
        </div>

        {/* 2. Main Content Area (Two Columns) */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left Column: Properties & Metrics (Fixed ~340px width) */}
          <div className="w-[340px] shrink-0 border-r border-neutral-200 bg-neutral-50/50 p-4 overflow-y-auto space-y-4 custom-scrollbar">
            {/* Card 1: 呼叫属性明细 */}
            <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-bold text-neutral-900 tracking-tight">呼叫属性明细</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium select-all">
                  {call.id}
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-neutral-600">
                <div className="flex items-start justify-between">
                  <span className="text-neutral-600 shrink-0">callid:</span>
                  <span className="font-mono text-[11px] text-neutral-800 text-right break-all ml-2 select-all">
                    {call.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">呼入时间:</span>
                  <span className="font-mono text-neutral-800">{call.callInTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">客户号码:</span>
                  <span className="font-mono text-neutral-800">{call.customerPhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">数字员工名:</span>
                  <span className="text-sky-600 hover:text-sky-700 font-medium cursor-pointer">
                    {call.agentName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">号码归属地:</span>
                  <span className="text-neutral-800">{call.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">通话时长:</span>
                  <span className="font-mono text-neutral-800">{call.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">对话轮次:</span>
                  <span className="font-medium text-neutral-800">{call.rounds} 轮</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">挂断方:</span>
                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-medium">
                    {call.hangupParty}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-neutral-100">
                  <div className="text-[11px] text-neutral-600 mb-1.5">通话标签:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {call.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: 触发标签判定 */}
            <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-neutral-900 tracking-tight">触发标签判定</h3>
                <button
                  type="button"
                  onClick={() => setShowLabelModal(true)}
                  className="text-[11px] text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-0.5 cursor-pointer"
                >
                  标签判定详情
                  <ChevronRight size={12} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] text-neutral-600">大模型标签:</div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-medium">
                  <Sparkles size={12} className="text-cyan-600 shrink-0" />
                  {call.llmLabel}
                </div>
              </div>
            </div>

            {/* Card 3: 关键指标 */}
            <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-xs">
              <h3 className="text-xs font-bold text-neutral-900 mb-3 tracking-tight">关键指标</h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-600 inline-flex items-center gap-1">
                      AI说话时长占比
                      <span title="AI播报音频时长占整通通话总时长的百分比" className="text-neutral-500 cursor-help">
                        <HelpCircle size={11} />
                      </span>
                    </span>
                    <span className="font-mono font-bold text-neutral-900">
                      {call.metrics.aiSpeechRatio}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.min(call.metrics.aiSpeechRatioNum, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                  <span className="text-neutral-600 inline-flex items-center gap-1">
                    最长客户叙述
                    <span title="客户单次连续说话的最长录音时长" className="text-neutral-500 cursor-help">
                      <HelpCircle size={11} />
                    </span>
                  </span>
                  <span className="font-mono font-medium text-neutral-900">
                    {call.metrics.longestCustomerNarrative}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                  <span className="text-neutral-600 inline-flex items-center gap-1">
                    最长AI独白
                    <span title="数字员工单句播报的最长连续时长" className="text-neutral-500 cursor-help">
                      <HelpCircle size={11} />
                    </span>
                  </span>
                  <span className="font-mono font-medium text-neutral-900">
                    {call.metrics.longestAiMonologue}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                  <span className="text-neutral-600">对话轮次</span>
                  <span className="font-medium text-neutral-900">{call.metrics.totalRounds} 轮</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dialogue Stream & Review Inspection */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Scrollable Conversation List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {call.utterances.map((utt) => {
                const isAi = utt.sender === 'ai';
                const isAudioPlaying = playingUtteranceId === utt.id;

                return (
                  <div
                    key={utt.id}
                    className={cn(
                      'flex flex-col max-w-[85%]',
                      isAi ? 'self-start items-start' : 'self-end items-end ml-auto',
                    )}
                  >
                    {/* Utterance Meta Header */}
                    {isAi ? (
                      <div className="text-[11px] text-neutral-600 mb-1.5 flex items-center gap-1.5 font-medium">
                        <span>{utt.nodeName || '来自：普通节点'}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-600 mb-1.5 font-medium">
                        客户 · {utt.timestamp}
                      </div>
                    )}

                    {/* Utterance Card Bubble */}
                    <div
                      className={cn(
                        'relative rounded-xl text-xs leading-relaxed transition-all',
                        isAi
                          ? 'bg-white border border-neutral-200/90 text-neutral-800 p-4 shadow-xs max-w-xl'
                          : 'bg-blue-600 text-white p-3.5 shadow-sm max-w-lg',
                      )}
                    >
                      {/* Top right quick actions */}
                      <div
                        className={cn(
                          'absolute top-2.5 right-2.5 flex items-center gap-1.5',
                          isAi ? 'text-neutral-400' : 'text-blue-100',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => playUtteranceAudio(utt)}
                          title="播放该句录音"
                          className={cn(
                            'p-1 rounded-md transition-colors cursor-pointer',
                            isAudioPlaying
                              ? 'text-sky-600 bg-sky-50'
                              : isAi
                                ? 'hover:text-neutral-700 hover:bg-neutral-100'
                                : 'hover:text-white hover:bg-blue-500',
                          )}
                        >
                          <Volume2 size={13} className={isAudioPlaying ? 'animate-pulse' : ''} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(utt.text);
                            showToast('已复制内容');
                          }}
                          title="复制文本"
                          className={cn(
                            'p-1 rounded-md transition-colors cursor-pointer',
                            isAi ? 'hover:text-neutral-700 hover:bg-neutral-100' : 'hover:text-white hover:bg-blue-500',
                          )}
                        >
                          <Copy size={13} />
                        </button>
                      </div>

                      {/* Message Speech Text */}
                      <p className={cn('pr-12 select-text font-normal', isAi ? 'text-neutral-800' : 'text-white')}>
                        {utt.text}
                      </p>

                      {/* Display correction if exists (only on customer side) */}
                      {utt.correction && !isAi && (
                        <div className="mt-2 pt-2 text-[11px] border-t border-blue-500/60 text-blue-100">
                          <span className="font-medium text-emerald-600 bg-emerald-50 px-1 rounded mr-1">
                            已纠错
                          </span>
                          原转写: “{utt.correction.originalText}”
                        </div>
                      )}

                      {/* Display flag if exists (only on customer side) */}
                      {utt.flag && !isAi && (
                        <div className="mt-1.5 inline-block">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                            <Flag size={10} />
                            {utt.flag}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Utterance Bottom Info & Actions */}
                    {isAi ? (
                      <div className="mt-1.5 flex items-center text-[11px] text-neutral-600">
                        <span>该消息播报前 {utt.nonInterruptSeconds ?? 0} 秒不可被打断</span>
                      </div>
                    ) : (
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-neutral-600">
                        <button
                          type="button"
                          onClick={() => setFlaggingUtteranceId(utt.id)}
                          className="hover:text-sky-600 cursor-pointer transition-colors"
                        >
                          标记
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCorrectingUtterance({
                              id: utt.id,
                              originalText: utt.text,
                              correctedText: utt.text,
                            })
                          }
                          className="hover:text-sky-600 font-medium cursor-pointer transition-colors"
                        >
                          纠错
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* End of Session Divider */}
              <div className="py-6 flex items-center justify-center">
                <div className="flex items-center gap-3 text-xs text-neutral-400 font-medium select-none">
                  <span className="w-16 h-px bg-neutral-200" />
                  <span>会话结束</span>
                  <span className="w-16 h-px bg-neutral-200" />
                </div>
              </div>
            </div>

            {/* 3. Global Bottom Audio Player & Navigation Assistant */}
            <div className="h-16 px-6 border-t border-neutral-200 bg-white flex items-center justify-between shadow-xs shrink-0 select-none">
              {/* Left Audio Controls */}
              <div className="flex items-center gap-4 flex-1 max-w-xl">
                {/* Play/Pause Button */}
                <button
                  type="button"
                  onClick={toggleGlobalPlay}
                  className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shadow-xs transition-transform active:scale-95 shrink-0"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>

                {/* Current Time Display */}
                <span className="font-mono text-xs text-neutral-600 w-11 shrink-0">
                  {formatDurationSeconds(currentPlaybackSec)}
                </span>

                {/* Scrubber Timeline */}
                <div className="relative flex-1 flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={call.durationSeconds}
                    value={currentPlaybackSec}
                    onChange={(e) => setCurrentPlaybackSec(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  />
                </div>

                {/* Total Duration Display */}
                <span className="font-mono text-xs text-neutral-500 w-11 shrink-0">
                  {formatDurationSeconds(call.durationSeconds)}
                </span>

                {/* Speed Multiplier Button */}
                <button
                  type="button"
                  onClick={handleSpeedCycle}
                  className="px-2 py-0.5 rounded border border-neutral-200 hover:border-neutral-300 text-[11px] font-mono font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer shrink-0 transition-colors"
                >
                  X{playbackSpeed}
                </button>
              </div>

              {/* Right Browsing Assistant & Turn Switching */}
              <div className="flex items-center gap-4">
                {/* Auto Play Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-700">
                  <input
                    type="checkbox"
                    checked={autoPlayNext}
                    onChange={(e) => setAutoPlayNext(e.target.checked)}
                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>自动播放</span>
                  <span title="切换上一通/下一通通话时自动开启录音试听" className="text-neutral-500 cursor-help">
                    <HelpCircle size={12} />
                  </span>
                </label>

                <div className="h-4 w-px bg-neutral-200" />

                {/* Prev & Next Call Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPrevCall}
                    disabled={currentIndex <= 0}
                    className="h-8 px-3 rounded-md border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ChevronLeft size={14} />
                    上一通
                  </button>
                  <button
                    type="button"
                    onClick={onNextCall}
                    disabled={currentIndex >= totalCalls - 1}
                    className="h-8 px-3 rounded-md border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    下一通
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Label Determination Details Modal */}
      {showLabelModal && (
        <CallLabelDetailModal call={call} onClose={() => setShowLabelModal(false)} />
      )}

      {/* Inline Modal: Utterance Correction (ASR 纠错) */}
      {correctingUtterance && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-md border border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">ASR 语音纠错</h3>
            <p className="text-[11px] text-neutral-500 mb-3">修正语音识别歧义或同音字，沉淀质检热词库</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-neutral-500 block mb-1">原始识别文本:</label>
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700">
                  {correctingUtterance.originalText}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-neutral-700 font-medium block mb-1">纠正后文本:</label>
                <input
                  type="text"
                  value={correctingUtterance.correctedText}
                  onChange={(e) =>
                    setCorrectingUtterance({ ...correctingUtterance, correctedText: e.target.value })
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCorrectingUtterance(null)}
                className="h-8 px-3 rounded-md text-xs text-neutral-600 hover:bg-neutral-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveUtteranceCorrection}
                className="h-8 px-4 rounded-md bg-neutral-900 text-white text-xs font-medium"
              >
                确认纠错
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Modal: Flag Utterance */}
      {flaggingUtteranceId && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm border border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">选择质检标记</h3>
            <p className="text-[11px] text-neutral-500 mb-3">为此轮发言添加质检分类标签</p>
            <div className="grid grid-cols-2 gap-2">
              {['ASR识别错误', '播报超时', '流程错位', '质检扣分', '优秀话术', '客户情绪激动'].map((flag) => (
                <button
                  key={flag}
                  type="button"
                  onClick={() => handleSetUtteranceFlag(flag)}
                  className="p-2.5 rounded-lg border border-neutral-200 hover:border-sky-400 hover:bg-sky-50 text-xs text-neutral-800 text-left cursor-pointer transition-colors"
                >
                  {flag}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setFlaggingUtteranceId(null)}
                className="h-8 px-3 rounded-md text-xs text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
