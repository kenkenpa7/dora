// 高品質BGMオーディオプレイヤー ＆ ウォーム効果音エンジン (Web Audio API 完全統合版)
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.currentBgmType = null;
        this.currentBgmSource = null;
        this.isMuted = false;
        this.bgmVolume = 0.18; // BGMの心地よい音量
        this.audioBuffers = {}; // url -> AudioBuffer (デコード済みキャッシュ)
        this.loadingPromises = {}; // url -> Promise (重複ロード防止)
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(1.6, this.ctx.currentTime); // 効果音全体をパワフルに増幅
            this.masterGain.connect(this.ctx.destination);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : this.bgmVolume, this.ctx.currentTime);
            this.bgmGain.connect(this.masterGain);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 音源ファイルを fetch してデコード（Service Workerのキャッシュから通常取得）
    async loadAudioBuffer(url) {
        if (this.audioBuffers[url]) {
            return this.audioBuffers[url];
        }
        if (this.loadingPromises[url]) {
            return await this.loadingPromises[url];
        }

        this.loadingPromises[url] = (async () => {
            try {
                this.init();
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
                const arrayBuffer = await res.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                this.audioBuffers[url] = audioBuffer;
                return audioBuffer;
            } catch (err) {
                console.warn(`[SoundEngine] Failed to load ${url}:`, err);
                return null;
            } finally {
                delete this.loadingPromises[url];
            }
        })();

        return await this.loadingPromises[url];
    }

    // --- BGM再生システム (Web Audio API ループ再生) ---
    async playBGM(type) {
        if (this.currentBgmType === type) return;
        this.init();
        this.stopBGM();

        this.currentBgmType = type;
        if (this.isMuted) return;

        const url = `bgm/${type}.mp3`;
        const buffer = await this.loadAudioBuffer(url);
        if (!buffer || this.currentBgmType !== type) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(this.bgmGain);
        source.start(0);
        this.currentBgmSource = source;
    }

    stopBGM() {
        if (this.currentBgmSource) {
            try {
                this.currentBgmSource.stop();
                this.currentBgmSource.disconnect();
            } catch (e) {}
            this.currentBgmSource = null;
        }
        this.currentBgmType = null;
    }

    // --- ワンショット効果音再生 (Web Audio API) ---
    async playSE(url, volume = 0.80) {
        if (this.isMuted) return;
        this.init();

        const buffer = await this.loadAudioBuffer(url);
        if (!buffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start(0);
    }

    // 敵があらわれた時の緊迫エンカウント効果音 (ドラクエ風2回連続リピート)
    playEncounter() {
        if (this.isMuted) return;
        this.init();
        this.playSE('bgm/encounter.wav', 0.20);
        setTimeout(() => {
            if (!this.isMuted) {
                this.playSE('bgm/encounter.wav', 0.20);
            }
        }, 420);
    }

    // 正統派戦闘勝利ファンファーレ (ド-ド-ド-ファ-ソ-ラ-ド！)
    playVictory() {
        this.stopBGM();
        this.playSE('bgm/victory.wav', 0.85);
    }

    // 宿屋の心温まる宿泊ジングル (ソ-ラ-シ-ド-ソ-ド〜)
    playInn() {
        this.stopBGM();
        this.playSE('bgm/inn.wav', 0.80);
    }

    // --- 低遅延・クリアな電子効果音システム (Web Audio API) ---
    playTextChar() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.30, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    playCursor() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    playSelect() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.04);
        gain.gain.setValueAtTime(0.40, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.13);
    }

    playCancel() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    playHit() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.16);
        gain.gain.setValueAtTime(0.60, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.17);
    }

    playPlayerHit() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.20);
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.21);
    }

    playMagic() {
        if (this.isMuted) return;
        this.init();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (this.isMuted) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(500 + i * 150, now);
                gain.gain.setValueAtTime(0.40, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now);
                osc.stop(now + 0.13);
            }, i * 40);
        }
    }

    playHeal() {
        if (this.isMuted) return;
        const notes = [523, 659, 783, 1046];
        notes.forEach((f, idx) => {
            setTimeout(() => {
                if (this.isMuted) return;
                this.init();
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now);
                gain.gain.setValueAtTime(0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now);
                osc.stop(now + 0.19);
            }, idx * 60);
        });
    }

    playDoor() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(260, now + 0.05);
        gain.gain.setValueAtTime(0.50, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playStairs() {
        if (this.isMuted) return;
        const notes = [220, 290, 370, 440];
        notes.forEach((f, idx) => {
            setTimeout(() => {
                if (this.isMuted) return;
                this.init();
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now);
                gain.gain.setValueAtTime(0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now);
                osc.stop(now + 0.10);
            }, idx * 65);
        });
    }

    playLevelUp() {
        const notes = [
            { f: 523, d: 0.12 }, { f: 587, d: 0.12 }, { f: 659, d: 0.12 },
            { f: 783, d: 0.25 }, { f: 659, d: 0.12 }, { f: 783, d: 0.50 }
        ];
        let delay = 0;
        notes.forEach(n => {
            setTimeout(() => {
                if (this.isMuted) return;
                this.init();
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(n.f, now);
                gain.gain.setValueAtTime(0.55, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + n.d);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now);
                osc.stop(now + n.d + 0.02);
            }, delay);
            delay += n.d * 1000 * 0.9;
        });
    }

    playRun() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.40, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.11);
    }
}

const audio = new SoundEngine();
