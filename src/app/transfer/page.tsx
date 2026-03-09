"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, ChevronRight, Search, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
    id: string;
    email: string;
}

export default function TransferPage() {
    const router = useRouter();
    const [step, setStep] = useState<"amount" | "recipient" | "confirm" | "success">("amount");
    const [amount, setAmount] = useState("0");
    const [recipient, setRecipient] = useState<any>(null);
    const [isSending, setIsSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            setCurrentUserId(decoded.id);
        } catch {
            router.push("/login");
        }
    }, [router]);

    const [contacts, setContacts] = useState<any[]>([]);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const users = await api.auth.getUsers();
                // Filter out current user from contacts and format them
                const formatted = users
                    .filter((u: any) => u.id !== currentUserId)
                    .map((u: any) => ({
                        id: u.id,
                        name: u.email.split('@')[0],
                        initial: u.email.charAt(0).toUpperCase(),
                        email: u.email
                    }));
                setContacts(formatted);
            } catch (err) {
                console.error("Failed to load contacts", err);
            }
        };

        if (currentUserId) {
            fetchContacts();
        }
    }, [currentUserId]);

    const handleKeyPress = (key: string) => {
        if (key === "backspace") {
            setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
            return;
        }

        if (amount === "0") {
            setAmount(key === "." ? "0." : key);
        } else if (amount.includes(".") && key === ".") {
            return;
        } else if (amount.includes(".") && amount.split(".")[1].length >= 2) {
            return;
        } else {
            setAmount((prev) => prev + key);
        }
    };

    const handleSend = async () => {
        setIsSending(true);
        setErrorMsg(null);
        try {
            await api.payment.create({
                type: 'pix',
                payerId: currentUserId,
                issuerId: recipient.id,
                amount: parseFloat(amount)
            });
            setStep("success");
        } catch (err: any) {
            setErrorMsg(err.message || "Transfer failed");
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const formatAmountNum = parseFloat(amount || "0");
    const isValidAmount = formatAmountNum > 0;

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">

            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex items-center justify-between border-b border-white/5 relative z-10">
                <button
                    onClick={() => {
                        if (step === "amount") router.back();
                        else if (step === "recipient") setStep("amount");
                        else if (step === "confirm") setStep("recipient");
                        else router.push("/");
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                    {step === "success" ? <X size={20} /> : <ArrowLeft size={20} />}
                </button>
                <h1 className="font-semibold text-lg">
                    {step === "amount" && "Enter Amount"}
                    {step === "recipient" && "Select Recipient"}
                    {step === "confirm" && "Review Transfer"}
                    {step === "success" && "Transfer Sent"}
                </h1>
                <div className="w-10"></div> {/* Spacer for centering */}
            </header>

            <div className="flex-1 relative">
                <AnimatePresence mode="wait">

                    {/* STEP 1: AMOUNT INPUT */}
                    {step === "amount" && (
                        <motion.div
                            key="amount"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute inset-0 flex flex-col pt-10"
                        >
                            <div className="flex-1 flex flex-col items-center justify-center -mt-20">
                                <span className="text-zinc-500 font-medium mb-2">How much?</span>
                                <div className="flex items-center justify-center">
                                    <span className="text-4xl text-zinc-500 mr-1">$</span>
                                    <span className={`text-6xl font-bold tracking-tight ${amount === "0" ? "text-zinc-500" : "text-white"}`}>
                                        {amount}
                                    </span>
                                </div>
                            </div>

                            {/* Custom Keypad */}
                            <div className="bg-[var(--color-surface)]/50 rounded-t-[3rem] p-6 pb-10 border-t border-white/5 backdrop-blur-xl">
                                <div className="grid grid-cols-3 gap-2 mb-6">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "backspace"].map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => handleKeyPress(key.toString())}
                                            className="h-16 rounded-2xl flex items-center justify-center text-2xl font-medium hover:bg-white/5 active:bg-white/10 transition-colors"
                                        >
                                            {key === "backspace" ? <ArrowLeft size={24} className="text-zinc-400" /> : key}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setStep("recipient")}
                                    disabled={!isValidAmount}
                                    className="w-full py-4 rounded-2xl bg-[var(--color-primary)] text-white font-semibold text-lg hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Continue <ChevronRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: RECIPIENT */}
                    {step === "recipient" && (
                        <motion.div
                            key="recipient"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute inset-0 flex flex-col p-6"
                        >
                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="text-zinc-500" size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Name, email, or phone (Mock UI)"
                                    disabled
                                    className="w-full bg-[var(--color-surface)] border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[var(--color-primary)] transition-colors text-white"
                                />
                            </div>

                            <h3 className="text-sm font-medium text-zinc-500 mb-4 px-2">Recent & Suggested</h3>
                            <div className="flex flex-col gap-2">
                                {contacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        onClick={() => {
                                            setRecipient(contact);
                                            setStep("confirm");
                                        }}
                                        className="flex items-center p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center mr-4 text-[var(--color-primary)] font-semibold text-lg">
                                            {contact.initial}
                                        </div>
                                        <div>
                                            <p className="font-medium text-[0.95rem]">{contact.name}</p>
                                            <p className="text-sm text-zinc-500">{contact.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: CONFIRM */}
                    {step === "confirm" && recipient && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 flex flex-col p-6 pt-10"
                        >
                            <div className="flex-1 flex flex-col items-center">

                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-violet-500/20">
                                    {recipient.initial}
                                </div>

                                <h2 className="text-2xl font-bold mb-1">{recipient.name}</h2>
                                <p className="text-zinc-400 mb-10">{recipient.email}</p>

                                <div className="text-5xl font-bold mb-12">
                                    ${amount}
                                </div>

                                <div className="w-full bg-[var(--color-surface)] border border-white/5 rounded-2xl p-4 space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Total</span>
                                        <span className="font-bold">${amount}</span>
                                    </div>
                                </div>

                                {errorMsg && (
                                    <div className="w-full mt-4 p-4 bg-[var(--color-danger)]/20 border border-[var(--color-danger)]/50 rounded-2xl text-[var(--color-danger)] text-sm text-center">
                                        {errorMsg}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={isSending}
                                className="w-full py-4 rounded-2xl bg-[var(--color-primary)] text-white font-semibold text-lg hover:bg-[var(--color-primary-hover)] transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center"
                            >
                                {isSending ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Send Money Now"
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6"
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

                            <h2 className="text-3xl font-bold mb-2 text-center">Transfer Sent!</h2>
                            <p className="text-zinc-400 text-center mb-8">
                                Your transfer of <span className="text-white font-medium">${amount}</span> to {recipient?.name} was successful.
                            </p>

                            <Link href="/" className="w-full">
                                <button className="w-full py-4 rounded-2xl bg-[var(--color-surface)] border border-white/10 hover:bg-[var(--color-surface-hover)] transition-all font-semibold">
                                    Back to Dashboard
                                </button>
                            </Link>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
