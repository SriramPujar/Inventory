import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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

        // Fetch Products
        const productsSnapshot = await db.collection('products')
            .where('businessId', '==', businessId)
            .get();

        const products = productsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                // Convert Firestore Timestamps to Dates
                date: data.date.toDate ? data.date.toDate() : new Date(data.date),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || now),
            };
        });

        // Total Revenue (Online vs Offline)
        const totalRevenue = products.reduce((acc, curr: any) => acc + (curr.amount || 0), 0);
        const onlineRevenue = products.filter((p: any) => p.paymentMethod === "ONLINE").reduce((acc, curr: any) => acc + (curr.amount || 0), 0);
        const offlineRevenue = products.filter((p: any) => p.paymentMethod === "OFFLINE").reduce((acc, curr: any) => acc + (curr.amount || 0), 0);

        // Sales Trends (Last 7 days)
        const salesTrends = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(now, i);
            const start = startOfDay(date);
            const end = endOfDay(date);

            const daySales = products.filter((p: any) => p.date >= start && p.date <= end);
            salesTrends.push({
                date: date.toLocaleDateString(),
                amount: daySales.reduce((acc, curr: any) => acc + (curr.amount || 0), 0),
                count: daySales.length
            });
        }

        // Fetch Workers
        const workersSnapshot = await db.collection('users')
            .where('businessId', '==', businessId)
            .where('role', '==', 'WORKER')
            .get();

        const workers = workersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch Orders
        const ordersSnapshot = await db.collection('orders')
            .where('businessId', '==', businessId)
            .get();

        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Worker Performance
        // Note: In Firestore, we don't have "include" relations. We have to manually join.
        // We already have all products and orders for the business, so we can filter in memory.

        const workerPerformance = workers.map((w: any) => {
            // Sales by this worker (assuming products have createdById)
            const workerSales = products.filter((p: any) => p.createdById === w.id);

            // Orders assigned to this worker
            const workerOrders = orders.filter((o: any) => o.workerId === w.id);

            return {
                name: w.name,
                totalSales: workerSales.reduce((acc, curr: any) => acc + (curr.amount || 0), 0),
                completedOrders: workerOrders.filter((o: any) => o.status === "COMPLETED").length,
                pendingOrders: workerOrders.filter((o: any) => o.status === "PENDING").length
            };
        });

        // Order Stats
        const orderStats = {
            total: orders.length,
            pending: orders.filter((o: any) => o.status === "PENDING").length,
            completed: orders.filter((o: any) => o.status === "COMPLETED").length,
            inProgress: orders.filter((o: any) => o.status === "IN_PROGRESS").length
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
        console.error("Dashboard Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
