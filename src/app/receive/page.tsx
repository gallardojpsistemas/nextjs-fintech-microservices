"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
    id: string;
    email: string;
}

export default function Receive() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const decoded = jwtDecode<JwtPayload>(token);
            setUserId(decoded.id);
            setUserEmail(decoded.email);
        } catch (err) {
            router.push("/login");
        }
    }, [router]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] text-[var(--color-foreground)] overflow-y-auto">
            <header className="px-6 pt-12 pb-6 flex items-center gap-4 relative z-10">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-semibold">Receive Money</h1>
            </header>

            <div className="flex-1 px-6 flex flex-col items-center pt-8 pb-12">
                <div className="w-full bg-[var(--color-surface)] border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-6 shadow-xl">
                    <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center p-2 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                        <div className="w-full h-full border-4 border-black rounded-xl flex items-center justify-center bg-zinc-100 relative overflow-hidden">
                            {/* Simulated QR code pattern */}
                            <div className="absolute inset-2 grid grid-cols-4 grid-rows-4 gap-1 opacity-80">
                                {[...Array(16)].map((_, i) => (
                                    <div key={i} className={`bg-black ${i % 3 === 0 ? 'rounded-tl-lg' : ''} ${i % 5 === 0 ? 'opacity-0' : ''}`}></div>
                                ))}
                            </div>
                            <div className="absolute w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-md">
                                <div className="text-[var(--color-primary)] font-bold text-[10px]">PIX</div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-zinc-400 text-sm mb-1">Account Name</p>
                        <p className="text-xl font-medium capitalize">{userEmail ? userEmail.split('@')[0] : 'Loading...'}</p>
                    </div>

                    <div className="w-full h-px bg-white/5"></div>

                    <div className="w-full">
                        <p className="text-zinc-400 text-sm mb-2">Account ID / Pix Key (Coming soon)</p>
                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="flex-1 text-sm font-mono truncate text-zinc-300">{userId || '...'}</p>
                            <button
                                onClick={() => handleCopy(userId)}
                                className="text-[var(--color-primary)] hover:text-white transition-colors p-2 bg-white/5 rounded-lg shrink-0"
                                title="Copy ID"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="w-full">
                        <p className="text-zinc-400 text-sm mb-2">Email Address</p>
                        <div className="flex items-center gap-2 bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="flex-1 text-sm text-zinc-300">{userEmail || '...'}</p>
                        </div>
                    </div>

                    <button
                        className="w-full mt-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-violet-500/25"
                        onClick={() => handleCopy(userId)}
                    >
                        {copied ? "Copied ID!" : "Copy Receive Key"}
                    </button>
                </div>
            </div>
        </div>
    );
}
