import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const worker = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "WORKER",
                businessId: session.user.businessId,
            },
        });

        return NextResponse.json({ success: true, worker: { id: worker.id, name: worker.name, email: worker.email } });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const workers = await prisma.user.findMany({
            where: {
                businessId: session.user.businessId,
                role: "WORKER",
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                _count: {
                    select: { assignedOrders: true, sales: true }
                }
            },
        });

        return NextResponse.json(workers);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
