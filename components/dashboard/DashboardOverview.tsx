
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Wallet,
    ArrowDownToLine,
    ArrowUpFromLine,
    Users,
    Plus,
    ArrowRight,
    RefreshCw,
} from "lucide-react";

type Summary = {
    total_balance: string;
    total_cash_in: string;
    total_cash_out: string;
    active_employees: string;
};

type Transaction = {
    id: string;
    transaction_no: string;
    transaction_type: string;
    transaction_date: string;
    amount: string;
    description: string | null;
    reference_no: string | null;
    status: string;
    first_name: string | null;
    last_name: string | null;
};

type EmployeeBalance = {
    employee_id: string;
    employee_code: string;
    first_name: string;
    last_name: string;
    balance: string;
};

type Props = {
    businessName: string;
    firstName: string;
    role: string;
};

const currency = (value: string | number) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(Number(value || 0));

const dateFormat = (value: string) =>
    new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
    });

const typeLabel = (type: string) =>
    type.replaceAll("_", " ");

export default function DashboardOverview({
    businessName,
    firstName,
    role,
}: Props) {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [employeeBalances, setEmployeeBalances] = useState<EmployeeBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadDashboard() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/dashboard/summary", {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load dashboard.");
            }

            setSummary(data.summary);
            setTransactions(data.transactions || []);
            setEmployeeBalances(data.employeeBalances || []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load dashboard information."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDashboard();
    }, []);

    const cards = [
        {
            title: "Total Cash Balance",
            value: summary ? currency(summary.total_balance) : "—",
            description: "Across active cash accounts",
            icon: Wallet,
            color: "bg-blue-50 text-blue-700",
        },
        {
            title: "Total Cash In",
            value: summary ? currency(summary.total_cash_in) : "—",
            description: "Posted cash-in transactions",
            icon: ArrowDownToLine,
            color: "bg-green-50 text-green-700",
        },
        {
            title: "Total Cash Out",
            value: summary ? currency(summary.total_cash_out) : "—",
            description: "Posted withdrawal transactions",
            icon: ArrowUpFromLine,
            color: "bg-orange-50 text-orange-700",
        },
        {
            title: "Active Employees",
            value: summary ? Number(summary.active_employees).toLocaleString("en-PH") : "—",
            description: "Active employee accounts",
            icon: Users,
            color: "bg-purple-50 text-purple-700",
        },
    ];

    return (
        <div className="space-y-7">
            <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#173B75] to-blue-700 p-6 text-white shadow-sm sm:p-8">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm text-blue-200">
                            Welcome back, {firstName}!
                        </p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                            {businessName}
                        </h1>
                        <p className="mt-2 text-sm text-blue-100">
                            Monitor your business cash flow in one place.
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                        <p className="text-xs text-blue-100">Account Role</p>
                        <p className="mt-1 font-semibold">{role}</p>
                    </div>
                </div>
            </section>

            {error && (
                <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                    <p>{error}</p>
                    <button
                        onClick={loadDashboard}
                        className="flex items-center gap-2 font-semibold"
                    >
                        <RefreshCw size={15} /> Retry
                    </button>
                </div>
            )}

            <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-bold text-slate-900">
                        Business Overview
                    </h2>
                    <button
                        onClick={loadDashboard}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.title}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">
                                            {card.title}
                                        </p>
                                        <h3 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
                                            {loading ? "Loading..." : card.value}
                                        </h3>
                                    </div>
                                    <div className={`rounded-xl p-3 ${card.color}`}>
                                        <Icon size={21} />
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-slate-400">
                                    {card.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section>
                <h2 className="mb-4 font-bold text-slate-900">Quick Actions</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <QuickAction
                        title="Record Cash In"
                        description="Record money received"
                        href="/dashboard/cash-in"
                        icon={<ArrowDownToLine size={21} />}
                        color="bg-green-600"
                    />
                    <QuickAction
                        title="Record Cash Out"
                        description="Record money released"
                        href="/dashboard/cash-out"
                        icon={<ArrowUpFromLine size={21} />}
                        color="bg-orange-500"
                    />
                    <QuickAction
                        title="Manage Employees"
                        description="Manage employee accounts"
                        href="/dashboard/employees"
                        icon={<Users size={21} />}
                        color="bg-blue-700"
                    />
                    <QuickAction
                        title="Cash Accounts"
                        description="View business accounts"
                        href="/dashboard/accounts"
                        icon={<Wallet size={21} />}
                        color="bg-purple-600"
                    />
                </div>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 p-5">
                        <h2 className="font-bold text-slate-900">
                            Recent Transactions
                        </h2>
                        <Link
                            href="/dashboard/transactions"
                            className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                        >
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>

                    {loading ? (
                        <EmptyMessage message="Loading transactions..." />
                    ) : transactions.length === 0 ? (
                        <EmptyMessage message="No posted transactions yet." />
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {transactions.slice(0, 5).map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                            {item.transaction_no}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {typeLabel(item.transaction_type)}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-slate-400">
                                            {item.first_name
                                                ? `${item.first_name} ${item.last_name || ""}`
                                                : "No employee assigned"}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-bold text-slate-900">
                                            {currency(item.amount)}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {dateFormat(item.transaction_date)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 p-5">
                        <h2 className="font-bold text-slate-900">
                            Employee Cash Balances
                        </h2>
                        <Link
                            href="/dashboard/employees"
                            className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                        >
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>

                    {loading ? (
                        <EmptyMessage message="Loading employee balances..." />
                    ) : employeeBalances.length === 0 ? (
                        <EmptyMessage message="No employee cash balances yet." />
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {employeeBalances.slice(0, 5).map((employee) => (
                                <div
                                    key={employee.employee_id}
                                    className="flex items-center justify-between gap-3 p-4"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                            {employee.first_name.charAt(0)}
                                            {employee.last_name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                {employee.first_name} {employee.last_name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {employee.employee_code}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="shrink-0 text-sm font-bold text-slate-900">
                                        {currency(employee.balance)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function EmptyMessage({ message }: { message: string }) {
    return (
        <div className="px-5 py-12 text-center text-sm text-slate-400">
            {message}
        </div>
    );
}

function QuickAction({
    title,
    description,
    href,
    icon,
    color,
}: {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className={`rounded-xl p-3 text-white ${color}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <p className="mt-1 text-xs text-slate-500">{description}</p>
            </div>
            <Plus
                size={17}
                className="text-slate-300 transition group-hover:text-blue-700"
            />
        </Link>
    );
}
