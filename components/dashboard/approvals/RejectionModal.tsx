
"use client";

import { X, XCircle, Loader2 } from "lucide-react";

import {
    WithdrawalRequest,
    currency,
} from "./types";

type Props = {
    request: WithdrawalRequest | null;
    reason: string;
    processing: boolean;
    onReasonChange: (value: string) => void;
    onClose: () => void;
    onSubmit: () => void;
};

export default function RejectionModal({
    request,
    reason,
    processing,
    onReasonChange,
    onClose,
    onSubmit,
}: Props) {
    if (!request) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !processing) {
                    onClose();
                }
            }}
        >
            <div className="my-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-5">
                    <div className="min-w-0">
                        <h2 className="font-bold text-gray-900">
                            Reject Withdrawal
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

                {/* BODY */}

                <div className="space-y-4 p-4 sm:p-5">
                    <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                            Employee
                        </p>

                        <p className="break-words font-semibold text-gray-900">
                            {request.employee_first_name}{" "}
                            {request.employee_last_name}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                            Requested Amount
                        </p>

                        <p className="font-bold text-gray-900">
                            {currency(request.amount)}
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            Rejection Reason
                        </label>

                        <textarea
                            value={reason}
                            onChange={(event) =>
                                onReasonChange(event.target.value)
                            }
                            rows={4}
                            maxLength={1000}
                            placeholder="Explain why this withdrawal request is being rejected..."
                            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <p className="mt-1 text-right text-xs text-gray-400">
                            {reason.length}/1000
                        </p>

                        {reason.trim().length > 0 &&
                            reason.trim().length < 3 && (
                                <p className="mt-1 text-xs text-red-600">
                                    Please enter at least 3 characters.
                                </p>
                            )}
                    </div>
                </div>

                {/* FOOTER */}

                <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-4 py-4 sm:px-5">
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={processing || reason.trim().length < 3}
                        onClick={onSubmit}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <XCircle size={16} />
                        )}

                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
    );
}
