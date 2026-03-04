"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";

interface JwtPayload {
    id: string;
}

export default function Deposit() {
    const router = useRouter();
    const [amount, setAmount] = useState<string>("0");
    const [userId, setUserId] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            setUserId(decoded.id);
        } catch {
            router.push("/login");
        }
    }, [router]);

    const handleKeyPress = (val: string) => {
        if (val === "backspace") {
            setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
            return;
        }
        if (amount === "0") {
            setAmount(val);
        } else if (amount.length < 6) {
            setAmount(amount + val);
        }
    };

    const handleDeposit = async () => {
        if (Number(amount) <= 0 || !userId) return;
        try {
            setLoading(true);
            await api.wallet.deposit(userId, Number(amount));
            setSuccess(true);
        } catch (err) {
            console.error(err);
            alert("Deposit failed");
            setLoading(false);
        }
    };

    const padButtons = [
        "1", "2", "3",
        "4", "5", "6",
        "7", "8", "9",
        ".", "0", "backspace"
    ];

    if (success) {
        return (
            <div className="flex flex-col h-full bg-[var(--color-background)] text-[var(--color-foreground)]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-6"
                >
                    <div className="w-24 h-24 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mb-8 relative">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-16 h-16 rounded-full bg-[var(--color-success)] flex items-center justify-center text-white shadow-lg shadow-emerald-500/30"
                        >
                            <Check size={32} strokeWidth={3} />
                        </motion.div>
                        <div className="absolute inset-0 rounded-full border-2 border-[var(--color-success)]/50 border-r-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
                    </div>

                    <h2 className="text-3xl font-bold mb-2 text-center">Deposit Successful!</h2>
                    <p className="text-zinc-400 text-center mb-8">
                        Your deposit of <span className="text-white font-medium">${amount}</span> has been added to your balance.
                    </p>

                    <Link href="/" className="w-full">
                        <button className="w-full py-4 rounded-2xl bg-[var(--color-surface)] border border-white/10 hover:bg-[var(--color-surface-hover)] transition-all font-semibold">
                            Back to Dashboard
                        </button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] text-[var(--color-foreground)]">
            <header className="px-6 pt-12 pb-6 flex items-center gap-4">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-semibold">Deposit Funds</h1>
            </header>

            <div className="flex-1 flex flex-col px-6">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-zinc-400 mb-2 font-medium">Enter Amount to Deposit</p>
                    <div className="text-5xl font-bold tracking-tight text-[var(--color-primary)]">
                        ${amount}
                    </div>
                </div>

                <div className="pb-8">
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        {padButtons.map((btn, i) => (
                            <button
                                key={i}
                                onClick={() => handleKeyPress(btn)}
                                className="h-16 rounded-2xl bg-[var(--color-surface)] hover:bg-white/10 flex items-center justify-center text-xl font-medium transition-colors"
                                disabled={loading}
                            >
                                {btn === "backspace" ? <ArrowLeft size={24} /> : btn}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleDeposit}
                        disabled={amount === "0" || loading}
                        className="w-full flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading ? "Processing..." : "Confirm Deposit"}
                    </button>
                </div>
            </div>
        </div>
    );
}
