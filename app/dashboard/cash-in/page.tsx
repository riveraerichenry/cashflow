
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Plus,
    RefreshCw,
    Wallet,
    ArrowDownLeft,
    TrendingUp,
} from "lucide-react";

import CashInFormModal from "@/components/dashboard/cash-in/CashInFormModal";
import CashInTable from "@/components/dashboard/cash-in/CashInTable";

/*
====================================================================
TYPES
====================================================================
*/

type CashAccount = {
    id: string;
    account_name: string;
    account_type: string;
    provider?: string | null;
    balance: string | number;
    is_active?: boolean;
};

type CashInTransaction = {
    id: string;
    transaction_no: string;
    transaction_date: string;
    source_name: string;
    amount: string | number;
    reference_no?: string | null;
    description?: string | null;
    status: string;
    account_name?: string | null;
    account_type?: string | null;
    first_name?: string | null;
    last_name?: string | null;
};

/*
====================================================================
MAIN PAGE
====================================================================
*/

export default function CashInPage() {
    /*
    ================================================================
    STATE
    ================================================================
    */

    const [accounts, setAccounts] = useState<CashAccount[]>([]);

    const [transactions, setTransactions] = useState<CashInTransaction[]>([]);

    const [showModal, setShowModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    /*
    ================================================================
    LOAD DATA
    ================================================================
    */

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const [accountsResponse, transactionsResponse] =
                await Promise.all([
                    fetch("/api/dashboard/accounts", {
                        cache: "no-store",
                    }),

                    fetch("/api/dashboard/cash-in", {
                        cache: "no-store",
                    }),
                ]);

            if (
                accountsResponse.status === 401 ||
                transactionsResponse.status === 401
            ) {
                window.location.href = "/login";
                return;
            }

            const accountsData = await accountsResponse.json();
            const transactionsData = await transactionsResponse.json();

            if (!accountsResponse.ok || !accountsData.success) {
                throw new Error(
                    accountsData.message ||
                    "Unable to load cash accounts."
                );
            }

            if (!transactionsResponse.ok || !transactionsData.success) {
                throw new Error(
                    transactionsData.message ||
                    "Unable to load Cash In transactions."
                );
            }

            setAccounts(
                (accountsData.accounts || []).filter(
                    (account: CashAccount) =>
                        account.is_active !== false
                )
            );

            setTransactions(
                transactionsData.transactions || []
            );

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load Cash In data."
            );

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    /*
    ================================================================
    INITIAL LOAD
    ================================================================
    */

    useEffect(() => {
        loadData();
    }, [loadData]);

    /*
    ================================================================
    SUMMARY
    ================================================================
    */

    const totalCashIn = useMemo(
        () =>
            transactions
                .filter((item) => item.status === "POSTED")
                .reduce(
                    (total, item) =>
                        total + Number(item.amount || 0),
                    0
                ),
        [transactions]
    );

    const postedTransactions = useMemo(
        () =>
            transactions.filter(
                (item) => item.status === "POSTED"
            ).length,
        [transactions]
    );

    /*
    ================================================================
    FORMAT CURRENCY
    ================================================================
    */

    const formatCurrency = (value: number | string) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(Number(value || 0));

    /*
    ================================================================
    LOADING STATE
    ================================================================
    */

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center">
                    <RefreshCw
                        className="mx-auto animate-spin text-blue-700"
                        size={28}
                    />

                    <p className="mt-3 text-sm text-slate-500">
                        Loading Cash In...
                    </p>
                </div>
            </div>
        );
    }

    /*
    ================================================================
    RENDER
    ================================================================
    */

    return (
        <div className="w-full min-w-0 space-y-6">

            {/* ================================================== */}
            {/* PAGE HEADING */}
            {/* ================================================== */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                        <ArrowDownLeft size={17} />
                        Cash Management
                    </div>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        Cash In
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Record and monitor money received by your business.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing ? "animate-spin" : ""
                            }
                        />

                        <span className="hidden sm:inline">
                            Refresh
                        </span>
                    </button>

                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                    >
                        <Plus size={18} />
                        New Cash In
                    </button>
                </div>
            </div>

            {/* ================================================== */}
            {/* ERROR MESSAGE */}
            {/* ================================================== */}

            {error && (
                <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                    <p>{error}</p>

                    <button
                        onClick={() => loadData(true)}
                        className="shrink-0 font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ================================================== */}
            {/* SUMMARY CARDS */}
            {/* ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {/* TOTAL CASH IN */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                            Total Posted Cash In
                        </p>

                        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                            <TrendingUp size={20} />
                        </div>
                    </div>

                    <p className="mt-4 text-2xl font-bold tabular-nums text-slate-900">
                        {formatCurrency(totalCashIn)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Based on loaded posted transactions
                    </p>
                </div>

                {/* ACTIVE ACCOUNTS */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                            Active Cash Accounts
                        </p>

                        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                            <Wallet size={20} />
                        </div>
                    </div>

                    <p className="mt-4 text-2xl font-bold tabular-nums text-slate-900">
                        {accounts.length}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Available receiving accounts
                    </p>
                </div>

                {/* POSTED TRANSACTIONS */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                            Posted Transactions
                        </p>

                        <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
                            <ArrowDownLeft size={20} />
                        </div>
                    </div>

                    <p className="mt-4 text-2xl font-bold tabular-nums text-slate-900">
                        {postedTransactions}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Transactions in the latest 100 records
                    </p>
                </div>
            </div>

            {/* ================================================== */}
            {/* RECEIVING ACCOUNTS */}
            {/* ================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                    <h2 className="font-bold text-slate-900">
                        Receiving Accounts
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Current balances of your active accounts.
                    </p>
                </div>

                {accounts.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                        No active cash accounts found. Create an account first in Cash Accounts.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {accounts.map((account) => (
                            <div
                                key={account.id}
                                className="rounded-xl border border-slate-200 p-4"
                            >
                                <p className="text-sm font-semibold text-slate-800">
                                    {account.account_name}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {account.account_type}

                                    {account.provider
                                        ? ` · ${account.provider}`
                                        : ""}
                                </p>

                                <p className="mt-3 text-lg font-bold tabular-nums text-slate-900">
                                    {formatCurrency(account.balance)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ================================================== */}
            {/* CASH IN TABLE */}
            {/* ================================================== */}

            <CashInTable
                transactions={transactions}
            />

            {/* ================================================== */}
            {/* CASH IN MODAL */}
            {/* ================================================== */}

            {showModal && (
                <CashInFormModal
                    accounts={accounts}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        loadData(true);
                    }}
                />
            )}
        </div>
    );
}
