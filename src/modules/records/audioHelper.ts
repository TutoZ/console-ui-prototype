/**
 * 音频播放与合成导出辅助类
 * 基于 Web Audio API 实现无外部网络依赖的语音模拟与音频波形文件生成
 */

class AudioSynthesizer {
  private audioCtx: AudioContext | null = null;
  private currentOsc: OscillatorNode | null = null;
  private currentGain: GainNode | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * 播放单句会话模拟音频 (短促清澈的多频语调)
   */
  playSentenceBeep(type: 'ai' | 'customer' = 'ai', durationMs = 1200) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type === 'ai' ? 'sine' : 'triangle';
      const baseFreq = type === 'ai' ? 520 : 380;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, ctx.currentTime + durationMs / 2000);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, ctx.currentTime + durationMs / 1000);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * 播放全局通话音频流的滴答背景
   */
  startCallStreamingTone() {
    try {
      const ctx = this.getContext();
      this.stopTone();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      this.currentOsc = osc;
      this.currentGain = gain;
    } catch {
      // AudioContext unavailable
    }
  }

  stopTone() {
    if (this.currentOsc) {
      try {
        this.currentOsc.stop();
        this.currentOsc.disconnect();
      } catch {
        // ignore
      }
      this.currentOsc = null;
    }
  }

  /**
   * 生成真实的单声道 16-bit PCM WAV 文件 Blob，供用户离线下载与播放
   */
  generateCallWavBlob(durationSeconds = 180): Blob {
    const sampleRate = 8000; // 电话标准窄带 8kHz 采样
    const numChannels = 1;
    const bytesPerSample = 2;
    const numSamples = Math.floor(sampleRate * Math.min(durationSeconds, 30)); // 演示生成前30秒真实音频数据
    const dataSize = numSamples * numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
    view.setUint16(32, numChannels * bytesPerSample, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // 写入调制的音频模拟正弦采样波
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // 模拟人声基频与包络
      const amplitude = Math.sin(2 * Math.PI * 440 * t) * 0.4 + Math.sin(2 * Math.PI * 880 * t) * 0.2;
      const sample = Math.max(-1, Math.min(1, amplitude)) * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const audioSynth = new AudioSynthesizer();

export function formatDurationSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function downloadFileBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
