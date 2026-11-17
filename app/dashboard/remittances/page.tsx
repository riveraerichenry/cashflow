"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Swal from "sweetalert2";

import {
    RefreshCw,
} from "lucide-react";

import RemittanceSummaryCards from "@/components/dashboard/remittances/RemittanceSummaryCards";
import RemittanceForm from "@/components/dashboard/remittances/RemittanceForm";
import RemittanceRequests from "@/components/dashboard/remittances/RemittanceRequests";
import RemittanceAccountCards from "@/components/dashboard/remittances/RemittanceAccountCards";

import {
    Account,
    ApiData,
    Remittance,
    RemittanceAction,
    Session,
    money,
} from "@/components/dashboard/remittances/types";

export default function RemittancesPage() {
    const [session, setSession] = useState<Session | null>(null);
    const [data, setData] = useState<ApiData | null>(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [sourceAccountId, setSourceAccountId] = useState("");
    const [destinationAccountId, setDestinationAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [purpose, setPurpose] = useState("");
    const [referenceNo, setReferenceNo] = useState("");

    const isOwner = session?.role === "OWNER";

    /*
    ================================================================
    LOAD DATA
    ================================================================
    */

    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const [
                sessionResponse,
                response,
            ] = await Promise.all([
                fetch("/api/auth/me", {
                    cache: "no-store",
                }),

                fetch("/api/dashboard/remittances", {
                    cache: "no-store",
                }),
            ]);

            if (
                sessionResponse.status === 401 ||
                response.status === 401
            ) {
                window.location.href = "/login";
                return;
            }

            const sessionResult = await sessionResponse.json();
            const result = await response.json();

            if (!sessionResponse.ok || !sessionResult.success) {
                throw new Error(
                    "Unable to verify your login session."
                );
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to load remittances."
                );
            }

            setSession(sessionResult.employee);
            setData(result);

        } catch (error) {
            Swal.fire(
                "Unable to Load",
                error instanceof Error
                    ? error.message
                    : "Something went wrong.",
                "error"
            );

        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /*
    ================================================================
    SELECTED SOURCE ACCOUNT
    ================================================================
    */

    const selectedSource = data?.sourceAccounts.find(
        (account: Account) =>
            account.accountId === sourceAccountId
    );

    /*
    ================================================================
    SUMMARY
    ================================================================
    */

    const requests = data?.requests || [];

    const pendingCount = requests.filter(
        (item) => item.status === "PENDING"
    ).length;

    const receivedCount = requests.filter(
        (item) => item.status === "RECEIVED"
    ).length;

    const pendingAmount = requests
        .filter((item) => item.status === "PENDING")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const employeeBalance = (data?.sourceAccounts || []).reduce(
        (sum, account) => sum + Number(account.balance || 0),
        0
    );

    /*
    ================================================================
    SUBMIT REMITTANCE
    ================================================================
    */

    async function submitRemittance(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const parsedAmount = Number(amount);

        if (!sourceAccountId || !destinationAccountId) {
            Swal.fire(
                "Required",
                "Please select both accounts.",
                "warning"
            );
            return;
        }

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            Swal.fire(
                "Invalid Amount",
                "Enter a valid remittance amount.",
                "warning"
            );
            return;
        }

        if (
            Math.round(parsedAmount * 100) !==
            parsedAmount * 100
        ) {
            Swal.fire(
                "Invalid Amount",
                "Amount must have no more than two decimal places.",
                "warning"
            );
            return;
        }

        if (
            parsedAmount >
            Number(selectedSource?.balance || 0)
        ) {
            Swal.fire(
                "Insufficient Balance",
                "The amount exceeds the selected account balance.",
                "warning"
            );
            return;
        }

        if (sourceAccountId === destinationAccountId) {
            Swal.fire(
                "Invalid Accounts",
                "Select two different accounts.",
                "warning"
            );
            return;
        }

        const confirmation = await Swal.fire({
            title: "Submit Remittance?",
            text: `You are submitting ${money(parsedAmount)} for Owner confirmation.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Submit Request",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#1D4ED8",
        });

        if (!confirmation.isConfirmed) return;

        setSubmitting(true);

        try {
            const response = await fetch(
                "/api/dashboard/remittances",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sourceAccountId,
                        destinationAccountId,
                        amount: parsedAmount,
                        purpose,
                        referenceNo,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to submit remittance."
                );
            }

            await Swal.fire(
                "Submitted",
                "Your remittance request is waiting for Owner confirmation.",
                "success"
            );

            setAmount("");
            setPurpose("");
            setReferenceNo("");

            await loadData();

        } catch (error) {
            Swal.fire(
                "Submission Failed",
                error instanceof Error
                    ? error.message
                    : "Something went wrong.",
                "error"
            );

        } finally {
            setSubmitting(false);
        }
    }

    /*
    ================================================================
    PROCESS REMITTANCE
    ================================================================
    */

    async function processRequest(
        request: Remittance,
        action: RemittanceAction
    ) {
        let rejectionReason = "";

        if (action === "REJECT") {
            const result = await Swal.fire({
                title: "Reject Remittance",
                input: "textarea",
                inputLabel: "Reason for rejection",
                inputPlaceholder: "Enter rejection reason...",
                inputValidator: (value) =>
                    !value?.trim()
                        ? "Please provide a reason."
                        : null,
                showCancelButton: true,
                confirmButtonText: "Reject Request",
                confirmButtonColor: "#DC2626",
            });

            if (!result.isConfirmed) return;

            rejectionReason = result.value;
        } else {
            const result = await Swal.fire({
                title: "Confirm Receipt?",
                html: `
                    <div style="text-align:left">
                        <p>Request: <b>${request.requestNo}</b></p>
                        <p>Employee: <b>${request.employeeName}</b></p>
                        <p>Amount: <b>${money(request.amount)}</b></p>
                        <p>From: <b>${request.sourceAccountName}</b></p>
                        <p>To: <b>${request.destinationAccountName}</b></p>
                    </div>
                    <p style="margin-top:12px;font-size:13px">
                        Confirm only after physically verifying the money received.
                    </p>
                `,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Confirm Receipt",
                confirmButtonColor: "#15803D",
            });

            if (!result.isConfirmed) return;
        }

        try {
            const response = await fetch(
                `/api/dashboard/remittances/${request.id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action,
                        rejectionReason,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to process request."
                );
            }

            await Swal.fire(
                action === "CONFIRM"
                    ? "Remittance Received"
                    : "Request Rejected",
                result.message,
                "success"
            );

            await loadData();

        } catch (error) {
            Swal.fire(
                "Processing Failed",
                error instanceof Error
                    ? error.message
                    : "Something went wrong.",
                "error"
            );
        }
    }

    /*
    ================================================================
    LOADING
    ================================================================
    */

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center">
                    <RefreshCw
                        className="mx-auto animate-spin text-blue-700"
                        size={32}
                    />

                    <p className="mt-3 text-sm text-slate-500">
                        Loading remittance information...
                    </p>
                </div>
            </div>
        );
    }

    /*
    ================================================================
    ERROR
    ================================================================
    */

    if (!data || !session) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                Unable to load remittance information.

                <button
                    onClick={loadData}
                    className="ml-3 font-semibold underline"
                >
                    Retry
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

            {/* HEADER */}

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Remittance Management
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {isOwner
                            ? "Review, verify, and confirm employee remittances."
                            : "Submit cash remittances and monitor your requests."}
                    </p>
                </div>

                <button
                    onClick={loadData}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* SUMMARY */}

            <RemittanceSummaryCards
                isOwner={isOwner}
                pendingCount={pendingCount}
                receivedCount={receivedCount}
                pendingAmount={pendingAmount}
                employeeBalance={employeeBalance}
            />

            {/* EMPLOYEE FORM */}

            {!isOwner && (
                <RemittanceForm
                    sourceAccounts={data.sourceAccounts}
                    destinationAccounts={data.destinationAccounts}
                    sourceAccountId={sourceAccountId}
                    destinationAccountId={destinationAccountId}
                    amount={amount}
                    purpose={purpose}
                    referenceNo={referenceNo}
                    submitting={submitting}
                    onSourceChange={setSourceAccountId}
                    onDestinationChange={setDestinationAccountId}
                    onAmountChange={setAmount}
                    onPurposeChange={setPurpose}
                    onReferenceChange={setReferenceNo}
                    onSubmit={submitRemittance}
                />
            )}

            {/* OWNER RECEIVING ACCOUNTS */}

            {isOwner && (
                <RemittanceAccountCards
                    title="Business Receiving Accounts"
                    accounts={data.destinationAccounts}
                    ownerView
                />
            )}

            {/* REQUEST HISTORY */}

            <RemittanceRequests
                requests={requests}
                isOwner={isOwner}
                onProcess={processRequest}
            />

            {/* EMPLOYEE ACCOUNTS */}

            {!isOwner && (
                <RemittanceAccountCards
                    title="My Assigned Cash Accounts"
                    accounts={data.sourceAccounts}
                />
            )}
        </div>
    );
}