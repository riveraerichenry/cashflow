
"use client";

import { ArrowDownUp, X } from "lucide-react";
import type { Transfer } from "./TransferTable";

type Props = {
    transfer: Transfer | null;
    onClose: () => void;
};

function currency(value: number) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value || 0);
}

function formatDate(value: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function Detail({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    return (
        <div>
            <p className="text-xs font-medium text-slate-400">
                {label}
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {value || "—"}
            </p>
        </div>
    );
}

export default function TransferDetailsModal({
    transfer,
    onClose,
}: Props) {
    if (!transfer) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
                            <ArrowDownUp size={22} />
                        </div>

                        <div>
                            <h2 className="font-bold text-slate-800">
                                Transfer Details
                            </h2>

                            <p className="text-xs text-slate-500">
                                Internal account movement
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[75vh] space-y-6 overflow-y-auto p-5 sm:p-6">

                    <div className="rounded-2xl bg-blue-50 p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                            Transfer Amount
                        </p>

                        <p className="mt-2 text-3xl font-bold text-blue-800">
                            {currency(transfer.amount)}
                        </p>

                        <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                            {transfer.transactionNo}
                        </p>

                        <span className="mt-3 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            {transfer.status}
                        </span>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-bold text-slate-800">
                            Transfer Movement
                        </h3>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-slate-400">
                                        Source Account
                                    </p>

                                    <p className="mt-1 font-semibold text-slate-800">
                                        {transfer.fromAccountName}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        {transfer.fromAccountType}
                                    </p>
                                </div>

                                <p className="font-bold text-red-600">
                                    −{currency(transfer.amount)}
                                </p>
                            </div>

                            <div className="my-4 border-t border-dashed border-slate-200" />

                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-slate-400">
                                        Destination Account
                                    </p>

                                    <p className="mt-1 font-semibold text-slate-800">
                                        {transfer.toAccountName}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        {transfer.toAccountType}
                                    </p>
                                </div>

                                <p className="font-bold text-green-600">
                                    +{currency(transfer.amount)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-bold text-slate-800">
                            Transaction Information
                        </h3>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Detail
                                label="Transaction Date"
                                value={formatDate(transfer.transactionDate)}
                            />

                            <Detail
                                label="Transaction Number"
                                value={transfer.transactionNo}
                            />

                            <Detail
                                label="Reference Number"
                                value={transfer.referenceNo}
                            />

                            <Detail
                                label="Created By"
                                value={transfer.createdByName}
                            />

                            <Detail
                                label="Remarks"
                                value={transfer.description}
                            />

                            <Detail
                                label="Posted At"
                                value={formatDate(transfer.createdAt)}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <p className="text-sm font-semibold text-blue-800">
                            Internal Transfer
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-blue-700">
                            This transaction moves funds between two accounts.
                            It does not create additional business income or
                            reduce total business funds.
                        </p>
                    </div>

                </div>

                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-right sm:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
