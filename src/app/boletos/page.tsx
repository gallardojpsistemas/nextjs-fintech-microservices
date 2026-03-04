"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Send, Check, Copy, ClipboardPaste } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface JwtPayload {
    id: string;
}

export default function BoletosPage() {
    const router = useRouter();
    const [userId, setUserId] = useState("");
    const [targetUserId, setTargetUserId] = useState("");
    const [amount, setAmount] = useState<string>("0");
    const [dueDate, setDueDate] = useState<string>("");

    // Pay feature states
    const [payAmount, setPayAmount] = useState<string>("0");
    const [barcode, setBarcode] = useState("");

    const [boletos, setBoletos] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [payLoading, setPayLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'generate' | 'pay'>('generate');

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            setUserId(decoded.id);
            setTargetUserId(decoded.id);

            // Set default due date to 7 days from now in DD/MM/YYYY
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const dd = String(nextWeek.getDate()).padStart(2, '0');
            const mm = String(nextWeek.getMonth() + 1).padStart(2, '0');
            const yyyy = nextWeek.getFullYear();
            setDueDate(`${dd}/${mm}/${yyyy}`);

            // Fetch users for the dropdown
            api.auth.getUsers().then(res => setUsers(res || [])).catch(console.error);
        } catch {
            router.push("/login");
        }
    }, [router]);

    const handleGenerateBoleto = async () => {
        if (Number(amount) <= 0 || !targetUserId || dueDate.length !== 10) return;

        // Parse DD/MM/YYYY to YYYY-MM-DD for backend
        const [day, month, year] = dueDate.split('/');
        const isoDate = `${year}-${month}-${day}T00:00:00.000Z`;

        try {
            setLoading(true);
            const res = await api.payment.create({
                type: "boleto",
                userId: targetUserId,
                amount: Number(amount),
                dueDate: isoDate,
            });

            setBoletos(prev => [{
                txId: res.txId,
                amount: Number(amount),
                status: "pending",
                dueDate: isoDate,
                barcode: res.txId
            }, ...prev]);

            setAmount("0");
        } catch (err) {
            console.error(err);
            alert("Failed to generate boleto");
        } finally {
            setLoading(false);
        }
    };

    const handlePayBoleto = async () => {
        if (Number(payAmount) <= 0 || !barcode || !userId) return;
        try {
            setPayLoading(true);
            // "Pagar un boleto" means money exits the current user's wallet.
            await api.wallet.withdraw(userId, Number(payAmount));
            alert("Boleto paid successfully! Funds withdrawn.");
            setPayAmount("0");
            setBarcode("");
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Payment failed");
        } finally {
            setPayLoading(false);
        }
    };

    const handleSimulateReissue = async (txId: string) => {
        try {
            setActionLoading(txId + "_reissue");
            alert("Note: For this to work in a real scenario, the backend requires the boleto to be expired and checked. This is just a test call.");

            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            const res = await api.payment.reissue(txId, nextMonth.toISOString());

            setBoletos(prev => [
                {
                    txId: res.newTxId,
                    amount: res.updatedAmount || 0,
                    status: "pending",
                    dueDate: nextMonth.toISOString(),
                    barcode: res.newTxId
                },
                ...prev.filter(b => b.txId !== txId)
            ]);

        } catch (err: any) {
            console.error(err);
            alert(err.message || "Reissue failed");
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
                    <h1 className="text-xl font-semibold">Boletos</h1>
                </div>
            </header>

            <div className="px-6 mt-2">
                <div className="flex bg-[var(--color-surface)] rounded-xl p-1 mb-6">
                    <button
                        onClick={() => setActiveTab('generate')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'generate' ? 'bg-[var(--color-primary)] text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Generate
                    </button>
                    <button
                        onClick={() => setActiveTab('pay')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'pay' ? 'bg-[var(--color-primary)] text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Pay Boleto
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'generate' ? (
                        <motion.div
                            key="generate"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-[var(--color-surface)] border border-white/5 rounded-3xl p-6">
                                <h2 className="text-lg font-semibold mb-6">Generate New Boleto</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                                        <span className="text-3xl font-bold text-zinc-500">$</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/^0+(?=\d)/, '');
                                                setAmount(val || '0');
                                            }}
                                            className="bg-transparent text-4xl font-bold tracking-tight text-white w-full focus:outline-none"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-zinc-400 font-medium mb-1 block">Target User</label>
                                        <div className="relative">
                                            <select
                                                value={targetUserId}
                                                onChange={(e) => setTargetUserId(e.target.value)}
                                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none text-white cursor-pointer"
                                            >
                                                {users.map(u => (
                                                    <option key={u._id} value={u._id} className="bg-[var(--color-surface)] text-white">
                                                        {u.email} {u._id === userId ? "(You)" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-zinc-400 font-medium mb-1 block">Due Date (DD/MM/YYYY)</label>
                                        <input
                                            type="text"
                                            value={dueDate}
                                            onChange={(e) => {
                                                // Allow numbers and slashes, max 10 chars
                                                let val = e.target.value.replace(/[^\d/]/g, '');

                                                // Auto-insert slashes
                                                if (val.length === 2 && !val.includes('/')) val += '/';
                                                if (val.length === 5 && (val.match(/\//g) || []).length === 1) val += '/';

                                                if (val.length <= 10) {
                                                    setDueDate(val);
                                                }
                                            }}
                                            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors text-white"
                                            placeholder="DD/MM/YYYY"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerateBoleto}
                                    disabled={Number(amount) <= 0 || loading || !targetUserId || !dueDate}
                                    className="w-full flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {loading ? "Generating..." : "Generate Boleto"}
                                </button>
                            </div>

                            <h2 className="text-lg font-semibold mt-8 mb-4">Generated Boletos</h2>
                            <div className="space-y-4">
                                {boletos.map((boleto) => (
                                    <div key={boleto.txId} className="bg-[var(--color-surface)] border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm text-zinc-400 font-mono mb-1">{boleto.txId}</p>
                                                <p className="text-xl font-bold">${boleto.amount}</p>
                                                <p className="text-xs text-zinc-500 mt-1">Due: {new Date(boleto.dueDate).toLocaleDateString('es-AR')}</p>
                                            </div>
                                            <span className="px-2 py-1 text-xs font-bold uppercase rounded-md bg-[var(--color-warning)]/20 text-[var(--color-warning)]">
                                                {boleto.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 text-xs text-zinc-500 bg-black/20 p-2 rounded-lg font-mono break-all border border-white/5">
                                                {boleto.barcode}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(boleto.barcode);
                                                    alert("Barcode copied to clipboard!");
                                                }}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 transition-colors"
                                                title="Copy Barcode"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t border-white/5">
                                            <button
                                                onClick={() => handleSimulateReissue(boleto.txId)}
                                                disabled={actionLoading === (boleto.txId + "_reissue")}
                                                className="w-full flex flex-1 items-center justify-center gap-2 bg-white/5 text-zinc-300 hover:bg-white/10 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                            >
                                                <RefreshCw size={16} /> Reissue (if expired)
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {boletos.length === 0 && (
                                    <p className="text-zinc-500 text-center py-8">Generate a boleto to test endpoints. Use Webhook Simulator to pay it externally.</p>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="pay"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-background)] border border-white/5 rounded-3xl p-6"
                        >
                            <h2 className="text-lg font-semibold mb-2">Pay a Boleto</h2>
                            <p className="text-sm text-zinc-400 mb-6">Enter the amount and barcode to pay an external boleto. Funds will be withdrawn from your wallet.</p>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                                    <span className="text-3xl font-bold text-[var(--color-success)]">$</span>
                                    <input
                                        type="number"
                                        value={payAmount}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/^0+(?=\d)/, '');
                                            setPayAmount(val || '0');
                                        }}
                                        className="bg-transparent text-4xl font-bold tracking-tight text-white w-full focus:outline-none"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-zinc-400 font-medium mb-1 block">Barcode / Code</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={barcode}
                                            onChange={(e) => setBarcode(e.target.value)}
                                            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                            placeholder="e.g. BOLETO-1772590035726..."
                                        />
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const text = await navigator.clipboard.readText();
                                                    setBarcode(text);
                                                } catch (err) {
                                                    console.error("Failed to read clipboard:", err);
                                                    alert("Could not paste from clipboard. Please paste manually.");
                                                }
                                            }}
                                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors flex items-center justify-center"
                                            title="Paste from clipboard"
                                        >
                                            <ClipboardPaste size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePayBoleto}
                                disabled={Number(payAmount) <= 0 || !barcode || payLoading}
                                className="w-full flex items-center justify-center bg-[var(--color-success)] hover:bg-[#10b981] text-white py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:shadow-none"
                            >
                                {payLoading ? "Processing..." : "Pay Boleto"}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
