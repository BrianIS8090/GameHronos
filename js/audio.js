// Аудиосинтезатор на базе Web Audio API
export class ChronoAudio {
  constructor() {
    this.ctx = null;
    this.trainOsc = null;
    this.trainGain = null;
    this.rumbleFilter = null;
    this.isMuted = false;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.isInitialized = true;
      this.startTrainRumble();
    } catch (e) {
      console.warn("Web Audio API не поддерживается", e);
    }
  }

  startTrainRumble() {
    if (!this.isInitialized || this.isMuted) return;

    this.trainOsc = this.ctx.createOscillator();
    this.trainOsc.type = 'sawtooth';
    this.trainOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

    this.rumbleFilter = this.ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.setValueAtTime(90, this.ctx.currentTime);

    this.trainGain = this.ctx.createGain();
    this.trainGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.trainOsc.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.trainGain);
    this.trainGain.connect(this.ctx.destination);

    this.trainOsc.start();

    this.wheelClackInterval = setInterval(() => {
      this.playWheelClack();
    }, 3200);
  }

  playWheelClack() {
    if (!this.isInitialized || this.isMuted || this.ctx.state === 'suspended') return;
    
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const filter1 = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(80, now);
    
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(150, now);

    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    const filter2 = this.ctx.createBiquadFilter();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(75, now + 0.2);
    
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(130, now + 0.2);

    gain2.gain.setValueAtTime(0.06, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(this.ctx.destination);
    
    osc2.start(now + 0.2);
    osc2.stop(now + 0.35);
  }

  playTextClick() {
    if (!this.isInitialized || this.isMuted || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    const freq = 1200 + Math.random() * 800;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.003, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playGlitch() {
    if (!this.isInitialized || this.isMuted || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.15);

    gain.gain.setValueAtTime(0.015, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playExplosion() {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 2.0;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const explosionFilter = this.ctx.createBiquadFilter();
    explosionFilter.type = 'lowpass';
    explosionFilter.frequency.setValueAtTime(300, now);
    explosionFilter.frequency.exponentialRampToValueAtTime(10, now + 1.8);

    const explosionGain = this.ctx.createGain();
    explosionGain.gain.setValueAtTime(0.4, now);
    explosionGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    whiteNoise.connect(explosionFilter);
    explosionFilter.connect(explosionGain);
    explosionGain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 2.0);

    setTimeout(() => {
      const shiftNow = this.ctx.currentTime;
      const shiftOsc = this.ctx.createOscillator();
      const shiftGain = this.ctx.createGain();

      shiftOsc.type = 'sine';
      shiftOsc.frequency.setValueAtTime(80, shiftNow);
      shiftOsc.frequency.exponentialRampToValueAtTime(3000, shiftNow + 1.2);

      shiftGain.gain.setValueAtTime(0.001, shiftNow);
      shiftGain.gain.exponentialRampToValueAtTime(0.08, shiftNow + 0.8);
      shiftGain.gain.exponentialRampToValueAtTime(0.001, shiftNow + 1.2);

      shiftOsc.connect(shiftGain);
      shiftGain.connect(this.ctx.destination);

      shiftOsc.start(shiftNow);
      shiftOsc.stop(shiftNow + 1.3);
    }, 1100);
  }

  playTimerBeep() {
    if (!this.isInitialized || this.isMuted || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, now);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }
}
