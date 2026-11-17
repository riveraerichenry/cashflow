
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";

import {
    Search,
    RefreshCw,
    ArrowDownCircle,
    ArrowUpCircle,
    Wallet,
    TrendingUp,
    CalendarDays,
    X,
} from "lucide-react";

import TransactionTable, {
    type Transaction,
} from "@/components/dashboard/transactions/TransactionTable";

import TransactionDetailsModal from "@/components/dashboard/transactions/TransactionDetailsModal";

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
};

type TransactionFilters = {
    search: string;
    accountId: string;
    type: string;
    dateFrom: string;
    dateTo: string;
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
    icon: ReactNode;
    color: "blue" | "green" | "red" | "orange";
}) {
    const styles = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-green-50 text-green-700",
        red: "bg-red-50 text-red-700",
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

export default function TransactionsPage() {
    /*
    ================================================================
    STATE
    ================================================================
    */

    const [accounts, setAccounts] = useState<Account[]>([]);

    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const [search, setSearch] = useState("");
    const [accountId, setAccountId] = useState("ALL");
    const [type, setType] = useState("ALL");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [selectedTransaction, setSelectedTransaction] =
        useState<Transaction | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [totalRecords, setTotalRecords] = useState(0);

    /*
    ================================================================
    CURRENT FILTER VALUES
    ================================================================
    */

    const getCurrentFilters = useCallback((): TransactionFilters => {
        return {
            search,
            accountId,
            type,
            dateFrom,
            dateTo,
        };
    }, [
        search,
        accountId,
        type,
        dateFrom,
        dateTo,
    ]);

    /*
    ================================================================
    LOAD CASH ACCOUNTS
    ================================================================
    */

    const loadAccounts = useCallback(async () => {
        try {
            const response = await fetch(
                "/api/dashboard/accounts",
                {
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load cash accounts."
                );
            }

            setAccounts(data.accounts || []);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load cash accounts."
            );
        }
    }, []);

    /*
    ================================================================
    LOAD TRANSACTIONS

    Filters are passed explicitly.
    This prevents automatic fetching while typing.
    ================================================================
    */

    const loadTransactions = useCallback(
        async (filters: TransactionFilters) => {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams();

                if (filters.search.trim()) {
                    params.set("search", filters.search.trim());
                }

                if (filters.accountId !== "ALL") {
                    params.set("accountId", filters.accountId);
                }

                if (filters.type !== "ALL") {
                    params.set("type", filters.type);
                }

                if (filters.dateFrom) {
                    params.set("dateFrom", filters.dateFrom);
                }

                if (filters.dateTo) {
                    params.set("dateTo", filters.dateTo);
                }

                const response = await fetch(
                    `/api/dashboard/transactions?${params.toString()}`,
                    {
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message ||
                        "Unable to load transaction history."
                    );
                }

                setTransactions(data.transactions || []);
                setTotalRecords(data.totalRecords || 0);

            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong."
                );

            } finally {
                setLoading(false);
            }
        },
        []
    );

    /*
    ================================================================
    INITIAL PAGE LOAD
    ================================================================
    */

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    /*
    ================================================================
    INITIAL TRANSACTION LOAD
    ================================================================
    */

    useEffect(() => {
        loadTransactions({
            search: "",
            accountId: "ALL",
            type: "ALL",
            dateFrom: "",
            dateTo: "",
        });
    }, [loadTransactions]);

    /*
    ================================================================
    APPLY FILTERS
    ================================================================
    */

    function handleSearchSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        loadTransactions(getCurrentFilters());
    }

    /*
    ================================================================
    REFRESH
    ================================================================
    */

    function handleRefresh() {
        loadTransactions(getCurrentFilters());
    }

    /*
    ================================================================
    CLEAR FILTERS
    ================================================================
    */

    function clearFilters() {
        const emptyFilters: TransactionFilters = {
            search: "",
            accountId: "ALL",
            type: "ALL",
            dateFrom: "",
            dateTo: "",
        };

        setSearch("");
        setAccountId("ALL");
        setType("ALL");
        setDateFrom("");
        setDateTo("");

        loadTransactions(emptyFilters);
    }

    /*
    ================================================================
    SUMMARY

    These totals represent the currently displayed results,
    limited to the latest 500 entries returned by the API.
    ================================================================
    */

    const summary = useMemo(() => {
        const cashIn = transactions.reduce(
            (sum, item) => {
                return item.direction.toUpperCase() === "IN"
                    ? sum + item.ledgerAmount
                    : sum;
            },
            0
        );

        const cashOut = transactions.reduce(
            (sum, item) => {
                return item.direction.toUpperCase() === "OUT"
                    ? sum + item.ledgerAmount
                    : sum;
            },
            0
        );

        return {
            cashIn,
            cashOut,
            net: cashIn - cashOut,
        };
    }, [transactions]);

    /*
    ================================================================
    FILTER STATUS
    ================================================================
    */

    const hasFilters =
        search.trim() !== "" ||
        accountId !== "ALL" ||
        type !== "ALL" ||
        dateFrom !== "" ||
        dateTo !== "";

    /*
    ================================================================
    RENDER
    ================================================================
    */

    return (
        <div className="w-full min-w-0">
            <div className="mx-auto max-w-[1600px] space-y-6">

                {/* ================================================== */}
                {/* PAGE HEADING */}
                {/* ================================================== */}

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Wallet size={16} />

                            <span>Cash Management</span>

                            <span>/</span>

                            <span className="text-blue-700">
                                Transaction History
                            </span>
                        </div>

                        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                            Transaction History
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Monitor and trace all posted cash movements.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={17}
                            className={
                                loading ? "animate-spin" : ""
                            }
                        />

                        Refresh
                    </button>
                </div>

                {/* ================================================== */}
                {/* SUMMARY CARDS */}
                {/* ================================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <SummaryCard
                        title="Cash In"
                        amount={summary.cashIn}
                        description="Incoming movements in displayed results"
                        icon={<ArrowDownCircle size={22} />}
                        color="green"
                    />

                    <SummaryCard
                        title="Cash Out"
                        amount={summary.cashOut}
                        description="Outgoing movements in displayed results"
                        icon={<ArrowUpCircle size={22} />}
                        color="red"
                    />

                    <SummaryCard
                        title="Net Movement"
                        amount={summary.net}
                        description="Cash In minus Cash Out in displayed results"
                        icon={<TrendingUp size={22} />}
                        color="blue"
                    />
                </div>

                {/* ================================================== */}
                {/* FILTERS */}
                {/* ================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-bold text-slate-800">
                                Filter Transactions
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Search and narrow down your ledger records.
                            </p>
                        </div>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1 self-start text-xs font-semibold text-red-600 hover:text-red-700"
                            >
                                <X size={14} />
                                Clear filters
                            </button>
                        )}
                    </div>

                    <form
                        onSubmit={handleSearchSubmit}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6"
                    >
                        {/* SEARCH */}

                        <div className="relative sm:col-span-2 xl:col-span-2">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search transaction, source, employee..."
                                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* ACCOUNT */}

                        <select
                            value={accountId}
                            onChange={(e) =>
                                setAccountId(e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="ALL">
                                All Accounts
                            </option>

                            {accounts.map((account) => (
                                <option
                                    key={account.id}
                                    value={account.id}
                                >
                                    {account.account_name ||
                                        account.accountName ||
                                        "Cash Account"}
                                </option>
                            ))}
                        </select>

                        {/* TRANSACTION TYPE */}

                        <select
                            value={type}
                            onChange={(e) =>
                                setType(e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="ALL">
                                All Types
                            </option>

                            <option value="CASH_IN">
                                Cash In
                            </option>

                            <option value="WITHDRAWAL">
                                Cash Out
                            </option>
                        </select>

                        {/* DATE FROM */}

                        <div className="relative">
                            <CalendarDays
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) =>
                                    setDateFrom(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-2 text-sm outline-none focus:border-blue-500"
                                aria-label="Date from"
                            />
                        </div>

                        {/* DATE TO */}

                        <div className="relative">
                            <CalendarDays
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="date"
                                value={dateTo}
                                min={dateFrom || undefined}
                                onChange={(e) =>
                                    setDateTo(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-2 text-sm outline-none focus:border-blue-500"
                                aria-label="Date to"
                            />
                        </div>

                        {/* APPLY */}

                        <div className="sm:col-span-2 xl:col-span-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60 sm:w-auto"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </form>
                </div>

                {/* ================================================== */}
                {/* LEDGER TABLE */}
                {/* ================================================== */}

                <div className="space-y-3">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-bold text-slate-800">
                                Ledger Entries
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                {totalRecords.toLocaleString("en-PH")} matching ledger entries

                                {totalRecords > 500
                                    ? " (showing the latest 500)"
                                    : ""}
                            </p>
                        </div>

                        <span className="text-xs text-slate-400">
                            Posted transactions only
                        </span>
                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* TABLE */}

                    <TransactionTable
                        transactions={transactions}
                        loading={loading}
                        onView={setSelectedTransaction}
                    />
                </div>
            </div>

            {/* TRANSACTION DETAILS MODAL */}

            <TransactionDetailsModal
                transaction={selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
            />
        </div>
    );
}
