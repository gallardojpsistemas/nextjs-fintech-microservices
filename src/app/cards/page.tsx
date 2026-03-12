"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowLeft, Check, CopyX, RotateCcw, Plus, CreditCard, Search } from "lucide-react";
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
    const [amount, setAmount] = useState<string>("");
    const [payments, setPayments] = useState<any[]>([]);
    const [cards, setCards] = useState<any[]>([]);
    const [selectedCard, setSelectedCard] = useState<string>("");
    const [cvv, setCvv] = useState<string>("");

    const [contacts, setContacts] = useState<any[]>([]);
    const [recipient, setRecipient] = useState<any>(null);

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isAddingCard, setIsAddingCard] = useState(false);
    
    // Changing ref to target the top of the payment list
    const topPaymentRef = useRef<HTMLDivElement>(null);

    const [cardForm, setCardForm] = useState({
        cardNumber: "",
        cardHolder: "",
        expiryMonth: "",
        expiryYear: ""
    });

    const fetchCards = useCallback(async (id: string) => {
        try {
            const data = await api.payment.getUserCards(id);
            setCards(data);
            if (data.length > 0) {
                setSelectedCard(data[0].token);
            }
        } catch (err) {
            console.error("Failed to fetch cards", err);
        }
    }, []);

    const fetchHistory = useCallback(async (id: string) => {
        try {
            const data = await api.payment.getUserCardPayments(id);
            setPayments(data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    }, []);

    const fetchContacts = useCallback(async (id: string) => {
        try {
            const users = await api.auth.getUsers();
            const formatted = users
                .filter((u: any) => u.id !== id)
                .map((u: any) => ({
                    id: u.id,
                    name: u.email.split('@')[0],
                    initial: u.email.charAt(0).toUpperCase(),
                    email: u.email
                }));
            setContacts(formatted);
        } catch (err) {
            console.error("Failed to fetch contacts", err);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            setUserId(decoded.id);
            fetchCards(decoded.id);
            fetchHistory(decoded.id);
            fetchContacts(decoded.id);
        } catch {
            router.push("/login");
        }
    }, [router, fetchCards, fetchHistory, fetchContacts]);

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        try {
            setLoading(true);
            await api.payment.tokenizeCard({
                userId,
                ...cardForm
            });
            setIsAddingCard(false);
            setCardForm({ cardNumber: "", cardHolder: "", expiryMonth: "", expiryYear: "" });
            await fetchCards(userId);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to add card");
        } finally {
            setLoading(false);
        }
    };

    const handleAuthorize = async () => {
        if (Number(amount) <= 0 || !userId || !selectedCard || !cvv || !recipient) return;
        try {
            setLoading(true);
            await api.payment.create({
                type: "credit_card",
                issuerId: recipient.id,
                payerId: userId,
                amount: Number(amount),
                cardToken: selectedCard,
                cvv
            });

            await fetchHistory(userId);

            setAmount("");
            setCvv("");
            setRecipient(null);

            setTimeout(() => {
                topPaymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to authorize payment");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (txId: string, action: 'capture' | 'refund' | 'chargeback') => {
        try {
            setActionLoading(`${txId}_${action}`);
            await api.payment[action](txId);
            await fetchHistory(userId);
        } catch (err: any) {
            console.error(err);
            alert(err.message || `Failed to process ${action}`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] text-[var(--color-foreground)] overflow-y-auto pb-20 scroll-smooth">
            <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[var(--color-background)]/90 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-semibold">Credit Cards & Refunds</h1>
                </div>
            </header>

            <div className="px-6 mt-4 flex flex-col gap-8">
                {/* My Cards Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">My Cards</h2>
                        <button
                            onClick={() => setIsAddingCard(!isAddingCard)}
                            className="flex items-center gap-2 text-sm text-[var(--color-secondary)] hover:text-[#8352ff] font-semibold transition-colors"
                        >
                            <Plus size={16} /> Add Card
                        </button>
                    </div>

                    <AnimatePresence>
                        {isAddingCard && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[var(--color-surface)] border border-white/5 rounded-2xl p-4 mb-4 flex flex-col gap-4 overflow-hidden"
                                onSubmit={handleAddCard}
                            >
                                <div>
                                    <label className="text-sm text-zinc-400 mb-1 block">Card Number</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={19}
                                        value={cardForm.cardNumber}
                                        onChange={(e) => {
                                            // Format with hyphen every 4 characters
                                            const val = e.target.value.replace(/\D/g, '');
                                            let formattedVal = '';
                                            for (let i = 0; i < val.length; i++) {
                                                if (i > 0 && i % 4 === 0) formattedVal += '-';
                                                formattedVal += val[i];
                                            }
                                            setCardForm({ ...cardForm, cardNumber: formattedVal });
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[var(--color-secondary)] transition-colors"
                                        placeholder="4242-4242-4242-4242"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-400 mb-1 block">Card Holder Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={cardForm.cardHolder}
                                        onChange={e => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[var(--color-secondary)] transition-colors"
                                        placeholder="JUAN GALLARDO"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-sm text-zinc-400 mb-1 block">Expiry Month</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={2}
                                            value={cardForm.expiryMonth}
                                            onChange={e => setCardForm({ ...cardForm, expiryMonth: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[var(--color-secondary)] transition-colors"
                                            placeholder="MM"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-sm text-zinc-400 mb-1 block">Expiry Year</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={4}
                                            value={cardForm.expiryYear}
                                            onChange={e => setCardForm({ ...cardForm, expiryYear: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[var(--color-secondary)] transition-colors"
                                            placeholder="YYYY"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[var(--color-secondary)] hover:bg-[#8352ff] text-white py-3 rounded-xl font-semibold transition-all mt-2 disabled:opacity-50"
                                >
                                    {loading ? "Adding..." : "Save Card"}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {cards.length === 0 && !loading && !isAddingCard && (
                        <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                            <CreditCard className="mx-auto text-zinc-500 mb-2" size={32} />
                            <p className="text-zinc-400 text-sm">No cards saved yet.</p>
                        </div>
                    )}

                    <div className="grid gap-3">
                        {cards.map(card => (
                            <div
                                key={card.token}
                                onClick={() => setSelectedCard(card.token)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedCard === card.token
                                        ? 'bg-[var(--color-secondary)]/10 border-[var(--color-secondary)]/50'
                                        : 'bg-white/5 border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-8 bg-black/20 rounded flex items-center justify-center uppercase text-xs font-bold text-zinc-300">
                                        {card.brand}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{card.holder}</p>
                                        <p className="text-xs text-zinc-400">**** **** **** {card.last4} • {card.expiryMonth}/{card.expiryYear}</p>
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedCard === card.token
                                        ? 'border-[var(--color-secondary)]'
                                        : 'border-zinc-500'
                                    }`}>
                                    {selectedCard === card.token && <div className="w-2.5 h-2.5 bg-[var(--color-secondary)] rounded-full" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Authorize Payment Section */}
                <section>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-[var(--color-secondary)]/20 to-transparent border border-[var(--color-secondary)]/30 rounded-3xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-secondary)] opacity-10 blur-[50px] rounded-full"></div>

                        <h2 className="text-lg font-semibold mb-4">Authorize Payment</h2>

                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <span className="text-3xl font-bold text-[var(--color-secondary)]">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-transparent text-5xl font-bold tracking-tight text-white w-full focus:outline-none"
                                placeholder="0"
                            />
                        </div>

                        {cards.length > 0 && (
                            <div className="space-y-4 mb-6 relative z-10">
                                {/* Recipient Dropdown */}
                                <div>
                                    <label className="text-sm font-semibold mb-2 block">Recipient</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                                        <select
                                            value={recipient?.id || ""}
                                            onChange={(e) => {
                                                const c = contacts.find(c => c.id === e.target.value);
                                                setRecipient(c || null);
                                            }}
                                            className="bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[var(--color-secondary)] transition-colors w-full appearance-none"
                                        >
                                            <option value="" disabled className="bg-zinc-900 text-zinc-500">Select recipient to pay</option>
                                            {contacts.map(c => (
                                                <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                                                    {c.name} ({c.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* CVV Input */}
                                <div>
                                    <label className="text-sm font-semibold mb-2 block">Security Code (CVV)</label>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value)}
                                        placeholder="123"
                                        className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-secondary)] transition-colors w-full"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleAuthorize}
                            disabled={Number(amount) <= 0 || !selectedCard || !cvv || !recipient || loading}
                            className="w-full flex items-center justify-center bg-[var(--color-secondary)] hover:bg-[#8352ff] text-white py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:shadow-none relative z-10"
                        >
                            {loading ? "Processing..." : "Authorize Card"}
                        </button>
                    </motion.div>
                </section>

                {/* Payments History */}
                <section>
                    <h2 className="text-lg font-semibold mb-4">Payments</h2>

                    <div className="space-y-4">
                        {/* Invisible div to scroll precisely to the top of the payment list */}
                        <div ref={topPaymentRef} className="h-0" />
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
                                            <p className="text-xl font-bold">
                                                {payment.payerId === userId ? '-' : '+'}${payment.amount.toFixed(2)}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded-md ${payment.status === 'paid' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' :
                                                payment.status === 'refunded' ? 'bg-zinc-500/20 text-zinc-300' :
                                                    payment.status === 'chargeback' ? 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]' :
                                                        'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                                            }`}>
                                            {payment.status}
                                        </span>
                                    </div>

                                    {/* Action buttons (only if payer) */}
                                    {payment.payerId === userId && payment.status === 'authorized' && (
                                        <button
                                            onClick={() => handleAction(payment.txId, 'capture')}
                                            disabled={actionLoading === `${payment.txId}_capture`}
                                            className="w-full flex items-center justify-center gap-2 bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            <Check size={16} /> Capture Payment
                                        </button>
                                    )}

                                    {payment.payerId === userId && payment.status === 'paid' && (
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
                                <p className="text-zinc-500 text-center py-8">No payments made yet.</p>
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </div>
    );
}
