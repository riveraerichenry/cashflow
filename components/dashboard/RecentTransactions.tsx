import {
  ArrowDownCircle,
  ArrowUpCircle,
  Send,
  ArrowRight,
} from "lucide-react";

const transactions = [
  {
    id: "TRX-1001",
    description: "Cash received",
    person: "Juan Dela Cruz",
    type: "Cash In",
    amount: 15000,
    date: "Today, 09:30 AM",
    icon: ArrowDownCircle,
    color: "text-orange-600",
    bg: "bg-orange-100",
    amountColor: "text-green-600",
    sign: "+",
  },
  {
    id: "TRX-1002",
    description: "Cash withdrawal",
    person: "Maria Santos",
    type: "Cash Out",
    amount: 5000,
    date: "Today, 10:15 AM",
    icon: ArrowUpCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    amountColor: "text-red-600",
    sign: "-",
  },
  {
    id: "TRX-1003",
    description: "Employee remittance",
    person: "Pedro Reyes",
    type: "Remittance",
    amount: 8000,
    date: "Today, 11:00 AM",
    icon: Send,
    color: "text-blue-600",
    bg: "bg-blue-100",
    amountColor: "text-slate-800",
    sign: "",
  },
  {
    id: "TRX-1004",
    description: "Cash received",
    person: "Ana Garcia",
    type: "Cash In",
    amount: 12000,
    date: "Today, 01:30 PM",
    icon: ArrowDownCircle,
    color: "text-orange-600",
    bg: "bg-orange-100",
    amountColor: "text-green-600",
    sign: "+",
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export default function RecentTransactions() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">
            Recent Transactions
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Latest cash movements
          </p>
        </div>

        <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">
          View All
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[550px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
              <th className="pb-3 font-semibold">Transaction</th>
              <th className="pb-3 font-semibold">Employee</th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => {
              const Icon = transaction.icon;

              return (
                <tr
                  key={transaction.id}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${transaction.bg}`}
                      >
                        <Icon
                          size={18}
                          className={transaction.color}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {transaction.description}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {transaction.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 text-sm text-slate-600">
                    {transaction.person}
                  </td>

                  <td className="py-4 text-xs text-slate-500">
                    {transaction.date}
                  </td>

                  <td
                    className={`py-4 text-right text-sm font-bold ${transaction.amountColor}`}
                  >
                    {transaction.sign}
                    {formatCurrency(transaction.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}