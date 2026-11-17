
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowDownUp,
    RefreshCw,
    Wallet,
    ArrowLeftRight,
    TrendingUp,
} from "lucide-react";

import TransferFormModal from "@/components/dashboard/transfers/TransferFormModal";

import TransferTable, {
    type Transfer,
} from "@/components/dashboard/transfers/TransferTable";

import TransferDetailsModal from "@/components/dashboard/transfers/TransferDetailsModal";

/*
====================================================================
TYPES
====================================================================
*/

type Account = {
    id: string;
    account_name?: string;
    accountName?: string;
    account_type?: string;
    accountType?: string;
    balance?: number | string;
    is_active?: boolean;
};

/*
====================================================================
HELPERS
====================================================================
*/

function currency(value: number) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value || 0);
}

/*
====================================================================
SUMMARY CARD
====================================================================
*/

function SummaryCard({
    title,
    amount,
    description,
    icon,
    color,
}: {
    title: string;
    amount: number;
    description: string;
    icon: React.ReactNode;
    color: "blue" | "green" | "orange";
}) {
    const styles = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-green-50 text-green-700",
        orange: "bg-orange-50 text-orange-700",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                        {currency(amount)}
                    </h3>

                    <p className="mt-2 text-xs text-slate-400">
                        {description}
                    </p>
                </div>

                <div className={`rounded-xl p-3 ${styles[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

/*
====================================================================
MAIN PAGE
====================================================================
*/

export default function TransfersPage() {
    /*
    ================================================================
    STATE
    ================================================================
    */

    const [accounts, setAccounts] = useState<Account[]>([]);

    const [transfers, setTransfers] = useState<Transfer[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [selectedTransfer, setSelectedTransfer] =
        useState<Transfer | null>(null);

    /*
    ================================================================
    LOAD DATA
    ================================================================
    */

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [accountResponse, transferResponse] =
                await Promise.all([
                    fetch("/api/dashboard/accounts", {
                        cache: "no-store",
                    }),

                    fetch("/api/dashboard/transfers", {
                        cache: "no-store",
                    }),
                ]);

            if (
                accountResponse.status === 401 ||
                transferResponse.status === 401
            ) {
                window.location.href = "/login";
                return;
            }

            const accountData = await accountResponse.json();
            const transferData = await transferResponse.json();

            if (!accountResponse.ok || !accountData.success) {
                throw new Error(
                    accountData.message ||
                    "Unable to load accounts."
                );
            }

            if (!transferResponse.ok || !transferData.success) {
                throw new Error(
                    transferData.message ||
                    "Unable to load transfers."
                );
            }

            setAccounts(accountData.accounts || []);
            setTransfers(transferData.transfers || []);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load transfer information."
            );

        } finally {
            setLoading(false);
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

    const summary = useMemo(() => {
        const totalTransfers = transfers.reduce(
            (sum, transfer) =>
                sum + Number(transfer.amount || 0),
            0
        );

        return {
            count: transfers.length,
            amount: totalTransfers,
        };
    }, [transfers]);

    /*
    ================================================================
    ACTIVE ACCOUNTS
    ================================================================
    */

    const activeAccounts = accounts.filter(
        (account) => account.is_active !== false
    );

    /*
    ================================================================
    RENDER
    ================================================================
    */

    return (
        <div className="w-full min-w-0">
            <div className="mx-auto max-w-[1600px] space-y-6">

                {/* ================================================== */}
                {/* PAGE HEADER */}
                {/* ================================================== */}

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Wallet size={16} />

                            <span>Cash Management</span>

                            <span>/</span>

                            <span className="text-blue-700">
                                Account Transfers
                            </span>
                        </div>

                        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                            Account Transfers
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Move funds between your business accounts.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    loading ? "animate-spin" : ""
                                }
                            />

                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowForm(true)}
                            disabled={
                                activeAccounts.length < 2 ||
                                loading
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ArrowDownUp size={18} />
                            New Transfer
                        </button>
                    </div>
                </div>

                {/* ================================================== */}
                {/* ERROR */}
                {/* ================================================== */}

                {error && (
                    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={loadData}
                            className="shrink-0 font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ================================================== */}
                {/* SUMMARY */}
                {/* ================================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <SummaryCard
                        title="Completed Transfers"
                        amount={summary.count}
                        description="Number of transfers in latest 200 records"
                        icon={<ArrowLeftRight size={22} />}
                        color="blue"
                    />

                    <SummaryCard
                        title="Total Transferred"
                        amount={summary.amount}
                        description="Total value of displayed transfers"
                        icon={<TrendingUp size={22} />}
                        color="green"
                    />

                    <SummaryCard
                        title="Available Accounts"
                        amount={activeAccounts.length}
                        description="Business cash accounts"
                        icon={<Wallet size={22} />}
                        color="orange"
                    />
                </div>

                {/* ================================================== */}
                {/* ACCOUNT BALANCES */}
                {/* ================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <h2 className="font-bold text-slate-800">
                            Account Balances
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Current balances available for transfers.
                        </p>
                    </div>

                    {accounts.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            No accounts found.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {accounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <p className="text-sm font-semibold text-slate-800">
                                        {account.account_name ||
                                            account.accountName ||
                                            "Cash Account"}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {account.account_type ||
                                            account.accountType ||
                                            "Account"}
                                    </p>

                                    <p className="mt-3 text-lg font-bold text-slate-900">
                                        {currency(
                                            Number(account.balance || 0)
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ================================================== */}
                {/* TRANSFER HISTORY */}
                {/* ================================================== */}

                <div className="space-y-3">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-bold text-slate-800">
                                Transfer History
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                {transfers.length} completed transfers

                                {transfers.length === 200
                                    ? " (latest 200)"
                                    : ""}
                            </p>
                        </div>

                        <span className="text-xs text-slate-400">
                            Posted transfers only
                        </span>
                    </div>

                    <TransferTable
                        transfers={transfers}
                        loading={loading}
                        onView={setSelectedTransfer}
                    />
                </div>
            </div>

            {/* ================================================== */}
            {/* TRANSFER FORM */}
            {/* ================================================== */}

            <TransferFormModal
                open={showForm}
                accounts={activeAccounts}
                onClose={() => setShowForm(false)}
                onSuccess={loadData}
            />

            {/* ================================================== */}
            {/* TRANSFER DETAILS */}
            {/* ================================================== */}

            <TransferDetailsModal
                transfer={selectedTransfer}
                onClose={() => setSelectedTransfer(null)}
            />
        </div>
    );
}
