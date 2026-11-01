"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GameDone, GameTopBar } from "@/components/games/GameScreen";
import Button from "@/components/ui/Button";
import type { Student } from "@/lib/types";

type Order = { item: string; price: number; paid: number };
const EASY: Order[] = [
    { item: "orange", price: 2, paid: 5 },
    { item: "banana", price: 4, paid: 5 },
    { item: "mango", price: 3, paid: 5 },
    { item: "corn", price: 6, paid: 10 },
    { item: "bread", price: 8, paid: 10 },
    { item: "coconut", price: 7, paid: 10 },
];
const HARD: Order[] = [
    { item: "pineapple", price: 12, paid: 20 },
    { item: "tomatoes", price: 16, paid: 20 },
    { item: "fish", price: 23, paid: 30 },
    { item: "basket", price: 28, paid: 30 },
    { item: "watermelon", price: 34, paid: 40 },
    { item: "rice", price: 37, paid: 40 },
];
const COINS = [1, 2, 5, 10];

function shuffledOrders(source: Order[]): Order[] {
    const copy = [...source];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export default function MarketDayPage() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [started, setStarted] = useState(false);
    const [round, setRound] = useState(0);
    const [tray, setTray] = useState<number[]>([]);
    const [mistakes, setMistakes] = useState(0);
    const [message, setMessage] = useState("");
    const [celebrating, setCelebrating] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(0);
    const [combo, setCombo] = useState(0);
    const [roundMistakes, setRoundMistakes] = useState(0);
    const [hint, setHint] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("selectedStudent");
            if (!raw) { router.push("/student/select"); return; }
            const selected = JSON.parse(raw) as Student;
            setStudent(selected);
            const saved = localStorage.getItem(`marketBest_${selected.id}`);
            setBest(saved ? Number(saved) || 0 : 0);
        } catch { router.push("/student/select"); }
    }, [router]);

    const order = orders[round];
    const total = tray.reduce((sum, coin) => sum + coin, 0);
    const change = order ? order.paid - order.price : 0;

    function restart() {
        const pool = student?.gradeLevel === "KG1" || student?.gradeLevel === "KG2" || student?.gradeLevel === "P1" ? EASY : HARD;
        setOrders(shuffledOrders(pool));
        setRound(0); setTray([]); setMistakes(0); setMessage("");
        setScore(0); setCombo(0); setRoundMistakes(0); setHint(false);
        setCelebrating(false); setStarted(true);
    }

    function addCoin(coin: number) {
        if (celebrating || !order) return;
        const next = total + coin;
        if (next > change) {
            setMistakes((n) => n + 1);
            setRoundMistakes((n) => n + 1);
            setCombo(0);
            setMessage(`That coin is too big. You need ₵${change - total} more.`);
            return;
        }
        setTray((coins) => [...coins, coin]);
        setMessage("");
        if (next === change) {
            setCelebrating(true);
            setMessage(`Yes! ${order.paid} minus ${order.price} is ${change}.`);
            const earned = Math.max(50, 100 - roundMistakes * 20) + (roundMistakes === 0 ? Math.min(combo, 3) * 20 : 0);
            const nextScore = score + earned;
            setScore(nextScore);
            setCombo(roundMistakes === 0 ? combo + 1 : 0);
            if (student && nextScore > best) {
                setBest(nextScore);
                localStorage.setItem(`marketBest_${student.id}`, String(nextScore));
            }
        }
    }

    function nextOrder() {
        setRound((n) => n + 1);
        setTray([]);
        setMessage("");
        setCelebrating(false);
        setRoundMistakes(0);
        setHint(false);
    }

    if (!student) return <div className="min-h-screen bg-background" />;
    return (
        <main className="min-h-screen bg-[#f8f1df] pb-10 text-[#263b32]">
            <div className="mx-auto max-w-2xl px-4 pt-5">
                <GameTopBar onBack={() => router.push("/dashboard")}>
                    <span className="rounded-full bg-white px-4 py-2 font-display font-bold shadow-sm">⭐ {score} <span className="ml-2 text-sm text-[#6a756a]">Best {best}</span></span>
                </GameTopBar>
                <div className="relative mb-5 h-40 overflow-hidden rounded-[2rem] bg-[#28775b] shadow-lg sm:h-48" style={{ backgroundImage: "linear-gradient(90deg,rgba(19,60,43,.82),rgba(19,60,43,.05)),url('/market-day-bg.webp')", backgroundPosition: "center", backgroundSize: "cover" }}>
                    <div className="absolute bottom-4 left-5 z-10 text-white"><p className="text-sm font-bold uppercase tracking-widest">MathChampions Ghana</p><h1 className="font-display text-4xl font-bold drop-shadow-md">Market Day</h1></div>
                    <Image src="/market/shopkeeper.webp" alt="" width={320} height={480} unoptimized className="absolute -bottom-12 right-0 h-56 w-auto drop-shadow-xl sm:right-8 sm:h-64" />
                </div>
                {!started ? (
                    <div className="rounded-[2rem] bg-white p-6 text-center shadow-lg">
                        <h2 className="font-display text-3xl font-bold">Your stall is open!</h2>
                        <p className="mx-auto my-4 max-w-sm text-lg">Serve customers by giving the right change. Every good sale fills your market bar.</p>
                        <Button variant="success" onClick={restart} fullWidth>Serve the first customer</Button>
                    </div>
                ) : round >= orders.length ? (
                    <GameDone title="Market star! 🌟" subtitle={`You served ${orders.length} customers and scored ${score} points. Best: ${best}.`} onPlayAgain={restart} onExit={() => router.push("/dashboard")} />
                ) : (
                    <div className="overflow-hidden rounded-[2rem] border-4 border-[#573c28] bg-[#fff9eb] shadow-[0_10px_0_#b69268]">
                        <div className="relative overflow-hidden bg-[#28775b] text-white">
                            <div className="flex h-12" aria-hidden>{Array.from({length: 8}, (_, i) => <span key={i} className={`flex-1 rounded-b-3xl ${i % 2 ? "bg-[#fff4dc]" : "bg-[#d65b45]"}`} />)}</div>
                            <div className="px-5 pb-4 pt-2">
                                <div className="flex items-center justify-between"><span className="font-display text-xl font-bold">🛍️ {student.name}&apos;s stall</span><span className="font-bold">{round + 1} / {orders.length}</span></div>
                                <div className="mt-3 flex gap-2" aria-label={`${round} customers served`}>{orders.map((_, i) => <span key={i} className={`h-3 flex-1 rounded-full ${i < round ? "bg-[#ffcf5b]" : i === round ? "bg-white" : "bg-white/25"}`} />)}</div>
                            </div>
                        </div>
                        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr]">
                            <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl bg-[#ffe7b4] p-4 text-center">
                                <div className="flex items-end gap-2"><Image src={`/market/customer-${round + 1}.webp`} alt="Customer" width={240} height={240} unoptimized className="h-24 w-24 object-contain" /><Image src={`/market/${order.item}.webp`} alt={order.item} width={240} height={240} unoptimized className="h-28 w-28 object-contain" /></div>
                                <p className="mt-2 font-display text-2xl font-bold capitalize">{order.item}</p>
                                <p className="mt-2 rounded-full bg-white px-5 py-2 text-xl font-bold">Price: ₵{order.price}</p>
                            </div>
                            <div className="flex flex-col justify-center rounded-3xl bg-[#e6f3e8] p-5 text-center">
                                <p className="text-lg font-semibold">Customer pays</p>
                                <p className="font-display text-5xl font-bold text-[#126443]">₵{order.paid}</p>
                                <p className="mt-4 text-lg font-semibold">Give back</p>
                                <p className="font-display text-4xl font-bold">₵{change}</p>
                            </div>
                        </div>
                        <div className="px-5 pb-6">
                            {combo > 1 && !celebrating && <p className="mb-2 rounded-xl bg-[#fff0c7] px-3 py-2 text-center font-display font-bold">🔥 {combo} perfect customers in a row!</p>}
                            <p className="mb-2 font-display text-xl font-bold">Change tray <span className="float-right">₵{total} / ₵{change}</span></p>
                            <div className="flex min-h-20 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-[#ae9670] bg-[#f0e2c8] p-3" aria-live="polite">
                                {tray.length ? tray.map((money, i) => <span key={i} className={`flex h-12 items-center justify-center border-4 font-display text-lg font-bold shadow-sm ${money <= 2 ? "w-12 rounded-full border-[#bc8333] bg-[#fbd174]" : "w-20 rounded-lg border-[#789a74] bg-[#c5dfbd]"}`}>₵{money}</span>) : <span className="text-[#6d6859]">Tap money below to fill the tray</span>}
                            </div>
                            <div className="mt-4 grid grid-cols-4 gap-2">
                                {COINS.filter((money) => money <= (student.gradeLevel === "KG1" || student.gradeLevel === "KG2" || student.gradeLevel === "P1" ? 5 : 10)).map((money) => <button key={money} type="button" disabled={celebrating} onClick={() => addCoin(money)} aria-label={`Add ${money} cedis`} className={`min-h-16 border-b-4 font-display text-xl font-bold active:translate-y-1 active:border-b-0 disabled:opacity-50 ${money <= 2 ? "rounded-full border-[#b47a27] bg-[#ffcd62]" : "rounded-xl border-[#5b8563] bg-[#b5d5aa]"}`}>₵{money}</button>)}
                            </div>
                            <div className="mt-4 min-h-12 text-center font-display text-lg font-bold" aria-live="polite">{message || (hint ? `Count on from ${order.price} to ${order.paid}. How much did you add?` : "")}</div>
                            <div className="flex gap-3">
                                {!celebrating && <><Button variant="neutral" onClick={() => { setTray((coins) => coins.slice(0, -1)); setMessage(""); }} disabled={!tray.length} className="flex-1">Undo coin</Button><Button variant="neutral" onClick={() => setHint(true)} className="flex-1">Hint</Button></>}
                                {celebrating && <Button variant="success" onClick={nextOrder} className="flex-1">{round === orders.length - 1 ? "See results" : "Next customer →"}</Button>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
