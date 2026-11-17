import { ReactNode } from "react";

type Props = {
    title: string;
    value: number;
    icon: ReactNode;
};

export default function CashOutSummaryCard({
    title,
    value,
    icon,
}: Props) {
    return (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                    {title}
                </p>

                <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-700">
                    {icon}
                </div>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
                {value.toLocaleString("en-PH")}
            </p>
        </div>
    );
}