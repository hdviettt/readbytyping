let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function cleanupAudio() {
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

function playClick(frequency: number, duration: number, volume: number) {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // Noise burst for the mechanical "clack"
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Sharp attack, fast decay
    const envelope = Math.exp(-i / (bufferSize * 0.08));
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Bandpass filter to shape the click tone
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 1.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + duration);
}

export function playKeystroke() {
  // Vary the pitch slightly for each keystroke
  const freq = 1800 + Math.random() * 800;
  playClick(freq, 0.04, 0.08);
}

export function playReturn() {
  // Carriage return: lower pitched, slightly longer
  playClick(600, 0.08, 0.1);
  // Add a second "ding" after a tiny delay
  setTimeout(() => {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 2200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }, 30);
}

export function playBackspace() {
  playClick(1200, 0.03, 0.05);
}

export function playError() {
  // Duller thud for wrong key
  playClick(400, 0.05, 0.06);
}
