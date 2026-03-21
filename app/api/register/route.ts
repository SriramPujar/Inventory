import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { businessName, adminName, email, password } = await req.json();

        if (!businessName || !adminName || !email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Check if email already exists
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (!snapshot.empty) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to create Business and Admin
        const result = await db.runTransaction(async (t) => {
            // Create Business Document
            const businessRef = db.collection('businesses').doc();
            t.set(businessRef, {
                name: businessName,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Create User Document
            const userRef = db.collection('users').doc();
            t.set(userRef, {
                name: adminName,
                email,
                password: hashedPassword,
                role: "ADMIN",
                businessId: businessRef.id,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return { businessId: businessRef.id, userId: userRef.id };
        });

        return NextResponse.json({ success: true, businessId: result.businessId });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
