"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { jwtDecode } from "jwt-decode";
import clsx from "clsx";

interface JwtPayload {
    id: string;
    email: string;
}

export default function TransactionsPage() {
    const router = useRouter();
    const [filter, setFilter] = useState<"All" | "Income" | "Expenses">("All");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            fetchHistory(decoded.id);
        } catch {
            router.push("/login");
        }
    }, [router]);

    const fetchHistory = async (userId: string) => {
        try {
            setLoading(true);
            const res = await api.ledger.getHistory(userId);
            setTransactions(res || []);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Simplified filtering based on credit direction
    const filteredTransactions = transactions.filter((tx) => {
        const isReceive = tx.direction === "credit";
        const matchesSearch = tx.type.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === "Income") return isReceive;
        if (filter === "Expenses") return !isReceive;
        return true;
    });

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">

            {/* Header (Sticky) */}
            <header className="px-6 pt-12 pb-4 border-b border-white/5 bg-[var(--color-background)]/80 backdrop-blur-xl z-20 sticky top-0">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/">
                        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    </Link>
                    <h1 className="font-semibold text-lg">Transactions</h1>
                    <div className="w-10"></div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-white/5 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-[var(--color-primary)] transition-colors text-white text-sm"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                </div>
            </header>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-20">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <p className="text-zinc-500 text-center py-10">Loading...</p>
                    ) : filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx, i) => {
                            const isReceive = tx.direction === 'credit';
                            return (
                                <motion.div
                                    key={tx._id || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center justify-between p-4 mb-3 rounded-2xl bg-[var(--color-surface)] border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-12 h-12 rounded-full flex items-center justify-center shadow-inner",
                                            isReceive
                                                ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                                                : "bg-white/5 text-zinc-300"
                                        )}>
                                            {isReceive ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[1rem] capitalize">{tx.type.toLowerCase()}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{formatDate(tx.updatedAt)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={clsx("font-bold", isReceive ? "text-[var(--color-success)]" : "text-white")}>
                                            {isReceive ? "+" : "-"}{formatMoney(tx.amount)}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold text-zinc-600 mt-1 tracking-wider">
                                            {tx.status || "COMPLETED"}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <Search size={24} className="text-zinc-500" />
                            </div>
                            <p className="text-zinc-400">No transactions found.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
}
