
import {
    Banknote,
    CheckCircle2,
    Clock,
    XCircle,
} from "lucide-react";

import { currency } from "./types";

type Props = {
    pending: number;
    approved: number;
    released: number;
    rejected: number;
    totalPendingAmount: number;
};

export default function ApprovalSummaryCards({
    pending,
    approved,
    released,
    rejected,
    totalPendingAmount,
}: Props) {
    const cards = [
        {
            title: "Pending Requests",
            value: pending,
            amount: `${currency(totalPendingAmount)} requested`,
            icon: Clock,
            color: "bg-amber-100 text-amber-700",
        },
        {
            title: "Approved",
            value: approved,
            icon: CheckCircle2,
            color: "bg-blue-100 text-blue-700",
        },
        {
            title: "Released",
            value: released,
            icon: Banknote,
            color: "bg-green-100 text-green-700",
        },
        {
            title: "Rejected",
            value: rejected,
            icon: XCircle,
            color: "bg-red-100 text-red-700",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.title}
                        className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-500">
                                    {card.title}
                                </p>

                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {card.value}
                                </p>

                                {card.amount && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        {card.amount}
                                    </p>
                                )}
                            </div>

                            <div className={`shrink-0 rounded-xl p-3 ${card.color}`}>
                                <Icon size={23} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
