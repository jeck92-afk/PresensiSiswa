// Web Audio API sound synthesizer and Web Speech voice guidance - zero external network dependencies

class SoundEffects {
  private ctx: AudioContext | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.refreshVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.refreshVoices();
        };
      }
    }
  }

  private refreshVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      this.cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      // Ignore in non-supported environments
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Selects the highest quality, most articulate and firm Indonesian voice available
   */
  private getBestIndonesianVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    
    let voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      voices = this.cachedVoices;
    }
    if (!voices || voices.length === 0) return null;

    // Filter Indonesian language candidates
    const idVoices = voices.filter((v) => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      const name = (v.name || '').toLowerCase();
      return (
        lang === 'id-id' ||
        lang.startsWith('id') ||
        name.includes('indonesia') ||
        name.includes('bahasa')
      );
    });

    if (idVoices.length === 0) {
      return voices.find((v) => v.default) || voices[0] || null;
    }

    // Rank voices prioritizing neural, natural, Google, Microsoft Natural, and Apple premium voices
    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      const name = (v.name || '').toLowerCase();
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      let score = 0;

      // Natural and neural engines offer the clearest, most articulate and authoritative timbre
      if (name.includes('natural') || name.includes('online')) score += 50;
      if (name.includes('google')) score += 40; // Google Bahasa Indonesia is very crisp
      if (name.includes('ardi') || name.includes('gadis') || name.includes('damayanti')) score += 35;
      if (name.includes('neural') || name.includes('enhanced') || name.includes('premium')) score += 30;
      if (lang === 'id-id') score += 20;
      if (v.localService) score += 5;
      if (v.default) score += 2;

      return score;
    };

    idVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return idVoices[0];
  }

  /**
   * Single Bright Beep - crisp, clear, high-frequency affirmative single beep
   * Standard for professional barcode & QR code attendance scanners (2000 Hz pure sine)
   */
  playSingleBrightBeep(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Single Bright Beep: Crisp, pure high-frequency tone at 2000 Hz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, now);

      // Rapid click-free attack (4ms), energetic bright sustain (50ms), and crisp decay (35ms)
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.004);
      gain.gain.setValueAtTime(0.28, now + 0.055);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.095);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  /**
   * Speak Indonesian text using Web Speech API with standard tempo (rate: 1.0)
   */
  speak(text: string, rate: number = 1.0, pitch: number = 1.0): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      // Resume if browser suspended synthesis
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      
      // Cancel previous pending speech to ensure immediate, crisp playback
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = rate; // Tempo standar (1.0) - alami, seimbang, dan jelas
      utterance.pitch = pitch; // Pitch standar alami (1.0)
      utterance.volume = 1.0; // Volume optimal

      const bestVoice = this.getBestIndonesianVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  /**
   * Scan Berhasil:
   * Single Bright Beep berbunyi diikuti ucapan dengan tempo standar (1.0)
   * "Terima kasih!"
   */
  playScanSuccess(): void {
    this.playSingleBrightBeep();
    // Jeda 150ms setelah nada beep selesai
    setTimeout(() => {
      this.speak('Terima kasih!', 1.0, 1.0);
    }, 150);
  }

  /**
   * Scan Gagal:
   * Single Bright Beep berbunyi diikuti ucapan dengan tempo standar (1.0)
   * "Silakan coba lagi!"
   */
  playScanFailure(): void {
    this.playSingleBrightBeep();
    setTimeout(() => {
      this.speak('Silakan coba lagi!', 1.0, 1.0);
    }, 150);
  }

  // Alias for backward compatibility
  playSuccess(): void {
    this.playScanSuccess();
  }

  playError(): void {
    this.playScanFailure();
  }

  playWarning(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(330, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }
}

export const soundEffects = new SoundEffects();

