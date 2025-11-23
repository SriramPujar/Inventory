import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { businessName, adminName, email, password } = await req.json();

        if (!businessName || !adminName || !email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to create Business and Admin
        const result = await prisma.$transaction(async (tx) => {
            const business = await tx.business.create({
                data: {
                    name: businessName,
                },
            });

            const user = await tx.user.create({
                data: {
                    name: adminName,
                    email,
                    password: hashedPassword,
                    role: "ADMIN",
                    businessId: business.id,
                },
            });

            return { business, user };
        });

        return NextResponse.json({ success: true, businessId: result.business.id });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
