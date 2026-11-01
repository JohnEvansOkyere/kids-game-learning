/**
 * RiverScene - Phaser scene for the "Croc Escape" game.
 * The hero has fallen out of a canoe and must swim to the shore while a
 * crocodile closes in. Right answers are swim strokes; the croc creeps closer
 * while the clock runs and lunges on wrong answers.
 * Imported dynamically by RiverGameCanvas so Phaser never loads during SSR.
 */
import * as Phaser from "phaser";
import { playChompSFX, playHeartbeatSFX, playThunderSFX } from "./GameAudio";

export interface AnswerFx {
    /** Answered in the first third of the clock */
    fast: boolean;
    /** Three or more right in a row */
    streak: boolean;
    livesLeft: number;
    /** The session ends after this answer */
    isLast: boolean;
    /** Right answer with only a few seconds left */
    close?: boolean;
    /** Out of lives, but a fisherman throws a rope: one more chance */
    rescue?: boolean;
}

// How far behind the hero the croc sits, by lives left (index = lives)
const CROC_GAP_BY_LIVES = [0, 150, 215, 290];
const SWIM_Y = 250;
const START_X = 300;
const SHORE_X = 790;
const CANOE_X = 150;
// The croc holds still while the child reads, then starts to creep
const READING_GRACE = 0.35;

export class RiverScene extends Phaser.Scene {
    private hero!: Phaser.GameObjects.Container;
    private heroArms: Phaser.GameObjects.Rectangle[] = [];
    private croc!: Phaser.GameObjects.Container;
    private crocJawTop!: Phaser.GameObjects.Container;
    private crocJawBottom!: Phaser.GameObjects.Container;
    private crocWake!: Phaser.GameObjects.Graphics;
    private canoe!: Phaser.GameObjects.Container;
    private dangerOverlay!: Phaser.GameObjects.Rectangle;
    private flash!: Phaser.GameObjects.Rectangle;
    private rain: Phaser.GameObjects.Rectangle[] = [];
    private waves: Phaser.GameObjects.Ellipse[] = [];
    private label!: Phaser.GameObjects.Text;
    private sandal!: Phaser.GameObjects.Rectangle;
    private fisherBoat?: Phaser.GameObjects.Container;
    private rope?: Phaser.GameObjects.Graphics;

    private totalStrokes = 10;
    private strokes = 0;
    private livesLeft = 3;
    private danger = 0;
    private crocPushback = 0;
    private busy = false;
    private finished = false;
    private nextHeartbeat = 0;
    private nextLightning = 4000;
    private armPhase = 0;
    private reducedMotion = false;

    constructor() {
        super("RiverScene");
    }

    preload() {
        this.load.image("river-backdrop", "/river-backdrop.webp");
    }

    /** Called before the first question so stroke length fits the session */
    setTotalQuestions(n: number) {
        this.totalStrokes = Math.max(1, n);
    }

    /** 0 = clock just started, 1 = out of time. The croc creeps in as it rises. */
    setDanger(level: number) {
        this.danger = Phaser.Math.Clamp(level, 0, 1);
    }

    /** A big word across the sky, e.g. for the last question */
    announce(text: string, color = "#ffffff") {
        if (this.label) this.showLabel(text, color);
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

        const painted = this.textures.exists("river-backdrop");
        if (painted) this.add.image(W / 2, H / 2, "river-backdrop").setDisplaySize(W, H);
        else this.buildSky(W);
        this.buildWater(W, H, painted);
        this.buildShore(W, H);
        this.buildCanoe();
        this.buildCroc();
        this.buildHero();
        this.buildRain(W, H);

        this.dangerOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xb71c1c, 0).setDepth(50);
        this.flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(60);
        this.label = this.add
            .text(W / 2, 70, "", {
                fontFamily: "Fredoka, sans-serif",
                fontSize: "34px",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setDepth(70)
            .setAlpha(0);

        this.playIntro();
    }

    // ---------- World ----------

    private buildSky(W: number) {
        const bands = [0x1a1033, 0x241640, 0x2f1d4a, 0x3b2652, 0x4a2f57, 0x5c3a5a];
        bands.forEach((c, i) => this.add.rectangle(W / 2, i * 20 + 10, W, 21, c));

        // Storm clouds
        for (let i = 0; i < 9; i++) {
            const cx = i * 110 + Phaser.Math.Between(-20, 20);
            const cy = Phaser.Math.Between(10, 45);
            const s = 0.8 + Math.random() * 0.6;
            this.add.ellipse(cx, cy, 140 * s, 45 * s, 0x15101f, 0.85);
            this.add.ellipse(cx + 30, cy - 12, 90 * s, 35 * s, 0x1f1830, 0.85);
        }

        // Far jungle silhouette
        const g = this.add.graphics();
        g.fillStyle(0x0f1a14, 1);
        g.beginPath();
        g.moveTo(0, 120);
        for (let x = 0; x <= W; x += 30) g.lineTo(x, 100 - Math.abs(Math.sin(x * 0.02)) * 18 - (x % 90 === 0 ? 10 : 0));
        g.lineTo(W, 120);
        g.closePath();
        g.fillPath();
    }

    private buildWater(W: number, H: number, painted: boolean) {
        const top = 118;
        const bands = [0x1d3b4a, 0x183444, 0x142d3c, 0x102634, 0x0c1f2b, 0x081822];
        const bh = (H - top) / bands.length;
        bands.forEach((c, i) => this.add.rectangle(W / 2, top + bh * i + bh / 2, W, bh + 1, c, painted ? 0.16 : 1));

        this.waves = [];
        for (let i = 0; i < 26; i++) {
            const w = this.add.ellipse(
                Math.random() * W,
                top + 10 + Math.random() * (H - top - 20),
                30 + Math.random() * 50,
                3,
                0x5f8fa3,
                0.25
            );
            (w as any)._speed = 20 + Math.random() * 30;
            this.waves.push(w);
        }
    }

    private buildShore(W: number, H: number) {
        // Sand slope rising out of the water on the right
        const g = this.add.graphics();
        g.fillStyle(0xc9a35b, 1);
        g.beginPath();
        g.moveTo(SHORE_X + 10, H);
        g.lineTo(SHORE_X + 40, 150);
        g.lineTo(W, 125);
        g.lineTo(W, H);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xa8843f, 1);
        g.fillTriangle(SHORE_X + 10, H, SHORE_X + 40, 150, SHORE_X + 30, H);

        // Foam line
        for (let y = 160; y < H; y += 18) {
            this.add.ellipse(SHORE_X + 18 + (H - y) * 0.11, y, 14, 4, 0xe0f2f1, 0.5);
        }

        // Palm on the beach
        const px = W - 45;
        this.add.rectangle(px, 105, 8, 60, 0x4e3417);
        for (let l = 0; l < 5; l++) {
            const a = -Math.PI / 2 + (l - 2) * 0.55;
            const fg = this.add.graphics();
            fg.fillStyle(0x1f4d2a, 1);
            fg.fillTriangle(px, 76, px + Math.cos(a) * 42 - 5, 76 + Math.sin(a) * 30, px + Math.cos(a) * 42 + 5, 80 + Math.sin(a) * 30);
        }

        // Ghana flag = safety
        const fx = W - 75, fy = 120;
        this.add.rectangle(fx, fy, 3, 44, 0x4e3417);
        this.add.rectangle(fx + 13, fy - 17, 22, 7, 0xce1126);
        this.add.rectangle(fx + 13, fy - 10, 22, 7, 0xfcd116);
        this.add.rectangle(fx + 13, fy - 3, 22, 7, 0x006b3f);
        this.add.star(fx + 13, fy - 10, 5, 1.5, 3.5, 0x000000);

        // Campfire glow so the shore feels warm and safe
        this.add.circle(W - 40, 150, 26, 0xffa726, 0.18);
        this.add.circle(W - 40, 152, 6, 0xff7043);
        this.add.circle(W - 40, 148, 4, 0xffeb3b);
    }

    private buildCanoe() {
        const c = this.add.container(CANOE_X, SWIM_Y - 10);
        const g = this.add.graphics();
        // Upside-down hull
        g.fillStyle(0x5d3a1a, 1);
        g.beginPath();
        g.moveTo(-70, 0);
        g.lineTo(-55, -18);
        g.lineTo(55, -18);
        g.lineTo(70, 0);
        g.closePath();
        g.fillPath();
        g.fillStyle(0x7a4f26, 1);
        g.fillRect(-50, -15, 100, 4);
        c.add(g);
        // Floating paddle
        c.add(this.add.rectangle(10, 26, 60, 4, 0x8d6e3f).setAngle(12));
        c.add(this.add.ellipse(44, 33, 18, 8, 0x8d6e3f).setAngle(12));
        c.setAngle(-6);
        this.canoe = c;

        this.tweens.add({ targets: c, angle: 6, y: c.y + 4, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }

    private buildHero() {
        const c = this.add.container(START_X, SWIM_Y);

        // Ripple ring around the swimmer
        const ring = this.add.ellipse(0, 6, 54, 12, 0x9ec9d6, 0.35);
        c.add(ring);
        this.tweens.add({ targets: ring, scaleX: 1.25, alpha: 0.1, duration: 700, repeat: -1 });

        // Arms (stroke animation swaps them)
        const armL = this.add.rectangle(-14, -4, 6, 18, 0x8b5e3c).setOrigin(0.5, 1);
        const armR = this.add.rectangle(14, -4, 6, 18, 0x8b5e3c).setOrigin(0.5, 1);
        this.heroArms = [armL, armR];
        c.add([armL, armR]);

        // Shoulders at the waterline
        c.add(this.add.rectangle(0, 2, 22, 8, 0xff7043));
        // Head
        c.add(this.add.circle(0, -12, 11, 0x1a1a1a));
        c.add(this.add.circle(0, -10, 9, 0x8b5e3c));
        // Wide, scared eyes
        c.add(this.add.circle(-3.5, -12, 3, 0xffffff));
        c.add(this.add.circle(3.5, -12, 3, 0xffffff));
        c.add(this.add.circle(-3, -12, 1.4, 0x000000));
        c.add(this.add.circle(4, -12, 1.4, 0x000000));
        c.add(this.add.ellipse(0, -5, 4, 4, 0x5d1f1f));

        // Water covering the lower body
        c.add(this.add.rectangle(0, 12, 40, 14, 0x183444));
        c.setScale(1.4);
        this.hero = c;
    }

    private buildCroc() {
        const c = this.add.container(START_X - CROC_GAP_BY_LIVES[3], SWIM_Y + 4).setScale(1.35);

        this.crocWake = this.add.graphics();
        c.add(this.crocWake);

        // Long shadow under the water
        c.add(this.add.ellipse(-70, 10, 190, 26, 0x05140c, 0.55));
        // Ridges breaking the surface
        for (let i = 0; i < 6; i++) {
            c.add(this.add.triangle(-30 - i * 22, 0, 0, 6, 5, -2, 10, 6, 0x1e3b22));
        }

        // Lower jaw (opens downward on a lunge)
        const jb = this.add.container(10, 4);
        const jbg = this.add.graphics();
        jbg.fillStyle(0x2e5e2f, 1);
        jbg.fillRoundedRect(0, -3, 62, 9, 4);
        jbg.fillStyle(0x8e1b1b, 1);
        jbg.fillRect(4, -3, 52, 3);
        jb.add(jbg);
        for (let t = 0; t < 7; t++) jb.add(this.add.triangle(8 + t * 7, -6, 0, 4, 3, -3, 6, 4, 0xfafafa));
        this.crocJawBottom = jb;

        // Head + upper jaw (snout pivots up)
        const jt = this.add.container(10, 0);
        const jtg = this.add.graphics();
        jtg.fillStyle(0x2f6b33, 1);
        jtg.fillRoundedRect(0, -8, 66, 11, 5);
        jtg.fillStyle(0x1e3b22, 1);
        jtg.fillCircle(60, -9, 3);
        jtg.fillCircle(52, -9, 3);
        jt.add(jtg);
        for (let t = 0; t < 7; t++) jt.add(this.add.triangle(8 + t * 7, 5, 0, -4, 3, 3, 6, -4, 0xfafafa));
        this.crocJawTop = jt;
        this.sandal = this.add.rectangle(66, 0, 22, 9, 0x8d4f2a).setVisible(false);
        jt.add(this.sandal);

        c.add([jb, jt]);

        // Head dome + glowing eyes (always above water)
        c.add(this.add.ellipse(4, -6, 34, 16, 0x2f6b33));
        const glow1 = this.add.circle(-2, -14, 9, 0xffd600, 0.25);
        const glow2 = this.add.circle(12, -14, 9, 0xffd600, 0.25);
        c.add([glow1, glow2]);
        c.add(this.add.circle(-2, -14, 5, 0xffeb3b));
        c.add(this.add.circle(12, -14, 5, 0xffeb3b));
        c.add(this.add.ellipse(-1, -14, 2, 7, 0x000000));
        c.add(this.add.ellipse(13, -14, 2, 7, 0x000000));
        this.tweens.add({ targets: [glow1, glow2], alpha: 0.05, duration: 900, yoyo: true, repeat: -1 });

        this.croc = c;
    }

    private buildRain(W: number, H: number) {
        this.rain = [];
        for (let i = 0; i < 90; i++) {
            const r = this.add.rectangle(Math.random() * W, Math.random() * H, 1.5, 12, 0xb0c4de, 0.35).setAngle(12).setDepth(40);
            (r as any)._speed = 380 + Math.random() * 200;
            this.rain.push(r);
        }
    }

    // ---------- Story beats ----------

    private playIntro() {
        // Start standing in the canoe, then tumble into the water
        this.busy = true;
        this.hero.setPosition(CANOE_X, SWIM_Y - 46).setAngle(0);
        this.croc.setAlpha(0);
        this.time.delayedCall(350, () => {
            this.tweens.add({
                targets: this.hero,
                x: START_X,
                y: SWIM_Y,
                angle: 360,
                duration: 650,
                ease: "Quad.easeIn",
                onComplete: () => {
                    this.hero.setAngle(0);
                    this.spawnSplash(this.hero.x, SWIM_Y + 6, 18);
                    this.shake(180, 0.006);
                    this.showLabel("SPLASH! SWIM!", "#90caf9");
                    this.tweens.add({ targets: this.croc, alpha: 1, duration: 900, delay: 300 });
                    this.time.delayedCall(500, () => (this.busy = false));
                },
            });
        });
    }

    handleAnswerResult(isCorrect: boolean, fx: AnswerFx) {
        if (!this.hero || !this.croc || this.finished) return;
        this.livesLeft = fx.livesLeft;

        if (isCorrect) {
            this.strokes++;
            const grabbedRope = !!this.rope;
            this.endRescue();
            if (fx.isLast) {
                this.escape();
                return;
            }
            if (grabbedRope) {
                this.crocPushback = 150;
                this.tweens.add({ targets: this, crocPushback: 0, duration: 3000, delay: 800, ease: "Sine.easeIn" });
                this.showLabel("YOU GRABBED THE ROPE!", "#69f0ae");
            } else if (fx.close) {
                // The jaws slam shut right behind the swimmer
                this.openJaws(true);
                this.time.delayedCall(260, () => {
                    this.openJaws(false);
                    playChompSFX();
                });
                this.showLabel("😅 PHEW! JUST IN TIME!", "#ffeb3b");
            } else if (fx.fast || fx.streak) {
                // A burst of speed shoves the croc back for a moment
                this.crocPushback = fx.streak ? 120 : 80;
                this.tweens.add({ targets: this, crocPushback: 0, duration: 2500, delay: 600, ease: "Sine.easeIn" });
                this.showLabel(fx.streak ? "🔥 SUPER SWIMMER!" : "⚡ TURBO STROKE!", "#ffeb3b");
            }
            this.swimTo(this.strokeX(this.strokes), fx.fast ? 380 : 600);
            this.spawnSplash(this.hero.x + 10, SWIM_Y, fx.fast ? 14 : 8);
        } else if (fx.rescue) {
            this.lunge(false);
            this.time.delayedCall(900, () => this.startRescue());
        } else if (fx.livesLeft <= 0) {
            this.endRescue();
            this.caught();
        } else {
            this.lunge(fx.isLast);
        }
    }

    private strokeX(n: number) {
        return START_X + ((SHORE_X - 60 - START_X) * Math.min(n, this.totalStrokes)) / this.totalStrokes;
    }

    private swimTo(x: number, duration: number) {
        this.tweens.add({
            targets: this.hero,
            x,
            duration,
            ease: "Cubic.easeOut",
        });
        // Quick flurry of arm strokes
        this.tweens.add({
            targets: this,
            armPhase: this.armPhase + Math.PI * 4,
            duration,
        });
    }

    private lunge(isLast: boolean) {
        this.busy = true;
        const startX = this.croc.x;
        const bite = this.hero.x - 95;

        this.openJaws(true);
        this.tweens.add({
            targets: this.croc,
            x: bite,
            y: SWIM_Y - 6,
            duration: 260,
            ease: "Quad.easeIn",
            onComplete: () => {
                this.openJaws(false);
                playChompSFX();
                this.shake(220, 0.012);
                this.spawnSplash(this.hero.x - 20, SWIM_Y + 4, 16);
                this.showLabel("SNAP!", "#ff5252");
                // Hero flinches forward, just escaping
                this.tweens.add({ targets: this.hero, x: this.hero.x + 14, angle: 12, duration: 120, yoyo: true });
                this.tweens.add({
                    targets: this.croc,
                    x: startX,
                    y: SWIM_Y + 4,
                    duration: 700,
                    delay: 200,
                    ease: "Sine.easeOut",
                    onComplete: () => {
                        this.busy = false;
                        if (isLast) this.escape();
                    },
                });
            },
        });
    }

    private caught() {
        // Kept safe for little ones: the croc only steals a sandal and the
        // child scrambles back onto the canoe. Nobody goes under the water.
        this.busy = true;
        this.finished = true;
        this.openJaws(true);
        this.tweens.add({
            targets: this.croc,
            x: this.hero.x - 90,
            y: SWIM_Y - 8,
            duration: 300,
            ease: "Quad.easeIn",
            onComplete: () => {
                this.openJaws(false);
                this.sandal.setVisible(true);
                playChompSFX();
                this.shake(300, 0.012);
                this.spawnSplash(this.hero.x, SWIM_Y, 22);
                this.showLabel("CHOMP! IT GOT YOUR SANDAL!", "#ff5252");
                // Leap back to the canoe in fright
                this.tweens.add({ targets: this.hero, x: CANOE_X, duration: 700, delay: 200, ease: "Sine.easeInOut" });
                this.tweens.add({
                    targets: this.hero,
                    y: SWIM_Y - 110,
                    duration: 350,
                    delay: 200,
                    ease: "Quad.easeOut",
                    yoyo: false,
                    onComplete: () => {
                        this.tweens.add({ targets: this.hero, y: SWIM_Y - 46, duration: 350, ease: "Bounce.easeOut" });
                    },
                });
                // The croc swims off with its prize
                this.tweens.add({ targets: this.croc, x: -200, y: SWIM_Y + 4, duration: 2200, delay: 600, ease: "Sine.easeIn" });
            },
        });
    }

    private startRescue() {
        if (this.finished || this.rope) return;
        const boat = this.add.container(this.scale.width + 80, 150);
        const g = this.add.graphics();
        g.fillStyle(0x6d4c1d, 1);
        g.beginPath();
        g.moveTo(-40, 0);
        g.lineTo(40, 0);
        g.lineTo(30, 12);
        g.lineTo(-30, 12);
        g.closePath();
        g.fillPath();
        boat.add(g);
        // Fisherman
        boat.add(this.add.rectangle(0, -10, 12, 18, 0xfcd116));
        boat.add(this.add.circle(0, -24, 7, 0x6d4c3c));
        boat.add(this.add.triangle(0, -32, -10, 4, 0, -6, 10, 4, 0xce1126));
        this.fisherBoat = boat;
        this.rope = this.add.graphics();

        this.tweens.add({ targets: boat, x: this.hero.x + 90, duration: 900, ease: "Sine.easeOut" });
        this.showLabel("A ROPE! GET THIS ONE RIGHT!", "#ffeb3b");
    }

    private endRescue() {
        if (!this.rope) return;
        const boat = this.fisherBoat;
        this.rope.destroy();
        this.rope = undefined;
        this.fisherBoat = undefined;
        if (boat) {
            this.tweens.add({ targets: boat, x: this.scale.width + 120, duration: 1200, onComplete: () => boat.destroy() });
        }
    }

    private escape() {
        this.busy = true;
        this.finished = true;
        this.danger = 0;
        this.swimTo(SHORE_X + 30, 700);
        this.time.delayedCall(700, () => {
            // Climb onto the beach and celebrate
            this.tweens.add({
                targets: this.hero,
                x: SHORE_X + 60,
                y: 150,
                duration: 500,
                ease: "Quad.easeOut",
                onComplete: () => {
                    this.showLabel("SAFE! YOU ESCAPED!", "#69f0ae");
                    this.spawnSparkles(this.hero.x, this.hero.y - 20);
                    this.tweens.add({ targets: this.hero, y: 135, duration: 260, yoyo: true, repeat: 3, ease: "Quad.easeOut" });
                    this.heroArms.forEach((a, i) => a.setAngle(i === 0 ? 160 : -160));
                },
            });
            // The croc snaps at nothing, then sinks away sulking
            this.openJaws(true);
            this.tweens.add({
                targets: this.croc,
                x: SHORE_X - 90,
                duration: 500,
                onComplete: () => {
                    this.openJaws(false);
                    playChompSFX();
                    this.tweens.add({ targets: this.croc, x: SHORE_X - 260, alpha: 0.2, duration: 1600, delay: 300 });
                },
            });
        });
    }

    private openJaws(open: boolean) {
        this.tweens.add({ targets: this.crocJawTop, angle: open ? -32 : 0, duration: open ? 160 : 70 });
        this.tweens.add({ targets: this.crocJawBottom, angle: open ? 18 : 0, duration: open ? 160 : 70 });
    }

    private showLabel(text: string, color: string) {
        this.tweens.killTweensOf(this.label);
        this.label.setText(text).setColor(color).setScale(0.4).setAlpha(1);
        this.tweens.add({ targets: this.label, scale: 1, duration: 260, ease: "Back.easeOut" });
        this.tweens.add({ targets: this.label, alpha: 0, duration: 400, delay: 1100 });
    }

    // ---------- Effects ----------

    private spawnSplash(x: number, y: number, count: number) {
        for (let i = 0; i < count; i++) {
            const drop = this.add.circle(x, y, 2 + Math.random() * 3, 0xb3e5fc, 0.85).setDepth(30);
            const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const d = 15 + Math.random() * 35;
            this.tweens.add({
                targets: drop,
                x: x + Math.cos(a) * d,
                y: y + Math.sin(a) * d,
                alpha: 0,
                duration: 450 + Math.random() * 250,
                ease: "Sine.easeOut",
                onComplete: () => drop.destroy(),
            });
        }
    }

    private spawnBubbles(x: number, y: number) {
        const b = this.add.circle(x, y + 10, 3 + Math.random() * 4).setStrokeStyle(1.5, 0xb3e5fc, 0.8);
        this.tweens.add({ targets: b, y: y - 10, alpha: 0, duration: 700, onComplete: () => b.destroy() });
    }

    private spawnSparkles(x: number, y: number) {
        const colors = [0xffeb3b, 0x69f0ae, 0xffffff, 0xff8a65];
        for (let i = 0; i < 18; i++) {
            const s = this.add.star(x, y, 4, 2, 5, colors[i % colors.length]).setDepth(30);
            const a = Math.random() * Math.PI * 2;
            const d = 25 + Math.random() * 40;
            this.tweens.add({
                targets: s,
                x: x + Math.cos(a) * d,
                y: y + Math.sin(a) * d - 15,
                alpha: 0,
                duration: 700 + Math.random() * 300,
                onComplete: () => s.destroy(),
            });
        }
    }

    private lightning() {
        // One soft flash (no strobing), and none at all with reduced motion
        if (this.reducedMotion) return;
        this.flash.setAlpha(0.3);
        this.tweens.add({ targets: this.flash, alpha: 0, duration: 450 });
        this.time.delayedCall(400, () => playThunderSFX());
    }

    private shake(duration: number, intensity: number) {
        if (!this.reducedMotion) this.cameras.main.shake(duration, intensity);
    }

    update(time: number, delta: number) {
        const W = this.scale.width;
        const H = this.scale.height;
        const dt = delta / 1000;

        this.waves.forEach((w) => {
            w.x -= (w as any)._speed * dt;
            if (w.x < -60) w.x = W + 60;
        });
        this.rain.forEach((r) => {
            r.y += (r as any)._speed * dt;
            r.x -= 60 * dt;
            if (r.y > H) {
                r.y = -12;
                r.x = Math.random() * (W + 60);
            }
        });

        if (time > this.nextLightning) {
            this.lightning();
            this.nextLightning = time + 7000 + Math.random() * 9000;
        }

        if (!this.hero || !this.croc) return;

        // Paddling arms + bob
        if (!this.finished) {
            this.armPhase += dt * (2 + this.danger * 4);
            this.heroArms[0].setAngle(Math.sin(this.armPhase) * 40 - 20);
            this.heroArms[1].setAngle(-Math.sin(this.armPhase) * 40 + 20);
            if (!this.busy) this.hero.y = SWIM_Y + Math.sin(time / 300) * 2;
        }

        // The croc stalks the hero: closer with fewer lives and as the clock runs down
        if (!this.busy && !this.finished) {
            const gap = CROC_GAP_BY_LIVES[Phaser.Math.Clamp(this.livesLeft, 1, 3)];
            const creep = Math.max(0, (this.danger - READING_GRACE) / (1 - READING_GRACE));
            const target = this.hero.x - gap * (1 - 0.3 * creep) - this.crocPushback;
            this.croc.x += (target - this.croc.x) * Math.min(1, dt * 2.5);
            this.croc.y = SWIM_Y + 4 + Math.sin(time / 500) * 2;
        }

        // Wake trailing behind the croc
        this.crocWake.clear();
        this.crocWake.lineStyle(2, 0x9ec9d6, 0.3);
        this.crocWake.lineBetween(-10, 0, -120, -16);
        this.crocWake.lineBetween(-10, 6, -120, 22);

        if (this.rope && this.fisherBoat) {
            this.rope.clear();
            this.rope.lineStyle(2, 0xd7ccc8, 1);
            this.rope.lineBetween(this.fisherBoat.x - 6, this.fisherBoat.y - 14, this.hero.x + 12, this.hero.y - 8);
        }

        // Proximity drives the red pulse and the heartbeat
        const dist = this.hero.x - this.croc.x;
        const threat = this.finished ? 0 : Phaser.Math.Clamp((290 - dist) / 180, 0, 1);
        const pulse = this.reducedMotion ? 0 : 0.06 * Math.sin(time / 250);
        this.dangerOverlay.setAlpha(threat * (0.16 + pulse));
        if (threat > 0.35 && time > this.nextHeartbeat) {
            playHeartbeatSFX();
            this.nextHeartbeat = time + 1000 - threat * 550;
        }
    }
}
