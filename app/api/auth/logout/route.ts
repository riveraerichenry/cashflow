
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { EMPLOYEE_COOKIE } from "@/lib/employee-auth";

export async function POST() {
    const cookieStore = await cookies();

    cookieStore.set(EMPLOYEE_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    return NextResponse.json({
        success: true,
        message: "Logged out successfully.",
    });
}
