"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmployeeLoginPage() {
    const router = useRouter();

    const [businessCode, setBusinessCode] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    businessCode,
                    username,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to sign in."
                );
            }

            router.replace(data.redirectTo || "/dashboard");

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to sign in."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">

            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">

                <div className="mb-8 text-center">

                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-2xl font-bold text-white">
                        C
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900">
                        CashFlow
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Business Cash Monitoring System
                    </p>

                </div>

                <form onSubmit={handleLogin} className="space-y-5">

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Business Code
                        </label>

                        <input
                            required
                            value={businessCode}
                            onChange={(e) =>
                                setBusinessCode(e.target.value.toUpperCase())
                            }
                            placeholder="Enter business code"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm uppercase text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Username
                        </label>

                        <input
                            required
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            placeholder="Enter your username"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Password
                        </label>

                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                </form>

                {/* ADMIN LOGIN LINK */}
                <div className="mt-6 border-t border-slate-100 pt-5 text-center">

                    <p className="text-sm text-slate-500">
                        Are you a system administrator?
                    </p>

                    <Link
                        href="/system-admin/login"
                        className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900 hover:underline"
                    >
                        Admin Login
                        <span aria-hidden="true">→</span>
                    </Link>

                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    CashFlow Business Cash Monitoring System
                </p>

            </div>
        </main>
    );
}