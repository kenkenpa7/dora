// 高品質BGMオーディオプレイヤー ＆ ウォーム効果音エンジン
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.currentBgmType = null;
        this.bgmAudio = null;
        this.isMuted = false;
        this.bgmVolume = 0.18; // BGMを心地よい音量に
        this.bgmPool = {};
        this.sePool = {};
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(1.6, this.ctx.currentTime); // 効果音全体をパワフルに増幅
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- BGM再生システム (スマート・オンデマンドキャッシュ＆0秒再生) ---
    playBGM(type) {
        if (this.currentBgmType === type) return;
        this.init();
        this.stopBGM();

        this.currentBgmType = type;
        if (this.isMuted) return;

        // 必要な時に初めてロードしてキャッシュ（起動時負荷ゼロ）
        let audioEl = this.bgmPool[type];
        if (!audioEl) {
            audioEl = new Audio(`bgm/${type}.mp3`);
            audioEl.loop = true;
            this.bgmPool[type] = audioEl;
        }

        audioEl.volume = this.bgmVolume;
        audioEl.currentTime = 0;

        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
        this.bgmAudio = audioEl;
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio = null;
        }
        this.currentBgmType = null;
    }

    getSE(name, path, volume = 0.80) {
        if (!this.sePool[name]) {
            const a = new Audio(path);
            a.volume = volume;
            this.sePool[name] = a;
        }
        return this.sePool[name];
    }

    // 敵があらわれた時の緊迫エンカウント効果音 (ドラクエ風2回連続リピート)
    playEncounter() {
        if (this.isMuted) return;
        this.init();

        const se1 = this.getSE('encounter', 'bgm/encounter.wav', 0.50);
        se1.volume = 0.50;
        se1.currentTime = 0;
        const p1 = se1.play();
        if (p1 !== undefined) p1.catch(() => {});

        // 2回目リピート再生 (0.42秒後)
        setTimeout(() => {
            const se2 = new Audio('bgm/encounter.wav');
            se2.volume = 0.50;
            se2.play().catch(() => {});
        }, 420);
    }

    // 正統派戦闘勝利ファンファーレ (ド-ド-ド-ファ-ソ-ラ-ド！)
    playVictory() {
        this.stopBGM();
        const v = this.getSE('victory', 'bgm/victory.wav', 0.85);
        v.currentTime = 0;
        const p = v.play();
        if (p !== undefined) p.catch(() => {});
    }

    // 宿屋の心温まる宿泊ジングル (ソ-ラ-シ-ド-ソ-ド〜)
    playInn() {
        this.stopBGM();
        const inn = this.getSE('inn', 'bgm/inn.wav', 0.80);
        inn.currentTime = 0;
        const p = inn.play();
        if (p !== undefined) p.catch(() => {});
    }

    // --- 低遅延・クリアな効果音システム (Web Audio API) ---
    playTextChar() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 軽快で心地よい文字送り音
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
