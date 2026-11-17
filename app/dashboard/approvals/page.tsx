
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    X,
    RefreshCw,
    Loader2,
} from "lucide-react";

import ApprovalSummaryCards from "@/components/dashboard/approvals/ApprovalSummaryCards";
import ApprovalTable from "@/components/dashboard/approvals/ApprovalTable";
import ApprovalDetailsModal from "@/components/dashboard/approvals/ApprovalDetailsModal";
import RejectionModal from "@/components/dashboard/approvals/RejectionModal";

import {
    WithdrawalRequest,
    ProcessingAction,
    currency,
} from "@/components/dashboard/approvals/types";

export default function ApprovalCenterPage() {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [processingId, setProcessingId] = useState<string | null>(null);

    const [selectedRequest, setSelectedRequest] =
        useState<WithdrawalRequest | null>(null);

    const [rejectingRequest, setRejectingRequest] =
        useState<WithdrawalRequest | null>(null);

    const [rejectionReason, setRejectionReason] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /*
    ================================================================
    LOAD REQUESTS
    ================================================================
    */

    const loadRequests = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const response = await fetch(
                "/api/dashboard/cash-out",
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

            if (response.status === 401) {
                window.location.href = "/login";
                return;
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to load withdrawal requests."
                );
            }

            setRequests(data.requests || []);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load approval requests."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    /*
    ================================================================
    SUMMARY
    ================================================================
    */

    const counts = useMemo(() => {
        return {
            pending: requests.filter(
                (request) => request.status === "PENDING"
            ).length,

            approved: requests.filter(
                (request) => request.status === "APPROVED"
            ).length,

            released: requests.filter(
                (request) => request.status === "RELEASED"
            ).length,

            rejected: requests.filter(
                (request) => request.status === "REJECTED"
            ).length,
        };
    }, [requests]);

    const totalPendingAmount = useMemo(() => {
        return requests
            .filter((request) => request.status === "PENDING")
            .reduce(
                (sum, request) => sum + Number(request.amount),
                0
            );
    }, [requests]);

    /*
    ================================================================
    PROCESS ACTION
    ================================================================
    */

    const processAction = async (
        request: WithdrawalRequest,
        action: ProcessingAction,
        reason?: string
    ) => {
        if (processingId) return;

        setProcessingId(request.id);
        setError("");
        setSuccess("");

        try {
            const body =
                action === "REJECT"
                    ? {
                        action,
                        rejectionReason: reason,
                    }
                    : {
                        action,
                    };

            const response = await fetch(
                `/api/dashboard/cash-out/${request.id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to process this request."
                );
            }

            setSuccess(
                data.message || "Request processed successfully."
            );

            setSelectedRequest(null);
            setRejectingRequest(null);
            setRejectionReason("");

            await loadRequests(true);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred."
            );
        } finally {
            setProcessingId(null);
        }
    };

    /*
    ================================================================
    APPROVE
    ================================================================
    */

    const handleApprove = async (
        request: WithdrawalRequest
    ) => {
        const confirmed = window.confirm(
            `Approve withdrawal request ${request.request_no} for ${currency(request.amount)}?`
        );

        if (!confirmed) return;

        await processAction(request, "APPROVE");
    };

    /*
    ================================================================
    RELEASE
    ================================================================
    */

    const handleRelease = async (
        request: WithdrawalRequest
    ) => {
        const confirmed = window.confirm(
            `Release ${currency(request.amount)} from ${request.account_name}?\n\nThis will post the withdrawal and deduct the amount from the account balance.`
        );

        if (!confirmed) return;

        await processAction(request, "RELEASE");
    };

    /*
    ================================================================
    OPEN REJECTION MODAL
    ================================================================
    */

    const openRejectModal = (
        request: WithdrawalRequest
    ) => {
        setSelectedRequest(null);
        setRejectingRequest(request);
        setRejectionReason("");
        setError("");
    };

    /*
    ================================================================
    REJECT
    ================================================================
    */

    const handleReject = async () => {
        if (!rejectingRequest) return;

        const reason = rejectionReason.trim();

        if (reason.length < 3) {
            setError("Please provide a rejection reason.");
            return;
        }

        await processAction(
            rejectingRequest,
            "REJECT",
            reason
        );
    };

    /*
    ================================================================
    LOADING STATE
    ================================================================
    */

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center">
                    <Loader2
                        size={32}
                        className="mx-auto animate-spin text-blue-600"
                    />

                    <p className="mt-3 text-sm text-gray-500">
                        Loading approval center...
                    </p>
                </div>
            </div>
        );
    }

    /*
    ================================================================
    PAGE
    ================================================================
    */

    return (
        <div className="w-full min-w-0 space-y-6">

            {/* HEADER */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Approval Center
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Review, approve, reject, and release employee withdrawal requests.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => loadRequests(true)}
                    disabled={refreshing || loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw
                        size={16}
                        className={refreshing ? "animate-spin" : ""}
                    />

                    Refresh
                </button>
            </div>

            {/* ERROR */}

            {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                    />

                    <span className="min-w-0 flex-1 break-words">
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        className="shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* SUCCESS */}

            {success && (
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0"
                    />

                    <span className="min-w-0 flex-1 break-words">
                        {success}
                    </span>

                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                        className="shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* SUMMARY CARDS */}

            <ApprovalSummaryCards
                pending={counts.pending}
                approved={counts.approved}
                released={counts.released}
                rejected={counts.rejected}
                totalPendingAmount={totalPendingAmount}
            />

            {/* REQUEST TABLE */}

            <ApprovalTable
                requests={requests}
                loading={loading}
                processingId={processingId}
                onView={setSelectedRequest}
                onApprove={handleApprove}
                onReject={openRejectModal}
                onRelease={handleRelease}
            />

            {/* DETAILS MODAL */}

            <ApprovalDetailsModal
                request={selectedRequest}
                processing={!!processingId}
                onClose={() => setSelectedRequest(null)}
                onApprove={handleApprove}
                onReject={openRejectModal}
                onRelease={handleRelease}
            />

            {/* REJECTION MODAL */}

            <RejectionModal
                request={rejectingRequest}
                reason={rejectionReason}
                processing={!!processingId}
                onReasonChange={setRejectionReason}
                onClose={() => {
                    setRejectingRequest(null);
                    setRejectionReason("");
                }}
                onSubmit={handleReject}
            />

            {/* PROCESSING INDICATOR */}

            {processingId && (
                <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
                    <Loader2
                        size={17}
                        className="animate-spin"
                    />

                    Processing withdrawal...
                </div>
            )}
        </div>
    );
}
