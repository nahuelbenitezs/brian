// Sound & Music Synthesizer via Web Audio API (Zero external audio file dependencies)
class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isMusicPlaying = false;
        this.musicInterval = null;
        this.chargeOsc = null;
        this.chargeGain = null;
        this.chargeModOsc = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopMusic();
            this.stopKiCharge();
        } else {
            this.startMusic();
        }
        return this.isMuted;
    }

    // Play punch / kick impact
    playPunch(isHeavy = false) {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Noise buffer for snap
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = isHeavy ? 'lowpass' : 'bandpass';
        filter.frequency.setValueAtTime(isHeavy ? 450 : 1200, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(isHeavy ? 0.8 : 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (isHeavy ? 0.2 : 0.1));

        // Sub bass thump
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isHeavy ? 150 : 180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + (isHeavy ? 0.25 : 0.12));

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(isHeavy ? 0.9 : 0.6, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + (isHeavy ? 0.25 : 0.12));

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        noise.start(now);
        osc.start(now);
        noise.stop(now + 0.2);
        osc.stop(now + 0.3);
    }

    // Ki blast / Electric spark shoot
    playBlast() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
    }

    // Dash / Whoosh
    playDash() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(2200, now + 0.1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.16);
    }

    // Ki charging continuous drone
    startKiCharge() {
        if (this.isMuted || !this.ctx || this.chargeOsc) return;
        const now = this.ctx.currentTime;

        this.chargeOsc = this.ctx.createOscillator();
        const modOsc = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        this.chargeGain = this.ctx.createGain();

        this.chargeOsc.type = 'sawtooth';
        this.chargeOsc.frequency.setValueAtTime(110, now);
        this.chargeOsc.frequency.linearRampToValueAtTime(280, now + 1.5);

        modOsc.type = 'triangle';
        modOsc.frequency.setValueAtTime(18, now); // aura pulsation rate
        modGain.gain.setValueAtTime(30, now);

        modOsc.connect(this.chargeOsc.frequency);

        this.chargeGain.gain.setValueAtTime(0.01, now);
        this.chargeGain.gain.linearRampToValueAtTime(0.28, now + 0.2);

        this.chargeOsc.connect(this.chargeGain);
        this.chargeGain.connect(this.ctx.destination);

        this.chargeOsc.start(now);
        modOsc.start(now);
        this.chargeModOsc = modOsc;
    }

    stopKiCharge() {
        if (this.chargeGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.chargeGain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            setTimeout(() => {
                if (this.chargeOsc) {
                    try {
                        this.chargeOsc.stop();
                        if (this.chargeModOsc) this.chargeModOsc.stop();
                        this.chargeOsc.disconnect();
                        this.chargeGain.disconnect();
                    } catch (e) {}
                    this.chargeOsc = null;
                    this.chargeGain = null;
                    this.chargeModOsc = null;
                }
            }, 160);
        }
    }

    // Ultimate Beam (Kamehameha / Mega Thunderbolt)
    playUltimateBeam() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);
        osc.frequency.setValueAtTime(320, now + 0.7);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.setValueAtTime(0.7, now + 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 2.0);
    }

    // Explosion sound
    playExplosion() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const bufferSize = Math.floor(this.ctx.sampleRate * 0.7);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 0.6);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.75);
    }

    // Victory chime
    playVictory() {
        if (this.isMuted || !this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.15;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
        });
    }

    // Dynamic Battle BGM Synth
    startMusic() {
        if (this.isMuted || this.isMusicPlaying || !this.ctx) return;
        this.isMusicPlaying = true;

        const bpm = 138;
        const beatDuration = 60 / bpm;
        const sixteenth = beatDuration / 4;

        const bassLine = [
            110, 110, 130.81, 110, 146.83, 110, 130.81, 123.47,
            110, 110, 164.81, 146.83, 130.81, 110, 98, 123.47
        ];
        let step = 0;

        this.musicInterval = setInterval(() => {
            if (!this.isMusicPlaying || this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;

            const freq = bassLine[step % bassLine.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq / 2, now);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + sixteenth * 1.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + sixteenth * 2);

            const beatStep = step % 16;
            if (beatStep % 4 === 0) {
                const kick = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kick.type = 'sine';
                kick.frequency.setValueAtTime(130, now);
                kick.frequency.exponentialRampToValueAtTime(35, now + 0.1);
                kickGain.gain.setValueAtTime(0.22, now);
                kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                kick.connect(kickGain);
                kickGain.connect(this.ctx.destination);
                kick.start(now);
                kick.stop(now + 0.13);
            }

            if (beatStep === 4 || beatStep === 12) {
                const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(1000, now);
                const snareGain = this.ctx.createGain();
                snareGain.gain.setValueAtTime(0.12, now);
                snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                noise.connect(filter);
                filter.connect(snareGain);
                snareGain.connect(this.ctx.destination);
                noise.start(now);
                noise.stop(now + 0.09);
            }

            step++;
        }, sixteenth * 1000);
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

window.soundManager = new SoundManager();
