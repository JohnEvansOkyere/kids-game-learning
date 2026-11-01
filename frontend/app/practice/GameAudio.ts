type AudioCtx = AudioContext & { webkitAudioContext?: AudioContext };

let ctx: AudioContext | null = null;

const SOUND_OFF_KEY = "sound_off";

/** Parents can switch every game sound off; remembered on this device */
export function isSoundOff(): boolean {
    try {
        return localStorage.getItem(SOUND_OFF_KEY) === "1";
    } catch {
        return false;
    }
}

export function setSoundOff(off: boolean) {
    try {
        if (off) localStorage.setItem(SOUND_OFF_KEY, "1");
        else localStorage.removeItem(SOUND_OFF_KEY);
    } catch {
        // storage blocked: the switch just lasts for this visit
    }
    if (ctx) {
        if (off) ctx.suspend();
        else ctx.resume();
    }
}

function getCtx(): AudioContext {
    if (!ctx) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AC();
    }
    if (ctx.state === "suspended" && !isSoundOff()) ctx.resume();
    return ctx;
}

function playNote(freq: number, duration: number, vol = 0.08, type: OscillatorType = "sine", delay = 0) {
    if (isSoundOff()) return;
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
    if (isSoundOff()) return;
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

function playNoise(duration: number, vol: number, cutoff: number, delay = 0) {
    if (isSoundOff()) return;
    try {
        const c = getCtx();
        const size = Math.floor(c.sampleRate * duration);
        const buffer = c.createBuffer(1, size, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < size; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (size * 0.3));
        }
        const src = c.createBufferSource();
        src.buffer = buffer;
        const filter = c.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = cutoff;
        const gain = c.createGain();
        gain.gain.value = vol;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        src.start(c.currentTime + delay);
    } catch {
        // audio optional
    }
}

/** Crocodile jaws slamming shut */
export function playChompSFX() {
    playNote(110, 0.12, 0.14, "square", 0);
    playNoise(0.15, 0.12, 1800);
    playNote(70, 0.2, 0.12, "sawtooth", 0.05);
}

/** Two low thumps: "lub-dub" */
export function playHeartbeatSFX() {
    playNote(55, 0.12, 0.18, "sine", 0);
    playNote(48, 0.14, 0.14, "sine", 0.16);
}

export function playThunderSFX() {
    playNoise(1.6, 0.1, 300);
    playNoise(0.8, 0.06, 600, 0.1);
}

let tensePlaying = false;
let tenseTimer: ReturnType<typeof setTimeout> | null = null;

// A low minor-key pulse for chase games, instead of the cheerful loop
const TENSE_BASS = [110, 110, 131, 110, 104, 104, 123, 98];

export function startTenseMusic() {
    if (tensePlaying) return;
    tensePlaying = true;
    const step = 0.28;

    function loop() {
        if (!tensePlaying) return;
        TENSE_BASS.forEach((freq, i) => {
            playNote(freq, step * 0.9, 0.05, "triangle", i * step);
            if (i % 2 === 0) playNote(freq * 4, 0.05, 0.015, "square", i * step);
        });
        tenseTimer = setTimeout(loop, TENSE_BASS.length * step * 1000);
    }
    loop();
}

export function stopTenseMusic() {
    tensePlaying = false;
    if (tenseTimer) clearTimeout(tenseTimer);
    tenseTimer = null;
}
