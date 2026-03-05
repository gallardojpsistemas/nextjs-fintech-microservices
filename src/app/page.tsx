"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, History, LogOut, User, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export default function Home() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userInitial, setUserInitial] = useState("A");
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.email) {
        setUserInitial(decoded.email.charAt(0).toUpperCase());
        setUserName(decoded.email.split("@")[0]);
        setUserEmail(decoded.email);
      }

      fetchData(decoded.id);
    } catch (err) {
      console.error("Invalid token", err);
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router]);

  const fetchData = async (userId: string) => {
    try {
      const walletRes = await api.wallet.get(userId);
      setBalance(walletRes.balance || 0);

      const historyRes = await api.ledger.getHistory(userId);
      setTransactions(historyRes || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error("Logout error on server", err);
    } finally {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)] text-[var(--color-foreground)] overflow-y-auto pb-20">

      {/* Header Profile / Greetings */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center relative" ref={profileRef}>
        <div>
          <h1 className="text-2xl font-semibold capitalize">{userName}</h1>
        </div>

        <div className="relative">
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-lg shadow-violet-500/20 cursor-pointer border-2 border-transparent hover:border-white/20 transition-all"
          >
            <span className="font-semibold text-lg">{userInitial}</span>
          </div>

          {/* Profile Dropdown */}
          <motion.div
            initial={false}
            animate={{
              opacity: isProfileOpen ? 1 : 0,
              y: isProfileOpen ? 0 : -10,
              scale: isProfileOpen ? 1 : 0.95,
              pointerEvents: isProfileOpen ? 'auto' : 'none'
            }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-16 w-56 bg-[var(--color-surface)] border border-white/10 shadow-2xl rounded-2xl p-2 z-50 origin-top-right overflow-hidden"
          >
            <div className="px-3 py-3 border-b border-white/5 mb-1">
              <p className="text-xs text-zinc-400 mb-0.5">Signed in as</p>
              <p className="text-sm font-medium text-white truncate">{userEmail}</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-3 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-xl transition-colors text-left"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </motion.div>
        </div>
      </header>

      {/* Hero Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-6 p-6 rounded-3xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-background)] border border-white/5 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)] opacity-20 blur-[50px] rounded-full"></div>

        <p className="text-zinc-400 text-sm font-medium mb-2">Total Balance</p>
        <div className="flex items-end gap-2 mb-6">
          <h2 className="text-4xl font-bold tracking-tight">
            {balance !== null ? formatMoney(balance) : "..."}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href="/transfer" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-violet-500/25">
              <ArrowUpRight size={18} />
              <span>Send</span>
            </button>
          </Link>
          <Link href="/receive" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 bg-[var(--color-surface-hover)] hover:bg-zinc-600 text-white py-3 rounded-xl font-medium transition-all">
              <ArrowDownLeft size={18} />
              <span>Receive</span>
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Quick Actions (Grid) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="px-6 mt-8"
      >
        <div className="flex justify-between w-full pb-4 -mb-4">
          <Link href="/deposit" className="flex flex-col items-center gap-2 cursor-pointer group flex-1">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-success)] shadow-sm transition-colors border border-transparent group-hover:border-white/5 shrink-0">
              <Plus size={24} />
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">Deposit</span>
          </Link>

          <Link href="/boletos" className="flex flex-col items-center gap-2 cursor-pointer group flex-1">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-primary)] shadow-sm transition-colors border border-transparent group-hover:border-white/5 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M3 15h6" /><path d="M3 18h6" /><path d="M3 21h6" /></svg>
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">Boletos</span>
          </Link>

          <Link href="/cards" className="flex flex-col items-center gap-2 cursor-pointer group flex-1">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-secondary)] shadow-sm transition-colors border border-transparent group-hover:border-white/5 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">Cards</span>
          </Link>

          <Link href="/webhook" className="flex flex-col items-center gap-2 cursor-pointer group flex-1">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-warning)] shadow-sm transition-colors border border-transparent group-hover:border-white/5 shrink-0">
              <Zap size={24} />
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">Webhook</span>
          </Link>

          <Link href="/transactions" className="flex flex-col items-center gap-2 cursor-pointer group flex-1">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-hover)] flex items-center justify-center text-zinc-300 shadow-sm transition-colors border border-transparent group-hover:border-white/5 shrink-0">
              <History size={24} />
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">History</span>
          </Link>
        </div>
      </motion.div>

      {/* Recent Transactions list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 px-6 flex-1 bg-[var(--color-surface)]/30 rounded-t-3xl pt-6 border-t border-white/5"
      >
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <Link href="/transactions" className="text-sm text-[var(--color-primary)] hover:text-white transition-colors">See all</Link>
        </div>

        <div className="flex flex-col gap-4">
          {transactions.length > 0 ? transactions.map((tx, idx) => {
            const isReceive = tx.direction === 'credit';
            return (
              <div key={tx._id || idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isReceive
                    ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                    : "bg-white/5 text-zinc-300"
                    }`}>
                    {isReceive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="font-medium text-[0.95rem] capitalize">{tx.type.toLowerCase()}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{formatDate(tx.updatedAt)}</p>
                  </div>
                </div>
                <p className={`font-medium ${isReceive ? "text-[var(--color-success)]" : ""}`}>
                  {isReceive ? '+' : '-'}{formatMoney(tx.amount)}
                </p>
              </div>
            )
          }) : (
            <p className="text-zinc-500 text-center py-4 text-sm">No recent transactions shown.</p>
          )}
        </div>
      </motion.div>

    </div>
  );
}
