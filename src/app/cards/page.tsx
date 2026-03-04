"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, CopyX, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface JwtPayload {
    id: string;
}

export default function CardsPage() {
    const router = useRouter();
    const [userId, setUserId] = useState("");
    const [amount, setAmount] = useState<string>("0");
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

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

    const handleAuthorize = async () => {
        if (Number(amount) <= 0 || !userId) return;
        try {
            setLoading(true);
            const res = await api.payment.create({
                type: "credit_card",
                userId,
                amount: Number(amount)
            });

            setPayments(prev => [{
                txId: res.txId,
                amount: Number(amount),
                status: "authorized" // Real backend might not return "authorized" natively in demo, assuming standard flow
            }, ...prev]);

            setAmount("0");
        } catch (err) {
            console.error(err);
            alert("Failed to authorize payment");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (txId: string, action: 'capture' | 'refund' | 'chargeback') => {
        try {
            setActionLoading(`${txId}_${action}`);
            await api.payment[action](txId);

            const newStatus = action === 'capture' ? 'paid' : action === 'refund' ? 'refunded' : 'chargeback';

            setPayments(prev => prev.map(p => p.txId === txId ? { ...p, status: newStatus } : p));
        } catch (err: any) {
            console.error(err);
            alert(err.message || `Failed to process ${action}`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] text-[var(--color-foreground)] overflow-y-auto pb-20">
            <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[var(--color-background)]/90 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-semibold">Credit Cards & Refunds</h1>
                </div>
            </header>

            <div className="px-6 mt-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[var(--color-secondary)]/20 to-transparent border border-[var(--color-secondary)]/30 rounded-3xl p-6 mb-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-secondary)] opacity-10 blur-[50px] rounded-full"></div>

                    <h2 className="text-lg font-semibold mb-4">Authorize Payment</h2>
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-3xl font-bold text-[var(--color-secondary)]">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-transparent text-5xl font-bold tracking-tight text-white w-full focus:outline-none"
                            placeholder="0"
                        />
                    </div>

                    <button
                        onClick={handleAuthorize}
                        disabled={Number(amount) <= 0 || loading}
                        className="w-full flex items-center justify-center bg-[var(--color-secondary)] hover:bg-[#8352ff] text-white py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading ? "Processing..." : "Authorize Card"}
                    </button>
                </motion.div>

                <h2 className="text-lg font-semibold mb-4">Payment Actions test</h2>

                <div className="space-y-4">
                    <AnimatePresence>
                        {payments.map((payment) => (
                            <motion.div
                                key={payment.txId}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[var(--color-surface)] border border-white/5 rounded-2xl p-4 flex flex-col gap-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-zinc-400 font-mono mb-1">{payment.txId}</p>
                                        <p className="text-xl font-bold">${payment.amount}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded-md ${payment.status === 'paid' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' :
                                            payment.status === 'refunded' ? 'bg-zinc-500/20 text-zinc-300' :
                                                payment.status === 'chargeback' ? 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]' :
                                                    'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                                        }`}>
                                        {payment.status}
                                    </span>
                                </div>

                                {payment.status === 'authorized' && (
                                    <button
                                        onClick={() => handleAction(payment.txId, 'capture')}
                                        disabled={actionLoading === `${payment.txId}_capture`}
                                        className="w-full flex items-center justify-center gap-2 bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                    >
                                        <Check size={16} /> Capture Payment
                                    </button>
                                )}

                                {payment.status === 'paid' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(payment.txId, 'refund')}
                                            disabled={actionLoading === `${payment.txId}_refund`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-zinc-300 hover:bg-white/10 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            <RotateCcw size={16} /> Refund
                                        </button>
                                        <button
                                            onClick={() => handleAction(payment.txId, 'chargeback')}
                                            disabled={actionLoading === `${payment.txId}_chargeback`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            <CopyX size={16} /> Chargeback
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {payments.length === 0 && (
                            <p className="text-zinc-500 text-center py-8">Authorize a test card payment to try capture, refund, or chargeback endpoints.</p>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
