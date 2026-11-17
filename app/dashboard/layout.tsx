import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getEmployeeSession } from "@/lib/employee-auth";
import DashboardShell from "@/components/layout/DashboardShell";

type Props = {
    children: ReactNode;
};

export default async function DashboardLayout({
    children,
}: Props) {
    const session = await getEmployeeSession();

    if (!session) {
        redirect("/login");
    }

    if (session.mustChangePassword) {
        redirect("/change-password");
    }

    return (
        <DashboardShell
            firstName={session.firstName}
            lastName={session.lastName}
            role={session.role}
            businessName={session.businessName}
            businessCode={session.businessCode}
        >
            {children}
        </DashboardShell>
    );
}
