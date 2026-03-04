"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

export default function WebhookPage() {
    const router = useRouter();
    const [txId, setTxId] = useState("");
    const [pendingTxs, setPendingTxs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await api.payment.getPending();
                setPendingTxs(res || []);
            } catch (err) {
                console.error("Failed to fetch pending transactions", err);
            }
        };
        fetchPending();
    }, []);

    const handleSimulateWebhook = async () => {
        if (!txId.trim()) return;
        try {
            setLoading(true);
            setSuccess(false);

            // confirmPix is actually confirmPayment in backend, handles both Pix and Boleto
            await api.payment.confirmPix(txId.trim());
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                setTxId("");
                // Refresh pending list
                api.payment.getPending().then(res => setPendingTxs(res || [])).catch(console.error);
            }, 3000);

        } catch (err: any) {
            console.error(err);
            alert(err.message || "Webhook simulation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] text-[var(--color-foreground)] overflow-y-auto pb-20">
            <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[var(--color-background)]/90 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-semibold">Webhook Simulator</h1>
                </div>
            </header>

            <div className="px-6 mt-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent border border-[var(--color-primary)]/30 rounded-3xl p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)] opacity-10 blur-[50px] rounded-full"></div>

                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Zap size={20} className="text-[var(--color-primary)]" />
                        Simulate Payment Webhook
                    </h2>
                    <p className="text-sm text-zinc-400 mb-6">
                        Test the asynchronous payment confirmation (`POST /payment/webhook`). This simulates a third-party gateway (Pix or Boleto) notifying our system that an external payment was completed to fund the wallet.
                    </p>

                    <div className="space-y-4 mb-6 relative z-10">
                        {pendingTxs.length > 0 ? (
                            <div>
                                <label className="text-xs text-zinc-400 font-medium mb-2 block">Select Pending Transaction (txId)</label>
                                <div className="relative">
                                    <select
                                        value={txId}
                                        onChange={(e) => setTxId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors font-mono appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled className="bg-[var(--color-surface)] text-zinc-500">Pick a pending transaction...</option>
                                        {pendingTxs.map(tx => (
                                            <option key={tx.txId} value={tx.txId} className="bg-[var(--color-surface)] text-white">
                                                {tx.txId} - ${tx.amount} ({new Date(tx.createdAt || Date.now()).toLocaleDateString()})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs text-zinc-400 font-medium mb-2 block">Transaction ID (txId)</label>
                                <input
                                    type="text"
                                    value={txId}
                                    onChange={(e) => setTxId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors font-mono"
                                    placeholder="e.g. BOLETO-1772590035726"
                                />
                                <p className="text-[11px] text-zinc-500 mt-2">No pending transactions found automatically. You can paste an ID manually.</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSimulateWebhook}
                        disabled={!txId.trim() || loading}
                        className="relative z-10 w-full flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading ? "Simulating..." : "Send Webhook Event"}
                    </button>

                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 p-4 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-xl flex items-center gap-3 text-[var(--color-success)] text-sm font-medium relative z-10"
                            >
                                <CheckCircle size={18} />
                                Webhook processed successfully! The wallet has been credited.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
