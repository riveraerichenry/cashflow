"use client";

import {
    Send,
    RefreshCw,
} from "lucide-react";

import { FormEvent } from "react";
import { Account, money } from "./types";

type Props = {
    sourceAccounts: Account[];
    destinationAccounts: Account[];
    sourceAccountId: string;
    destinationAccountId: string;
    amount: string;
    purpose: string;
    referenceNo: string;
    submitting: boolean;

    onSourceChange: (value: string) => void;
    onDestinationChange: (value: string) => void;
    onAmountChange: (value: string) => void;
    onPurposeChange: (value: string) => void;
    onReferenceChange: (value: string) => void;

    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function RemittanceForm({
    sourceAccounts,
    destinationAccounts,
    sourceAccountId,
    destinationAccountId,
    amount,
    purpose,
    referenceNo,
    submitting,
    onSourceChange,
    onDestinationChange,
    onAmountChange,
    onPurposeChange,
    onReferenceChange,
    onSubmit,
}: Props) {
    const selectedSource = sourceAccounts.find(
        (account) => account.accountId === sourceAccountId
    );

    return (
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-lg bg-blue-100 p-3 text-blue-700">
                        <Send size={21} />
                    </div>

                    <div className="min-w-0">
                        <h2 className="font-bold text-slate-900">
                            Submit a Remittance
                        </h2>

                        <p className="text-sm text-slate-500">
                            Submit money for verification by the Owner.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5 p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* SOURCE ACCOUNT */}

                    <div className="min-w-0">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Source Cash Account *
                        </label>

                        <select
                            required
                            value={sourceAccountId}
                            onChange={(event) =>
                                onSourceChange(event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">
                                Select source account
                            </option>

                            {sourceAccounts.map((account) => (
                                <option
                                    key={account.accountId}
                                    value={account.accountId}
                                >
                                    {account.accountName} — {money(account.balance)}
                                </option>
                            ))}
                        </select>

                        {selectedSource && (
                            <p className="mt-2 text-xs text-slate-500">
                                Available: {money(selectedSource.balance)}
                            </p>
                        )}
                    </div>

                    {/* DESTINATION ACCOUNT */}

                    <div className="min-w-0">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Receiving Account *
                        </label>

                        <select
                            required
                            value={destinationAccountId}
                            onChange={(event) =>
                                onDestinationChange(event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">
                                Select receiving account
                            </option>

                            {destinationAccounts.map((account) => (
                                <option
                                    key={account.accountId}
                                    value={account.accountId}
                                >
                                    {account.accountName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* AMOUNT */}

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Remittance Amount *
                        </label>

                        <input
                            required
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(event) =>
                                onAmountChange(event.target.value)
                            }
                            placeholder="0.00"
                            className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* REFERENCE */}

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Reference Number
                        </label>

                        <input
                            value={referenceNo}
                            onChange={(event) =>
                                onReferenceChange(event.target.value)
                            }
                            maxLength={100}
                            placeholder="Optional reference number"
                            className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* PURPOSE */}

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Purpose / Remarks
                        </label>

                        <textarea
                            value={purpose}
                            onChange={(event) =>
                                onPurposeChange(event.target.value)
                            }
                            maxLength={500}
                            rows={3}
                            placeholder="Enter remittance details..."
                            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                {/* SUBMIT */}

                <div className="flex flex-col justify-between gap-3 rounded-lg bg-blue-50 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 text-sm text-blue-800">
                        <p className="font-semibold">
                            Owner confirmation required
                        </p>

                        <p className="mt-1 text-xs">
                            Your balance will only change after the Owner confirms receipt.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || sourceAccounts.length === 0 || destinationAccounts.length === 0}
                        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        {submitting ? (
                            <RefreshCw size={17} className="animate-spin" />
                        ) : (
                            <Send size={17} />
                        )}

                        {submitting ? "Submitting..." : "Submit Remittance"}
                    </button>
                </div>
            </form>
        </section>
    );
}