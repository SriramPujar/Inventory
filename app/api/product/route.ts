import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { customerName, productName, date, amount, paymentMethod } = await req.json();

        const product = await prisma.product.create({
            data: {
                customerName,
                productName,
                date: new Date(date),
                amount: parseFloat(amount),
                paymentMethod,
                createdById: session.user.id,
                businessId: session.user.businessId,
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const whereClause: any = {
            businessId: session.user.businessId,
        };

        if (session.user.role === "WORKER") {
            whereClause.createdById = session.user.id;
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            include: { createdBy: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, ...updates } = await req.json();

        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (session.user.role === "WORKER" && product.createdById !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Admin can edit any, Worker can edit own
        const updated = await prisma.product.update({
            where: { id },
            data: {
                ...updates,
                amount: updates.amount ? parseFloat(updates.amount) : undefined,
                date: updates.date ? new Date(updates.date) : undefined
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (session.user.role === "WORKER" && product.createdById !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.product.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
