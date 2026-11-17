import {
    Banknote,
    Wallet,
} from "lucide-react";

import { Account, money } from "./types";

type Props = {
    title: string;
    accounts: Account[];
    ownerView?: boolean;
};

export default function RemittanceAccountCards({
    title,
    accounts,
    ownerView = false,
}: Props) {
    return (
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 font-bold text-slate-900">
                {title}
            </h2>

            {accounts.length === 0 ? (
                <div className="rounded-lg bg-slate-50 p-6 text-center">
                    <Wallet className="mx-auto text-slate-400" size={28} />

                    <p className="mt-2 text-sm text-slate-500">
                        No accounts available.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => (
                        <div
                            key={account.accountId}
                            className="min-w-0 rounded-lg border border-slate-200 p-4"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="break-words font-semibold text-slate-800">
                                    {account.accountName}
                                </p>

                                {ownerView ? (
                                    <Banknote
                                        size={19}
                                        className="shrink-0 text-blue-700"
                                    />
                                ) : (
                                    <Wallet
                                        size={18}
                                        className="shrink-0 text-blue-700"
                                    />
                                )}
                            </div>

                            <p className="mt-2 break-words text-xl font-bold text-slate-900">
                                {money(account.balance)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                {account.accountType}
                            </p>

                            {ownerView && account.employeeName && (
                                <p className="mt-2 text-xs text-slate-500">
                                    Assigned to: {account.employeeName}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}