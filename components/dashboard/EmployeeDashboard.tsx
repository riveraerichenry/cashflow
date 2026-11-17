
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    Wallet,
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    ClipboardList,
    RefreshCw,
    Clock,
    Building2,
} from "lucide-react";

type Account = {
    accountId: string;
    accountName: string;
    accountType: string;
    balance: number;
};

type RemittanceRequest = {
    id: string;
    requestNo?: string;
    request_no?: string;
    amount: number;
    status: string;
    purpose?: string;
    requestedAt?: string;
    requested_at?: string;
};

type Props = {
    firstName: string;
    businessName: string;
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value || 0);
}

function formatDate(value?: string) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export default function EmployeeDashboard({
    firstName,
    businessName,
}: Props) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [requests, setRequests] = useState<RemittanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "/api/dashboard/remittances",
                {
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load employee dashboard."
                );
            }

            setAccounts(
                Array.isArray(data.sourceAccounts)
                    ? data.sourceAccounts
                    : []
            );

            setRequests(
                Array.isArray(data.requests)
                    ? data.requests
                    : []
            );
        } catch (err) {
            console.error("EMPLOYEE DASHBOARD ERROR:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load dashboard."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const totalBalance = accounts.reduce(
        (total, account) => total + Number(account.balance || 0),
        0
    );

    const pendingRequests = requests.filter(
        (request) => request.status === "PENDING"
    ).length;

    const recentRequests = [...requests]
        .sort((a, b) => {
            const dateA = new Date(
                a.requestedAt || a.requested_at || 0
            ).getTime();

            const dateB = new Date(
                b.requestedAt || b.requested_at || 0
            ).getTime();

            return dateB - dateA;
        })
        .slice(0, 5);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* WELCOME */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Employee Portal
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">
                        Good day, {firstName}!
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Welcome to your CashFlow dashboard.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* BUSINESS */}
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Building2 size={22} />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
                        Business
                    </p>

                    <p className="truncate font-semibold text-blue-900">
                        {businessName}
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                My Cash Balance
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-slate-800">
                                {loading
                                    ? "Loading..."
                                    : formatCurrency(totalBalance)}
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                            <Wallet size={23} />
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                        Total balance of your assigned cash accounts
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Pending Remittances
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-orange-600">
                                {loading ? "Loading..." : pendingRequests}
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                            <Clock size={23} />
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                        Remittance requests awaiting Owner confirmation
                    </p>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <section>
                <div className="mb-3">
                    <h2 className="text-lg font-bold text-slate-800">
                        Quick Actions
                    </h2>

                    <p className="text-sm text-slate-500">
                        Manage your cash transactions.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Link
                        href="/dashboard/cash-in"
                        className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white">
                            <ArrowDownToLine size={22} />
                        </div>

                        <p className="font-semibold text-slate-800">
                            Cash In
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Record received cash
                        </p>
                    </Link>

                    <Link
                        href="/dashboard/cash-out"
                        className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
                    >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white">
                            <ArrowUpFromLine size={22} />
                        </div>

                        <p className="font-semibold text-slate-800">
                            Cash Out
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Request a withdrawal
                        </p>
                    </Link>

                    <Link
                        href="/dashboard/remittances"
                        className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white">
                            <ArrowLeftRight size={22} />
                        </div>

                        <p className="font-semibold text-slate-800">
                            Remit Cash
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Submit a remittance
                        </p>
                    </Link>

                    <Link
                        href="/dashboard/transactions"
                        className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-700 group-hover:text-white">
                            <ClipboardList size={22} />
                        </div>

                        <p className="font-semibold text-slate-800">
                            My Transactions
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            View transaction history
                        </p>
                    </Link>
                </div>
            </section>

            {/* ACCOUNTS */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                    <div>
                        <h2 className="font-bold text-slate-800">
                            My Cash Accounts
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Accounts assigned to your employee profile
                        </p>
                    </div>

                    <Wallet className="text-blue-600" size={21} />
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-slate-400">
                        Loading accounts...
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="p-8 text-center">
                        <Wallet
                            size={30}
                            className="mx-auto mb-2 text-slate-300"
                        />

                        <p className="font-medium text-slate-600">
                            No assigned cash accounts
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Please contact your Owner.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {accounts.map((account) => (
                            <div
                                key={account.accountId}
                                className="flex items-center justify-between gap-3 p-4 sm:px-5"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                        <Wallet size={19} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                            {account.accountName}
                                        </p>

                                        <p className="text-xs text-slate-400">
                                            {account.accountType}
                                        </p>
                                    </div>
                                </div>

                                <p className="shrink-0 text-sm font-bold text-slate-800">
                                    {formatCurrency(Number(account.balance || 0))}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* REMITTANCE HISTORY */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                    <div>
                        <h2 className="font-bold text-slate-800">
                            Recent Remittances
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Your latest remittance requests
                        </p>
                    </div>

                    <Link
                        href="/dashboard/remittances"
                        className="text-sm font-semibold text-blue-700 hover:underline"
                    >
                        View All
                    </Link>
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-slate-400">
                        Loading remittances...
                    </div>
                ) : recentRequests.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        No remittance requests found.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {recentRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {request.requestNo ||
                                            request.request_no ||
                                            "Remittance"}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {request.purpose || "Cash remittance"}
                                        {" · "}
                                        {formatDate(
                                            request.requestedAt ||
                                            request.requested_at
                                        )}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                    <p className="text-sm font-bold text-slate-800">
                                        {formatCurrency(Number(request.amount || 0))}
                                    </p>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            request.status === "RECEIVED"
                                                ? "bg-green-100 text-green-700"
                                                : request.status === "PENDING"
                                                ? "bg-orange-100 text-orange-700"
                                                : request.status === "REJECTED"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {request.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
