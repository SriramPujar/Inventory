import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays } from "date-fns";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const businessId = session.user.businessId;
        const now = new Date();

        // Total Revenue (Online vs Offline)
        const products = await prisma.product.findMany({
            where: { businessId },
        });

        const totalRevenue = products.reduce((acc, curr) => acc + curr.amount, 0);
        const onlineRevenue = products.filter(p => p.paymentMethod === "ONLINE").reduce((acc, curr) => acc + curr.amount, 0);
        const offlineRevenue = products.filter(p => p.paymentMethod === "OFFLINE").reduce((acc, curr) => acc + curr.amount, 0);

        // Sales Trends (Last 7 days)
        const salesTrends = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(now, i);
            const start = startOfDay(date);
            const end = endOfDay(date);

            const daySales = products.filter(p => p.date >= start && p.date <= end);
            salesTrends.push({
                date: date.toLocaleDateString(),
                amount: daySales.reduce((acc, curr) => acc + curr.amount, 0),
                count: daySales.length
            });
        }

        // Worker Performance
        const workers = await prisma.user.findMany({
            where: { businessId, role: "WORKER" },
            include: {
                sales: true,
                assignedOrders: true
            }
        });

        const workerPerformance = workers.map(w => ({
            name: w.name,
            totalSales: w.sales.reduce((acc, curr) => acc + curr.amount, 0),
            completedOrders: w.assignedOrders.filter(o => o.status === "COMPLETED").length,
            pendingOrders: w.assignedOrders.filter(o => o.status === "PENDING").length
        }));

        // Order Stats
        const orders = await prisma.order.findMany({ where: { businessId } });
        const orderStats = {
            total: orders.length,
            pending: orders.filter(o => o.status === "PENDING").length,
            completed: orders.filter(o => o.status === "COMPLETED").length,
            inProgress: orders.filter(o => o.status === "IN_PROGRESS").length
        };

        return NextResponse.json({
            totalRevenue,
            onlineRevenue,
            offlineRevenue,
            salesTrends,
            workerPerformance,
            orderStats
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
