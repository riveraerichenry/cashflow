import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const summaryData = [
  {
    title: "Total Business Cash",
    amount: "₱250,000.00",
    description: "Available business funds",
    icon: Wallet,
    iconColor: "text-blue-700",
    iconBg: "bg-blue-100",
    trend: "Overall cash balance",
    trendColor: "text-blue-700",
  },
  {
    title: "Total Cash In",
    amount: "₱125,000.00",
    description: "Cash received today",
    icon: ArrowDownCircle,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
    trend: "Today's collections",
    trendColor: "text-orange-600",
  },
  {
    title: "Total Cash Out",
    amount: "₱45,000.00",
    description: "Cash released today",
    icon: ArrowUpCircle,
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
    trend: "Today's disbursements",
    trendColor: "text-red-600",
  },
  {
    title: "Employee Cash",
    amount: "₱80,000.00",
    description: "Cash currently assigned",
    icon: Users,
    iconColor: "text-green-700",
    iconBg: "bg-green-100",
    trend: "Across all employees",
    trendColor: "text-green-700",
  },
];

export default function SummaryCards() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {summaryData.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {item.title}
                </p>

                <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-800">
                  {item.amount}
                </h3>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg}`}
              >
                <Icon size={24} className={item.iconColor} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-500">
                {item.description}
              </span>

              <span
                className={`text-[11px] font-semibold ${item.trendColor}`}
              >
                {item.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}