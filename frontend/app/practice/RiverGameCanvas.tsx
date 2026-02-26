"use client";

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from "react";
import * as Phaser from "phaser";

export interface RiverGameHandle {
    handleAnswerResult(isCorrect: boolean): void;
}

class RiverScene extends Phaser.Scene {
    private heroContainer!: Phaser.GameObjects.Container;
    private crocContainer!: Phaser.GameObjects.Container;
    private crocMouthParts: Phaser.GameObjects.GameObject[] = [];
    private stones: { x: number; y: number }[] = [];
    private currentStoneIndex = 0;
    private maxStones = 10;
    private ripples: Phaser.GameObjects.Ellipse[] = [];
    private clouds: Phaser.GameObjects.Container[] = [];
    private heroIdleTween?: Phaser.Tweens.Tween;
    private wrongCount = 0;

    constructor() {
        super("RiverScene");
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.buildSky(W, H);
        this.buildSun(W);
        this.buildClouds(W);
        this.buildTopBank(W, H);
        this.buildRiver(W, H);
        this.buildBottomBank(W, H);
        this.buildRipples(W, H);
        this.buildStones(W, H);
        this.buildHero();
        this.buildCrocodile(W, H);
    }

    private buildSky(W: number, H: number) {
        for (let i = 0; i < 8; i++) {
            const t = i / 8;
            const r = Math.round(100 + t * 35);
            const g = Math.round(180 + t * 40);
            const color = (r << 16) | (g << 8) | 255;
            this.add.rectangle(W / 2, (H * t) / 2 + H / 32, W, H / 16 + 2, color);
        }
    }

    private buildSun(W: number) {
        const sx = W - 80, sy = 45;
        for (let i = 8; i > 0; i--) {
            this.add.circle(sx, sy, 20 + i * 6, 0xfff176, 0.08);
        }
        this.add.circle(sx, sy, 22, 0xfff9c4);
        this.add.circle(sx, sy, 16, 0xffee58);
    }

    private buildClouds(W: number) {
        [
            { x: 80, y: 30, s: 1 },
            { x: 300, y: 20, s: 0.8 },
            { x: 550, y: 35, s: 1.1 },
            { x: 750, y: 18, s: 0.7 },
        ].forEach((c) => {
            const cont = this.add.container(c.x, c.y);
            cont.add(this.add.ellipse(0, 0, 60 * c.s, 24 * c.s, 0xffffff, 0.85));
            cont.add(this.add.ellipse(-20 * c.s, -4 * c.s, 40 * c.s, 20 * c.s, 0xffffff, 0.85));
            cont.add(this.add.ellipse(22 * c.s, -2 * c.s, 36 * c.s, 18 * c.s, 0xffffff, 0.85));
            this.clouds.push(cont);
        });
    }

    private buildTopBank(W: number, H: number) {
        const bh = H * 0.2;
        this.add.rectangle(W / 2, bh / 2, W, bh, 0x2d5016);
        this.add.rectangle(W / 2, bh * 0.35, W, bh * 0.7, 0x3a6b1e);

        // Grass blades
        for (let i = 0; i < W; i += 12) {
            const h = 6 + Math.sin(i * 0.3) * 4;
            this.add.rectangle(i + 2, bh - h / 2, 5, h, 0x4a8c2a);
        }

        this.buildPalmTrees(W, bh);
        this.buildBushes(W, bh, true);
        this.buildFlowers(W, bh);
    }

    private buildPalmTrees(W: number, bankH: number) {
        [60, 220, 430, 650, 830].forEach((px) => {
            const base = bankH - 4;

            // Trunk
            this.add.rectangle(px, base - 25, 8, 50, 0x6d4c1d);
            this.add.rectangle(px, base - 25, 4, 50, 0x7d5a2a);

            // Fronds
            const colors = [0x228b22, 0x2e8b57, 0x32cd32, 0x228b22, 0x2e8b57];
            for (let l = 0; l < 5; l++) {
                const angle = -Math.PI / 2 + (l - 2) * 0.5;
                const len = 30 + Math.random() * 15;
                const endX = px + Math.cos(angle) * len;
                const endY = base - 50 + Math.sin(angle) * len;
                const midX = px + Math.cos(angle) * len * 0.5;
                const midY = base - 50 + Math.sin(angle) * len * 0.5 - 8;

                const gfx = this.add.graphics();
                gfx.fillStyle(colors[l], 1);
                gfx.beginPath();
                gfx.moveTo(px, base - 48);
                gfx.lineTo(midX - 6, midY);
                gfx.lineTo(endX, endY);
                gfx.lineTo(midX + 6, midY);
                gfx.closePath();
                gfx.fillPath();
            }

            // Coconuts
            this.add.circle(px + 6, base - 46, 4, 0x8b6914);
            this.add.circle(px - 5, base - 44, 3, 0x8b6914);
        });
    }

    private buildBushes(W: number, bankH: number, top: boolean) {
        for (let i = 0; i < 10; i++) {
            const bx = i * (W / 10) + 20 + Math.random() * 30;
            const by = top ? bankH - 6 : bankH + 10;
            const sz = 10 + Math.random() * 8;
            this.add.circle(bx, by, sz, 0x2d8a2d);
            this.add.circle(bx - 4, by - 3, sz * 0.7, 0x3cb043);
            this.add.circle(bx + 3, by - 5, sz * 0.5, 0x50c878);
        }
    }

    private buildFlowers(W: number, bankH: number) {
        const colors = [0xff6b6b, 0xffd93d, 0xff8fd8, 0xffffff, 0xff9a3c];
        for (let i = 0; i < 15; i++) {
            const fx = Math.random() * W;
            const fy = bankH - 2 - Math.random() * 10;
            this.add.rectangle(fx, fy + 3, 1, 6, 0x3a6b1e);
            this.add.circle(fx, fy, 2.5, colors[Math.floor(Math.random() * colors.length)]);
            this.add.circle(fx, fy, 1, 0xffeb3b);
        }
    }

    private buildRiver(W: number, H: number) {
        const rt = H * 0.2;
        const rh = H * 0.6;
        this.add.rectangle(W / 2, rt + rh / 2, W, rh, 0x0d47a1);
        this.add.rectangle(W / 2, rt + rh * 0.4, W, rh * 0.8, 0x1565c0);
        this.add.rectangle(W / 2, rt + rh * 0.3, W, rh * 0.6, 0x1976d2);
        this.add.rectangle(W / 2, rt + rh * 0.15, W, rh * 0.3, 0x1e88e5);

        // Static light streaks
        for (let i = 0; i < 30; i++) {
            const rx = Math.random() * W;
            const ry = rt + Math.random() * rh;
            this.add.ellipse(rx, ry, 40 + Math.random() * 60, 3, 0x42a5f5, 0.3);
        }
    }

    private buildBottomBank(W: number, H: number) {
        const bt = H * 0.8;
        const bh = H * 0.2;
        this.add.rectangle(W / 2, bt + bh / 2, W, bh, 0x2d5016);
        this.add.rectangle(W / 2, bt + bh * 0.2, W, bh * 0.4, 0x3a6b1e);

        for (let i = 0; i < W; i += 10) {
            const h = 5 + Math.sin(i * 0.4) * 3;
            this.add.rectangle(i + 2, bt + h / 2, 4, h, 0x4a8c2a);
        }

        this.buildBushes(W, bt, false);

        // Ghana flag at finish
        const fx = W - 50, fy = bt + 4;
        this.add.rectangle(fx + 1, fy + 15, 3, 30, 0x6d4c1d);
        this.add.rectangle(fx + 13, fy + 3, 20, 7, 0xce1126);
        this.add.rectangle(fx + 13, fy + 10, 20, 7, 0xfcd116);
        this.add.rectangle(fx + 13, fy + 17, 20, 7, 0x006b3f);
        this.add.star(fx + 13, fy + 10, 5, 1.5, 3.5, 0x000000);
    }

    private buildRipples(W: number, H: number) {
        this.ripples = [];
        for (let i = 0; i < 20; i++) {
            const ry = H * 0.25 + Math.random() * H * 0.5;
            const rw = 40 + Math.random() * 40;
            const r = this.add.ellipse(Math.random() * W, ry, rw, 4, 0x90caf9, 0.35);
            (r as any)._dir = Math.random() > 0.5 ? 1 : -1;
            (r as any)._speed = 15 + Math.random() * 25;
            this.ripples.push(r);
        }
    }

    private buildStones(W: number, H: number) {
        this.stones = [];
        this.maxStones = 10;
        for (let i = 0; i < this.maxStones; i++) {
            const x = W * (0.08 + (0.84 / (this.maxStones - 1)) * i);
            const y = H * 0.48 + (i % 2 === 0 ? -18 : 18);

            // Shadow
            this.add.ellipse(x + 2, y + 5, 48, 18, 0x000000, 0.2);
            // Stone body
            this.add.ellipse(x, y, 48, 22, 0x9e9e9e);
            this.add.ellipse(x - 2, y - 2, 36, 14, 0xbdbdbd);
            this.add.ellipse(x - 4, y - 4, 20, 8, 0xd6d6d6);
            // Moss
            this.add.ellipse(x + 16, y + 4, 10, 6, 0x4caf50, 0.5);
            this.add.ellipse(x - 18, y + 2, 8, 5, 0x4caf50, 0.5);

            this.stones.push({ x, y });
        }
    }

    private buildHero() {
        const s = this.stones[0];
        const cont = this.add.container(s.x, s.y - 34);

        // Hair
        cont.add(this.add.circle(0, -18, 11, 0x1a1a1a));
        // Head
        cont.add(this.add.circle(0, -16, 9, 0x8b5e3c));
        // Eyes whites
        cont.add(this.add.circle(-3, -18, 2.5, 0xffffff));
        cont.add(this.add.circle(3, -18, 2.5, 0xffffff));
        // Pupils
        cont.add(this.add.circle(-3, -18, 1.2, 0x000000));
        cont.add(this.add.circle(3, -18, 1.2, 0x000000));
        // Mouth
        cont.add(this.add.ellipse(0, -13, 5, 2, 0xd32f2f));
        // Body (shirt)
        cont.add(this.add.rectangle(0, -1, 14, 16, 0xff7043));
        // Shirt detail
        cont.add(this.add.rectangle(0, -4, 8, 5, 0xffab91));
        // Arms
        cont.add(this.add.rectangle(-10, -2, 5, 12, 0x8b5e3c));
        cont.add(this.add.rectangle(10, -2, 5, 12, 0x8b5e3c));
        // Legs
        cont.add(this.add.rectangle(-4, 13, 5, 10, 0x1565c0));
        cont.add(this.add.rectangle(4, 13, 5, 10, 0x1565c0));
        // Shoes
        cont.add(this.add.rectangle(-4, 19, 6, 3, 0x5d4037));
        cont.add(this.add.rectangle(4, 19, 6, 3, 0x5d4037));

        this.heroContainer = cont;

        this.heroIdleTween = this.tweens.add({
            targets: cont,
            y: cont.y - 3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    private buildCrocodile(W: number, H: number) {
        const cx = W * 0.12;
        const cy = H * 0.68;
        const cont = this.add.container(cx, cy);

        // Body shape via Graphics path (safe)
        const body = this.add.graphics();
        body.fillStyle(0x2e7d32, 1);
        body.beginPath();
        body.moveTo(-50, 0);
        body.lineTo(-40, -10);
        body.lineTo(-20, -12);
        body.lineTo(0, -10);
        body.lineTo(30, -8);
        body.lineTo(50, -4);
        body.lineTo(55, 0);
        body.lineTo(50, 6);
        body.lineTo(30, 10);
        body.lineTo(0, 12);
        body.lineTo(-20, 10);
        body.lineTo(-40, 8);
        body.closePath();
        body.fillPath();

        // Belly
        body.fillStyle(0x4caf50, 1);
        body.beginPath();
        body.moveTo(-40, -1);
        body.lineTo(-20, -6);
        body.lineTo(0, -5);
        body.lineTo(20, -3);
        body.lineTo(40, 0);
        body.lineTo(20, 3);
        body.lineTo(0, 3);
        body.lineTo(-20, 1);
        body.closePath();
        body.fillPath();

        // Spine bumps
        body.fillStyle(0x1b5e20, 1);
        for (let i = -30; i <= 30; i += 10) {
            body.fillCircle(i, -10 + Math.abs(i) * 0.05, 3);
        }

        // Tail
        body.fillStyle(0x1b5e20, 1);
        body.beginPath();
        body.moveTo(-50, 0);
        body.lineTo(-70, -6);
        body.lineTo(-65, 0);
        body.lineTo(-70, 6);
        body.closePath();
        body.fillPath();

        // Snout
        body.fillStyle(0x388e3c, 1);
        body.fillRect(40, -6, 22, 10);

        cont.add(body);

        // Eyes
        cont.add(this.add.circle(44, -10, 5, 0xffeb3b));
        cont.add(this.add.circle(56, -9, 5, 0xffeb3b));
        cont.add(this.add.circle(44, -10, 2.5, 0x000000));
        cont.add(this.add.circle(56, -9, 2.5, 0x000000));
        // Red glint
        cont.add(this.add.circle(43, -10.5, 0.8, 0xff0000));
        cont.add(this.add.circle(55, -9.5, 0.8, 0xff0000));

        // Legs
        cont.add(this.add.rectangle(-25, 14, 6, 8, 0x2e7d32));
        cont.add(this.add.rectangle(-5, 14, 6, 8, 0x2e7d32));
        cont.add(this.add.rectangle(15, 14, 6, 8, 0x2e7d32));
        cont.add(this.add.rectangle(35, 14, 6, 8, 0x2e7d32));

        // Mouth (hidden, shown on wrong answer)
        const mouth = this.add.rectangle(60, 2, 18, 5, 0xc62828);
        mouth.setVisible(false);
        cont.add(mouth);
        this.crocMouthParts.push(mouth);

        // Teeth
        for (let t = 0; t < 5; t++) {
            const tooth = this.add.triangle(
                53 + t * 4, -2,
                0, 4, 2, 0, 4, 4,
                0xffffff
            );
            tooth.setVisible(false);
            cont.add(tooth);
            this.crocMouthParts.push(tooth);
        }

        this.crocContainer = cont;

        // Idle float
        this.tweens.add({
            targets: cont,
            y: cy - 5,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
        this.tweens.add({
            targets: cont,
            x: cx + 8,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    handleAnswerResult(isCorrect: boolean) {
        if (!this.heroContainer || !this.crocContainer) return;

        if (isCorrect) {
            this.heroIdleTween?.stop();

            const nextIdx = Math.min(this.currentStoneIndex + 1, this.maxStones - 1);
            const ns = this.stones[nextIdx];
            this.currentStoneIndex = nextIdx;

            const startY = this.heroContainer.y;
            const endY = ns.y - 34;
            const peakY = Math.min(startY, endY) - 30;

            this.tweens.add({
                targets: this.heroContainer,
                x: ns.x,
                duration: 400,
                ease: "Sine.easeInOut",
            });
            this.tweens.add({
                targets: this.heroContainer,
                y: peakY,
                duration: 200,
                ease: "Sine.easeOut",
                onComplete: () => {
                    this.tweens.add({
                        targets: this.heroContainer,
                        y: endY,
                        duration: 200,
                        ease: "Bounce.easeOut",
                        onComplete: () => {
                            this.spawnSparkles(ns.x, ns.y - 20);
                            this.heroIdleTween = this.tweens.add({
                                targets: this.heroContainer,
                                y: this.heroContainer.y - 3,
                                duration: 800,
                                yoyo: true,
                                repeat: -1,
                                ease: "Sine.easeInOut",
                            });
                        },
                    });
                },
            });

            this.tweens.add({
                targets: this.heroContainer,
                scaleX: 1.15,
                scaleY: 0.85,
                yoyo: true,
                duration: 150,
                repeat: 1,
            });
        } else {
            this.wrongCount++;

            // Hero wobble
            this.tweens.add({
                targets: this.heroContainer,
                y: this.heroContainer.y + 20,
                duration: 150,
                yoyo: true,
                repeat: 1,
                ease: "Sine.easeInOut",
            });
            this.tweens.add({
                targets: this.heroContainer,
                angle: -10,
                yoyo: true,
                duration: 100,
                repeat: 2,
                onComplete: () => this.heroContainer.setAngle(0),
            });

            this.spawnSplash(this.heroContainer.x, this.heroContainer.y + 30);

            // Croc lunges toward hero
            const heroX = this.heroContainer.x;
            this.tweens.add({
                targets: this.crocContainer,
                x: heroX - 70 + this.wrongCount * 20,
                duration: 600,
                ease: "Sine.easeOut",
            });

            // Open mouth
            this.crocMouthParts.forEach((p) => (p as any).setVisible(true));
            this.time.delayedCall(600, () => {
                this.crocMouthParts.forEach((p) => (p as any).setVisible(false));
            });

            // Croc pulsing bigger
            this.tweens.add({
                targets: this.crocContainer,
                scaleX: 1.15,
                scaleY: 1.15,
                yoyo: true,
                duration: 150,
                repeat: 2,
            });
        }
    }

    private spawnSparkles(x: number, y: number) {
        const colors = [0xffeb3b, 0xfff176, 0xffd54f, 0xffe082, 0xffffff];
        for (let i = 0; i < 10; i++) {
            const col = colors[Math.floor(Math.random() * colors.length)];
            const s = this.add.star(x, y, 4, 2, 5, col);
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 30;
            this.tweens.add({
                targets: s,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist - 15,
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 500 + Math.random() * 300,
                ease: "Sine.easeOut",
                onComplete: () => s.destroy(),
            });
        }
    }

    private spawnSplash(x: number, y: number) {
        for (let i = 0; i < 12; i++) {
            const r = 2 + Math.random() * 3;
            const drop = this.add.circle(x, y, r, 0x90caf9, 0.8);
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const dist = 15 + Math.random() * 25;
            this.tweens.add({
                targets: drop,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                duration: 400 + Math.random() * 200,
                ease: "Sine.easeOut",
                onComplete: () => drop.destroy(),
            });
        }

        const ring = this.add.circle(x, y, 5);
        ring.setStrokeStyle(2, 0xbbdefb, 0.7);
        ring.setFillStyle(0, 0);
        this.tweens.add({
            targets: ring,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 500,
            ease: "Sine.easeOut",
            onComplete: () => ring.destroy(),
        });
    }

    update(_time: number, delta: number) {
        const W = this.scale.width;

        this.ripples.forEach((r) => {
            const d = (r as any)._dir as number;
            const spd = (r as any)._speed as number;
            r.x += d * spd * (delta / 1000);
            if (r.x > W + 50) r.x = -50;
            else if (r.x < -50) r.x = W + 50;
        });

        this.clouds.forEach((c, i) => {
            c.x += (8 + i * 2) * (delta / 1000);
            if (c.x > W + 80) c.x = -80;
        });
    }
}

const RiverGameCanvas = forwardRef<RiverGameHandle>((_props, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<RiverScene | null>(null);

    useImperativeHandle(ref, () => ({
        handleAnswerResult(isCorrect: boolean) {
            sceneRef.current?.handleAnswerResult(isCorrect);
        },
    }));

    useEffect(() => {
        if (!containerRef.current) return;
        if (gameRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 900,
            height: 400,
            parent: containerRef.current,
            backgroundColor: "#87ceeb",
            scene: [RiverScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
            },
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;

        game.events.on(Phaser.Core.Events.READY, () => {
            const scene = game.scene.getScene("RiverScene") as RiverScene;
            sceneRef.current = scene;
        });

        return () => {
            game.destroy(true);
            gameRef.current = null;
            sceneRef.current = null;
        };
    }, []);

    return (
        <div className="w-full flex justify-center mb-6">
            <div
                ref={containerRef}
                className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border-4 border-green-600"
                style={{ aspectRatio: "900/400" }}
            />
        </div>
    );
});

RiverGameCanvas.displayName = "RiverGameCanvas";

export default RiverGameCanvas;
