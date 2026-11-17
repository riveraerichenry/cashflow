import { Wallet } from "lucide-react";
import { Account, currency } from "./types";

type Props = {
    accounts: Account[];
};

export default function CashOutAccountBalances({
    accounts,
}: Props) {
    return (
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div>
                <h2 className="font-bold text-slate-900">
                    Available Account Balances
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Check account balances before releasing withdrawals.
                </p>
            </div>

            {accounts.length === 0 ? (
                <div className="mt-5 rounded-xl bg-slate-50 p-6 text-center">
                    <Wallet className="mx-auto text-slate-400" size={28} />

                    <p className="mt-2 text-sm text-slate-500">
                        No active cash accounts found.
                    </p>
                </div>
            ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className="min-w-0 rounded-xl border border-slate-200 p-4"
                        >
                            <p className="break-words font-semibold text-slate-800">
                                {account.account_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                {account.account_type}
                            </p>

                            <p className="mt-3 break-words text-xl font-bold text-slate-900">
                                {currency(account.balance)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}