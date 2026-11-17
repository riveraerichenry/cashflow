
import Link from "next/link";
import {
    ArrowRight,
    Wallet,
    ShieldCheck,
} from "lucide-react";

export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col bg-white">

            {/* HEADER */}
            <header className="w-full border-b border-slate-100">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">

                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-xl font-bold text-white">
                            C
                        </div>

                        <span className="text-xl font-bold tracking-tight text-slate-900">
                            Cash<span className="text-blue-700">Flow</span>
                        </span>
                    </Link>

                    <span className="hidden text-sm text-slate-400 sm:block">
                        Business Cash Monitoring System
                    </span>

                </div>
            </header>

            {/* MAIN */}
            <section className="flex flex-1 items-center justify-center px-5 py-16 sm:px-8">

                <div className="w-full max-w-2xl text-center">

                    {/* ICON */}
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Wallet size={32} strokeWidth={1.7} />
                    </div>

                    {/* TITLE */}
                    <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Manage Your Cash.
                        <span className="block text-blue-700">
                            Simplify Your Business.
                        </span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
                        A centralized platform for monitoring cash flow,
                        managing accounts, tracking transactions, and
                        maintaining employee accountability.
                    </p>

                    {/* LOGIN OPTIONS */}
                    <div className="mx-auto mt-10 grid w-full max-w-md gap-4 sm:grid-cols-2">

                        <Link
                            href="/login"
                            className="group flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl bg-blue-700 p-6 text-white shadow-lg shadow-blue-700/10 transition hover:-translate-y-1 hover:bg-blue-800"
                        >
                            <Wallet size={26} />

                            <span className="text-base font-semibold">
                                Business Login
                            </span>

                            <span className="flex items-center gap-2 text-xs text-blue-100">
                                Owner & Employee
                                <ArrowRight size={14} />
                            </span>
                        </Link>

                        <Link
                            href="/system-admin/login"
                            className="group flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 transition hover:-translate-y-1 hover:border-blue-300 hover:bg-slate-50"
                        >
                            <ShieldCheck size={26} className="text-orange-500" />

                            <span className="text-base font-semibold">
                                Admin Login
                            </span>

                            <span className="flex items-center gap-2 text-xs text-slate-400">
                                System Administrator
                                <ArrowRight size={14} />
                            </span>
                        </Link>

                    </div>

                    <p className="mt-10 text-xs text-slate-400">
                        Secure access to your CashFlow account.
                    </p>

                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-slate-100 px-5 py-6 text-center">
                <p className="text-xs text-slate-400">
                    © {new Date().getFullYear()} CashFlow. All rights reserved.
                </p>
            </footer>

        </main>
    );
}
