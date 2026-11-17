"use client";

import { useCallback, useEffect, useState } from "react";

import {
    ArrowUpRight,
    RefreshCw,
    Plus,
    Wallet,
    CheckCircle,
    Banknote,
    Clock,
} from "lucide-react";

import CashOutSummaryCard from "@/components/dashboard/cash-out/CashOutSummaryCard";
import CashOutAccountBalances from "@/components/dashboard/cash-out/CashOutAccountBalances";
import WithdrawalRequests from "@/components/dashboard/cash-out/WithdrawalRequests";
import WithdrawalRequestModal from "@/components/dashboard/cash-out/WithdrawalRequestModal";

import {
    Account,
    WithdrawalRequest,
    CashOutAction,
} from "@/components/dashboard/cash-out/types";

type Session = {
    employeeId: string;
    firstName: string;
    lastName: string;
    role: string;
};

export default function CashOutPage() {
    const [session, setSession] = useState<Session | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [accountId, setAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [purpose, setPurpose] = useState("");

    const isOwner = session?.role === "OWNER";

    /*
    ================================================================
    LOAD DATA
    ================================================================
    */

    const loadData = useCallback(async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const [
                meResponse,
                accountResponse,
                requestResponse,
            ] = await Promise.all([
                fetch("/api/auth/me", {
                    cache: "no-store",
                }),

                fetch("/api/dashboard/accounts", {
                    cache: "no-store",
                }),

                fetch("/api/dashboard/cash-out", {
                    cache: "no-store",
                }),
            ]);

            if (
                meResponse.status === 401 ||
                accountResponse.status === 401 ||
                requestResponse.status === 401
            ) {
                window.location.href = "/login";
                return;
            }

            const meData = await meResponse.json();
            const accountData = await accountResponse.json();
            const requestData = await requestResponse.json();

            if (!meResponse.ok || !meData.success) {
                throw new Error(
                    meData.message || "Unable to load session."
                );
            }

            if (!accountResponse.ok || !accountData.success) {
                throw new Error(
                    accountData.message || "Unable to load accounts."
                );
            }

            if (!requestResponse.ok || !requestData.success) {
                throw new Error(
                    requestData.message ||
                    "Unable to load withdrawal requests."
                );
            }

            const employee =
                meData.session ||
                meData.employee ||
                meData;

            setSession({
                employeeId: employee.employeeId || employee.id,
                firstName: employee.firstName || "",
                lastName: employee.lastName || "",
                role: employee.role || "",
            });

            setAccounts(
                (accountData.accounts || []).filter(
                    (account: Account) =>
                        account.is_active !== false
                )
            );

            setRequests(requestData.requests || []);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load Cash Out."
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
    SUBMIT WITHDRAWAL REQUEST
    ================================================================
    */

    async function submitRequest(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        const numericAmount = Number(amount);

        if (!accountId) {
            setError("Please select a cash account.");
            return;
        }

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            setError("Enter a valid withdrawal amount.");
            return;
        }

        if (
            Math.round(numericAmount * 100) !==
            numericAmount * 100
        ) {
            setError(
                "Amount must have no more than two decimal places."
            );
            return;
        }

        if (purpose.trim().length < 3) {
            setError(
                "Please provide a purpose of at least 3 characters."
            );
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(
                "/api/dashboard/cash-out",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        accountId,
                        amount: numericAmount,
                        purpose: purpose.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Failed to submit request."
                );
            }

            setShowForm(false);
            setAccountId("");
            setAmount("");
            setPurpose("");

            setSuccess(
                "Withdrawal request submitted successfully."
            );

            await loadData(true);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to submit request."
            );

        } finally {
            setSubmitting(false);
        }
    }

    /*
    ================================================================
    PROCESS WITHDRAWAL REQUEST
    ================================================================
    */

    async function processRequest(
        requestId: string,
        action: CashOutAction
    ) {
        setError("");
        setSuccess("");

        let rejectionReason = "";

        if (action === "REJECT") {
            rejectionReason =
                window.prompt(
                    "Enter the reason for rejection:"
                )?.trim() || "";

            if (rejectionReason.length < 3) {
                setError(
                    "Please provide a rejection reason of at least 3 characters."
                );
                return;
            }
        }

        const confirmation = {
            APPROVE: "Approve this withdrawal request?",
            REJECT: "Reject this withdrawal request?",
            RELEASE:
                "Release this withdrawal and deduct it from the account?",
        }[action];

        if (!window.confirm(confirmation)) {
            return;
        }

        setProcessingId(requestId);

        try {
            const response = await fetch(
                `/api/dashboard/cash-out/${requestId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action,
                        ...(action === "REJECT"
                            ? { rejectionReason }
                            : {}),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to process request."
                );
            }

            setSuccess(result.message);

            await loadData(true);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to process request."
            );

        } finally {
            setProcessingId("");
        }
    }

    /*
    ================================================================
    SUMMARY
    ================================================================
    */

    const pendingCount = requests.filter(
        (request) => request.status === "PENDING"
    ).length;

    const approvedCount = requests.filter(
        (request) => request.status === "APPROVED"
    ).length;

    const releasedCount = requests.filter(
        (request) => request.status === "RELEASED"
    ).length;

    /*
    ================================================================
    LOADING STATE
    ================================================================
    */

    if (loading && !session) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <RefreshCw
                    className="animate-spin text-blue-700"
                    size={28}
                />
            </div>
        );
    }

    /*
    ================================================================
    SESSION ERROR
    ================================================================
    */

    if (!session) {
        return (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
                <p className="text-sm text-red-600">
                    {error || "Unable to load your session."}
                </p>

                <button
                    onClick={() => loadData()}
                    className="mt-4 font-semibold text-blue-700 underline"
                >
                    Try Again
                </button>
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

            {/* PAGE HEADING */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                        <ArrowUpRight size={17} />
                        Cash Management
                    </div>

                    <h1 className="mt-2 text-2xl font-bold text-slate-900">
                        Cash Out
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage withdrawal requests, approvals, and releases.
                    </p>
                </div>

                <div className="flex flex-col gap-2 min-[400px]:flex-row">
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

                        Refresh
                    </button>

                    {!isOwner && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                            <Plus size={18} />
                            Request Cash Out
                        </button>
                    )}
                </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {success}
                </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <CashOutSummaryCard
                    title="Total Requests"
                    value={requests.length}
                    icon={<Banknote size={20} />}
                />

                <CashOutSummaryCard
                    title="Pending"
                    value={pendingCount}
                    icon={<Clock size={20} />}
                />

                <CashOutSummaryCard
                    title="Approved"
                    value={approvedCount}
                    icon={<CheckCircle size={20} />}
                />

                <CashOutSummaryCard
                    title="Released"
                    value={releasedCount}
                    icon={<Wallet size={20} />}
                />
            </div>

            {/* AVAILABLE ACCOUNT BALANCES */}
            {isOwner && (
                <CashOutAccountBalances accounts={accounts} />
            )}

            {/* WITHDRAWAL REQUESTS */}
            <WithdrawalRequests
                requests={requests}
                isOwner={isOwner}
                processingId={processingId}
                onProcess={processRequest}
            />

            {/* WITHDRAWAL REQUEST MODAL */}
            <WithdrawalRequestModal
                open={showForm}
                accounts={accounts}
                accountId={accountId}
                amount={amount}
                purpose={purpose}
                submitting={submitting}
                onAccountChange={setAccountId}
                onAmountChange={setAmount}
                onPurposeChange={setPurpose}
                onSubmit={submitRequest}
                onClose={() => setShowForm(false)}
            />
        </div>
    );
}