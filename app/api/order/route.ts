import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { customerName, orderName, date, location, ceremonyDates, amount, workerAmount, workerId, workerName } = body;

        const order = await prisma.order.create({
            data: {
                customerName,
                orderName,
                date: new Date(date),
                location,
                ceremonyDates: JSON.stringify(ceremonyDates), // Assuming array or object
                amount: parseFloat(amount),
                workerAmount: workerAmount ? parseFloat(workerAmount) : 0,
                workerId: workerId || null,
                workerName: workerName || null,
                businessId: session.user.businessId,
                status: "PENDING"
            },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const whereClause: any = {
            businessId: session.user.businessId,
        };

        if (session.user.role === "WORKER") {
            // Worker sees orders assigned to them (by ID) or maybe by Name if we match string?
            // Requirement: "Workers can see which orders they are responsible for"
            // We'll assume strict ID matching if assigned via system, or maybe loose name matching?
            // Let's stick to ID for security, or if ID is null, maybe they can claim it?
            // Requirement: "Accept/claim orders: Workers can choose which available orders to take"
            // So they should see orders that are assigned to them OR (maybe) unassigned ones?
            // "View assigned orders" implies they see what's theirs.
            // "Accept/claim orders" implies they see a pool of unassigned orders.

            whereClause.OR = [
                { workerId: session.user.id },
                { workerId: null } // Allow seeing unassigned orders to claim
            ];
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: { worker: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, status, workerId, ...updates } = await req.json();

        // Check permissions
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (session.user.role === "WORKER") {
            // Worker can only update status or claim (update workerId if null)
            if (order.workerId && order.workerId !== session.user.id) {
                return NextResponse.json({ error: "Not authorized to edit this order" }, { status: 403 });
            }

            // If claiming
            if (!order.workerId && workerId === session.user.id) {
                // Allowed
            } else if (order.workerId === session.user.id) {
                // Allowed to update status
            } else {
                // If trying to update other fields?
                // Requirement: "Update order status"
                // "Edit their own entries" -> This usually refers to Products they added, but maybe Order details?
                // Let's restrict Worker to Status and Claiming for now.
            }

            const updateData: any = {};
            if (status) updateData.status = status;
            if (workerId && !order.workerId) updateData.workerId = workerId; // Claiming

            const updated = await prisma.order.update({
                where: { id },
                data: updateData
            });
            return NextResponse.json(updated);
        }

        // Admin can update everything
        const updated = await prisma.order.update({
            where: { id },
            data: { ...updates, status, workerId }
        });
        return NextResponse.json(updated);

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
