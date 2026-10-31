type AudioCtx = AudioContext & { webkitAudioContext?: AudioContext };

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
    if (!ctx) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
}

function playNote(freq: number, duration: number, vol = 0.08, type: OscillatorType = "sine", delay = 0) {
    try {
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, c.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime + delay);
        osc.stop(c.currentTime + delay + duration);
    } catch {
        // audio optional
    }
}

export function playCorrectSFX() {
    playNote(523, 0.12, 0.1, "sine", 0);
    playNote(659, 0.12, 0.1, "sine", 0.1);
    playNote(784, 0.2, 0.12, "sine", 0.2);
}

export function playWrongSFX() {
    playNote(330, 0.15, 0.1, "sawtooth", 0);
    playNote(260, 0.15, 0.08, "sawtooth", 0.12);
    playNote(200, 0.3, 0.06, "sawtooth", 0.24);
}

export function playGameOverSFX() {
    playNote(400, 0.2, 0.1, "sine", 0);
    playNote(350, 0.2, 0.1, "sine", 0.2);
    playNote(300, 0.2, 0.1, "sine", 0.4);
    playNote(200, 0.5, 0.12, "sawtooth", 0.6);
}

export function playVictorySFX() {
    playNote(523, 0.15, 0.1, "sine", 0);
    playNote(659, 0.15, 0.1, "sine", 0.12);
    playNote(784, 0.15, 0.1, "sine", 0.24);
    playNote(1047, 0.4, 0.14, "sine", 0.36);
    playNote(784, 0.15, 0.06, "triangle", 0.12);
    playNote(1047, 0.15, 0.06, "triangle", 0.36);
}

export function playCoinSFX() {
    playNote(988, 0.08, 0.06, "square", 0);
    playNote(1319, 0.25, 0.06, "square", 0.08);
}

export function playUnlockSFX() {
    playNote(660, 0.1, 0.08, "triangle", 0);
    playNote(880, 0.1, 0.08, "triangle", 0.09);
    playNote(1320, 0.35, 0.1, "triangle", 0.18);
}

export function playChestShakeSFX() {
    playNote(180, 0.07, 0.08, "square", 0);
    playNote(160, 0.07, 0.08, "square", 0.18);
    playNote(180, 0.07, 0.08, "square", 0.36);
}

export function playChestOpenSFX() {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => playNote(freq, 0.18, 0.08, "triangle", i * 0.07));
    playNote(1568, 0.5, 0.05, "sine", 0.35);
}

/** Rising "pop" - pass how many have been popped so each one sounds higher */
export function playPopSFX(step = 0) {
    playNote(440 * Math.pow(2, step / 6), 0.1, 0.08, "sine", 0);
}

export function playSplashSFX() {
    try {
        const c = getCtx();
        const bufferSize = c.sampleRate * 0.3;
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }
        const src = c.createBufferSource();
        src.buffer = buffer;
        const filter = c.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800;
        const gain = c.createGain();
        gain.gain.value = 0.08;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        src.start();
    } catch {
        // audio optional
    }
}

let bgNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let bgPlaying = false;

const BG_MELODY = [
    392, 440, 494, 523, 494, 440, 392, 349,
    330, 349, 392, 440, 392, 349, 330, 294,
];

export function startBackgroundMusic() {
    if (bgPlaying) return;
    try {
        const c = getCtx();
        bgPlaying = true;

        const masterGain = c.createGain();
        masterGain.gain.value = 0.03;
        masterGain.connect(c.destination);

        function scheduleLoop() {
            if (!bgPlaying) return;
            const now = c.currentTime;
            BG_MELODY.forEach((freq, i) => {
                const osc = c.createOscillator();
                const noteGain = c.createGain();
                osc.type = "triangle";
                osc.frequency.value = freq;
                noteGain.gain.setValueAtTime(0.5, now + i * 0.35);
                noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.35 + 0.3);
                osc.connect(noteGain);
                noteGain.connect(masterGain);
                osc.start(now + i * 0.35);
                osc.stop(now + i * 0.35 + 0.35);
                bgNodes.push({ osc, gain: noteGain });
            });

            const loopDuration = BG_MELODY.length * 0.35;
            setTimeout(() => {
                bgNodes = [];
                scheduleLoop();
            }, loopDuration * 1000);
        }

        scheduleLoop();
    } catch {
        // audio optional
    }
}

export function stopBackgroundMusic() {
    bgPlaying = false;
    bgNodes.forEach(({ osc }) => {
        try { osc.stop(); } catch { /* already stopped */ }
    });
    bgNodes = [];
}
