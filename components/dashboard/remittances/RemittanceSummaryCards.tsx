import {
    Wallet,
    Clock,
    CheckCircle,
} from "lucide-react";

import { money } from "./types";

type Props = {
    isOwner: boolean;
    pendingCount: number;
    receivedCount: number;
    pendingAmount: number;
    employeeBalance: number;
};

export default function RemittanceSummaryCards({
    isOwner,
    pendingCount,
    receivedCount,
    pendingAmount,
    employeeBalance,
}: Props) {
    const cards = [
        {
            title: isOwner ? "Pending Remittances" : "My Cash Balance",
            value: isOwner ? pendingCount.toLocaleString("en-PH") : money(employeeBalance),
            icon: <Wallet size={22} />,
            color: "bg-blue-100 text-blue-700",
            valueColor: "text-slate-900",
        },
        {
            title: isOwner ? "Pending Amount" : "Pending Requests",
            value: isOwner ? money(pendingAmount) : pendingCount.toLocaleString("en-PH"),
            icon: <Clock size={22} />,
            color: "bg-amber-100 text-amber-700",
            valueColor: "text-amber-600",
        },
        {
            title: "Confirmed Remittances",
            value: receivedCount.toLocaleString("en-PH"),
            icon: <CheckCircle size={22} />,
            color: "bg-green-100 text-green-700",
            valueColor: "text-green-700",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm text-slate-500">
                                {card.title}
                            </p>

                            <h2 className={`mt-2 break-words text-2xl font-bold ${card.valueColor}`}>
                                {card.value}
                            </h2>
                        </div>

                        <div className={`shrink-0 rounded-lg p-3 ${card.color}`}>
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}