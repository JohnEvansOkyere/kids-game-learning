"use client";

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from "react";
import type * as Phaser from "phaser";
import type { RiverScene } from "./RiverScene";

export interface RiverGameHandle {
    handleAnswerResult(isCorrect: boolean): void;
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
                    backgroundColor: "#87ceeb",
                    scene: [Scene],
                    scale: {
                        mode: PhaserLib.Scale.FIT,
                        autoCenter: PhaserLib.Scale.CENTER_HORIZONTALLY,
                    },
                };

                const game = new PhaserLib.Game(config);
                gameRef.current = game;

                game.events.on(PhaserLib.Core.Events.READY, () => {
                    sceneRef.current = game.scene.getScene("RiverScene") as RiverScene;
                });
            }
        );

        return () => {
            cancelled = true;
            gameRef.current?.destroy(true);
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
