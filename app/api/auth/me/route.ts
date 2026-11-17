
import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee-auth";

export const runtime = "nodejs";

export async function GET() {
    try {
        const session = await getEmployeeSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Not authenticated.",
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            employee: session,
        });

    } catch (error) {
        console.error("EMPLOYEE SESSION ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to verify session.",
            },
            { status: 500 }
        );
    }
}
