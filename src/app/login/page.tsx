"use client";

import { useState } from "react";
import { ArrowRight, Lock, Mail, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.auth.login({ email, password });
            if (response && response.access_token) {
                localStorage.setItem("token", response.access_token);
                // Save user email to show on dashboard for now
                localStorage.setItem("userEmail", email);
                router.push("/");
            } else {
                setError("Invalid response from server");
            }
        } catch (err: any) {
            // User likely not found, prompt for auto-registration demonstration
            setShowRegisterModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterConfirm = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Some backends return the user object without a token on register.
            // Let's call register, then immediately call login to get the token.
            await api.auth.register({ email, password });

            // If we are here, registration succeeded (or returned 201). Now login to get token:
            const loginRes = await api.auth.login({ email, password });
            if (loginRes && loginRes.access_token) {
                localStorage.setItem("token", loginRes.access_token);
                localStorage.setItem("userEmail", email);
                router.push("/");
                return;
            } else {
                setError("Registration succeeded, but auto-login failed.");
                setShowRegisterModal(false);
            }
        } catch (regErr: any) {
            const errorMsg = regErr.message || "Failed to register";

            // If the error is "User already exists" or similar, maybe they DO exist 
            // but the first login attempt failed due to wrong password.
            if (errorMsg.toLowerCase().includes("exist")) {
                setError("User already exists. Please check your credentials.");
            } else {
                setError(errorMsg);
            }
            setShowRegisterModal(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] text-[var(--color-foreground)] relative overflow-hidden">

            {/* Background glow effects */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--color-primary)] opacity-20 blur-[100px] rounded-full"></div>
            <div className="absolute top-1/2 -right-32 w-80 h-80 bg-[var(--color-secondary)] opacity-10 blur-[100px] rounded-full"></div>

            <div className="flex-1 flex flex-col justify-center px-8 z-10 w-full mb-20">

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-lg shadow-violet-500/30 mb-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                        <Smartphone size={32} className="text-white relative z-10" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back.</h1>
                    <p className="text-zinc-400 text-lg mb-6">Sign in or create an account.</p>

                    <div className="p-4 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-2xl flex gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                            <Smartphone size={16} className="text-[var(--color-primary)]" />
                        </div>
                        <div>
                            <p className="text-white font-medium mb-0.5">Auto-Registration Active</p>
                            <p className="text-zinc-400">If the email doesn't exist, we'll automatically create an account and sign you in to explore the demo.</p>
                        </div>
                    </div>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    onSubmit={handleLogin}
                    className="space-y-5"
                >
                    {error && (
                        <div className="p-4 bg-[var(--color-danger)]/20 border border-[var(--color-danger)]/50 rounded-2xl text-[var(--color-danger)] text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="text-zinc-500" size={20} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-[var(--color-surface)]/50 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] transition-all text-white placeholder-zinc-500"
                                placeholder="Email address"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="text-zinc-500" size={20} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-[var(--color-surface)]/50 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] transition-all text-white placeholder-zinc-500"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link href="#" className="text-sm font-medium text-[var(--color-primary)] hover:text-white transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="w-full py-4 rounded-2xl bg-[var(--color-primary)] text-white font-semibold text-lg hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg justify-center shadow-violet-500/25 flex items-center gap-2 mt-4 relative overflow-hidden group"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Continue
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </motion.form>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-10 text-center"
                >
                    <p className="text-zinc-400">
                        For testing, if account doesn't exist, it will instantly register and sign you in.
                    </p>
                </motion.div>
            </div>

            {/* Auto-Register Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[var(--color-surface)] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"></div>
                        <h3 className="text-xl font-bold text-white mb-2">User Not Found</h3>
                        <p className="text-zinc-400 mb-6 text-sm">
                            The user does not exist. For demonstration purposes, a new user will be created with the entered data.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowRegisterModal(false)}
                                disabled={isLoading}
                                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRegisterConfirm}
                                disabled={isLoading}
                                className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium transition-colors flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-[var(--color-primary)]/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Continue"
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
}
