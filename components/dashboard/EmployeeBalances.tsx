import { Users, ArrowUpRight } from "lucide-react";

const employees = [
  {
    name: "Juan Dela Cruz",
    role: "Cashier",
    initials: "JD",
    balance: 25000,
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Maria Santos",
    role: "Collection Officer",
    initials: "MS",
    balance: 18500,
    color: "bg-orange-100 text-orange-700",
  },
  {
    name: "Pedro Reyes",
    role: "Field Collector",
    initials: "PR",
    balance: 12000,
    color: "bg-green-100 text-green-700",
  },
  {
    name: "Ana Garcia",
    role: "Cashier",
    initials: "AG",
    balance: 8500,
    color: "bg-purple-100 text-purple-700",
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export default function EmployeeBalances() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">
            Employee Cash Balances
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Current funds assigned to employees
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Users size={20} />
        </div>
      </div>

      <div className="space-y-4">
        {employees.map((employee) => (
          <div
            key={employee.name}
            className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${employee.color}`}
              >
                {employee.initials}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {employee.name}
                </p>
                <p className="text-xs text-slate-500">
                  {employee.role}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">
                {formatCurrency(employee.balance)}
              </p>
              <p className="text-[10px] font-medium text-green-600">
                Available balance
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
        View All Employees
        <ArrowUpRight size={16} />
      </button>
    </div>
  );
}