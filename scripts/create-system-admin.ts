
import dotenv from "dotenv";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";

dotenv.config({
    path: path.resolve(process.cwd(), ".env.local"),
});

async function main() {
    // Load the database only after .env.local has been loaded.
    const { pool } = await import("../lib/db");

    const rl = readline.createInterface({
        input,
        output,
    });

    try {
        console.log("\n================================");
        console.log(" CASHFLOW SYSTEM ADMIN SETUP");
        console.log("================================\n");

        const fullName = (
            await rl.question("Full name: ")
        ).trim();

        const email = (
            await rl.question("Email: ")
        ).trim().toLowerCase();

        const password = await rl.question("Password: ");

        if (!fullName || !email || !password) {
            throw new Error("All fields are required.");
        }

        if (password.length < 12) {
            throw new Error(
                "Password must be at least 12 characters."
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `
            INSERT INTO system_admins (
                full_name,
                email,
                password_hash
            )
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING id, full_name, email
            `,
            [fullName, email, passwordHash]
        );

        if (result.rowCount === 0) {
            throw new Error(
                "An account with this email already exists."
            );
        }

        console.log("\nSystem Administrator created successfully!");
        console.log("Name:", result.rows[0].full_name);
        console.log("Email:", result.rows[0].email);

    } finally {
        rl.close();
        await pool.end();
    }
}

main().catch((error) => {
    console.error("\nSetup failed:", error.message);
    process.exitCode = 1;
});
