
import { redirect } from "next/navigation";

import { getEmployeeSession } from "@/lib/employee-auth";

import DashboardOverview from "@/components/dashboard/DashboardOverview";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";

export default async function DashboardPage() {
    const session = await getEmployeeSession();

    if (!session) {
        redirect("/login");
    }

    if (session.mustChangePassword) {
        redirect("/change-password");
    }

    const isEmployee = session.role === "EMPLOYEE";

    return (
        <div className="w-full min-w-0">
            {isEmployee ? (
                <EmployeeDashboard
                    firstName={session.firstName}
                    businessName={session.businessName}
                />
            ) : (
                <DashboardOverview
                    businessName={session.businessName}
                    firstName={session.firstName}
                    role={session.role}
                />
            )}
        </div>
    );
}
