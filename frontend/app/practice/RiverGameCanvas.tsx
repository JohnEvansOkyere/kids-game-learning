"use client";

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from "react";
import type * as Phaser from "phaser";
import type { AnswerFx, RiverScene } from "./RiverScene";

export interface RiverGameHandle {
    handleAnswerResult(isCorrect: boolean, fx: AnswerFx): void;
    setDanger(level: number): void;
    announce(text: string, color?: string): void;
}

interface Props {
    totalQuestions: number;
    /** Turns the frame red when the croc is close */
    danger?: boolean;
}

const RiverGameCanvas = forwardRef<RiverGameHandle, Props>(({ totalQuestions, danger }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<RiverScene | null>(null);

    useImperativeHandle(ref, () => ({
        handleAnswerResult(isCorrect: boolean, fx: AnswerFx) {
            sceneRef.current?.handleAnswerResult(isCorrect, fx);
        },
        setDanger(level: number) {
            sceneRef.current?.setDanger(level);
        },
        announce(text: string, color?: string) {
            sceneRef.current?.announce(text, color);
        },
    }));

    useEffect(() => {
        if (!containerRef.current) return;
        if (gameRef.current) return;

        // Phaser touches `window` on import, so load it only in the browser
        let cancelled = false;
        const parent = containerRef.current;

        Promise.all([import("phaser"), import("./RiverScene")]).then(
            ([PhaserLib, { RiverScene: Scene }]) => {
                if (cancelled) return;

                const config: Phaser.Types.Core.GameConfig = {
                    type: PhaserLib.AUTO,
                    width: 900,
                    height: 400,
                    parent,
                    backgroundColor: "#1a1033",
                    scene: [Scene],
                    scale: {
                        mode: PhaserLib.Scale.FIT,
                        autoCenter: PhaserLib.Scale.CENTER_HORIZONTALLY,
                    },
                };

                const game = new PhaserLib.Game(config);
                gameRef.current = game;

                game.events.on(PhaserLib.Core.Events.READY, () => {
                    const scene = game.scene.getScene("RiverScene") as RiverScene;
                    scene.setTotalQuestions(totalQuestions);
                    sceneRef.current = scene;
                });
            }
        );

        return () => {
            cancelled = true;
            gameRef.current?.destroy(true);
            gameRef.current = null;
            sceneRef.current = null;
        };
        // The game is built once per mount; the page remounts it for a new session
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mb-4 flex w-full justify-center">
            {/* Storm-coloured while Phaser loads, so there is no blank flash */}
            <div
                ref={containerRef}
                className={`w-full max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-b from-[#1a1033] to-[#0c1f2b] shadow-card ring-4 transition-colors duration-300 ${
                    danger ? "ring-danger" : "ring-white"
                }`}
                style={{ aspectRatio: "900/400" }}
            />
        </div>
    );
});

RiverGameCanvas.displayName = "RiverGameCanvas";

export default RiverGameCanvas;
