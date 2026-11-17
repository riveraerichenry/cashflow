
"use client";

import {
    X,
    User,
    CalendarDays,
    Banknote,
} from "lucide-react";

import {
    WithdrawalRequest,
    currency,
    formatDate,
    statusStyles,
} from "./types";

type Props = {
    request: WithdrawalRequest | null;
    processing: boolean;
    onClose: () => void;
    onApprove: (request: WithdrawalRequest) => void;
    onReject: (request: WithdrawalRequest) => void;
    onRelease: (request: WithdrawalRequest) => void;
};

export default function ApprovalDetailsModal({
    request,
    processing,
    onClose,
    onApprove,
    onReject,
    onRelease,
}: Props) {
    if (!request) return null;

    const approverName = request.approver_first_name
        ? `${request.approver_first_name} ${request.approver_last_name || ""}`
        : "Not yet processed";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !processing) {
                    onClose();
                }
            }}
        >
            <div className="my-auto max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                {/* HEADER */}

                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 sm:px-5">
                    <div className="min-w-0">
                        <h2 className="font-bold text-gray-900">
                            Withdrawal Details
                        </h2>

                        <p className="mt-1 break-all text-xs text-gray-500">
                            {request.request_no}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5 p-4 sm:p-5">
                    {/* AMOUNT */}

                    <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">
                            Requested Amount
                        </p>

                        <p className="mt-1 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
                            {currency(request.amount)}
                        </p>

                        <span
                            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                statusStyles[request.status] ||
                                statusStyles.CANCELLED
                            }`}
                        >
                            {request.status}
                        </span>
                    </div>

                    {/* DETAILS */}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">
                                Employee
                            </p>

                            <p className="mt-1 flex items-center gap-2 break-words font-medium text-gray-900">
                                <User size={16} className="shrink-0 text-gray-400" />

                                {request.employee_first_name}{" "}
                                {request.employee_last_name}
                            </p>

                            <p className="mt-1 break-all text-xs text-gray-500">
                                @{request.employee_username}
                            </p>
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">
                                Cash Account
                            </p>

                            <p className="mt-1 break-words font-medium text-gray-900">
                                {request.account_name}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                {request.account_type}
                            </p>
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">
                                Requested At
                            </p>

                            <p className="mt-1 flex items-start gap-2 text-sm font-medium text-gray-900">
                                <CalendarDays
                                    size={15}
                                    className="mt-0.5 shrink-0 text-gray-400"
                                />

                                {formatDate(request.requested_at)}
                            </p>
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">
                                Approved / Rejected By
                            </p>

                            <p className="mt-1 break-words text-sm font-medium text-gray-900">
                                {approverName}
                            </p>

                            {request.approved_at && (
                                <p className="mt-1 text-xs text-gray-500">
                                    {formatDate(request.approved_at)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* PURPOSE */}

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Purpose
                        </p>

                        <p className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-gray-200 p-3 text-sm text-gray-800">
                            {request.purpose || "No purpose provided."}
                        </p>
                    </div>

                    {/* REJECTION REASON */}

                    {request.rejection_reason && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                Rejection Reason
                            </p>

                            <p className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                                {request.rejection_reason}
                            </p>
                        </div>
                    )}

                    {/* RELEASED TRANSACTION */}

                    {request.released_transaction_id && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                Released Transaction ID
                            </p>

                            <p className="mt-2 break-all rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                                {request.released_transaction_id}
                            </p>
                        </div>
                    )}
                </div>

                {/* FOOTER */}

                <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-white px-4 py-4 sm:px-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Close
                    </button>

                    {request.status === "PENDING" && (
                        <>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => onReject(request)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                Reject
                            </button>

                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => onApprove(request)}
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                Approve
                            </button>
                        </>
                    )}

                    {request.status === "APPROVED" && (
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => onRelease(request)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Banknote size={16} />
                            Release Funds
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
