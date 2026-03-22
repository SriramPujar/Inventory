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

        // Optimized Aggregated Queries
        const [
            productsCount,
            workersCount,
            ordersTotal,
            ordersPending,
            ordersCompleted,
            ordersInProgress,
            revenueData
        ] = await Promise.all([
            db.collection('products').where('businessId', '==', businessId).count().get(),
            db.collection('users').where('businessId', '==', businessId).where('role', '==', 'WORKER').count().get(),
            db.collection('orders').where('businessId', '==', businessId).count().get(),
            db.collection('orders').where('businessId', '==', businessId).where('status', '==', 'PENDING').count().get(),
            db.collection('orders').where('businessId', '==', businessId).where('status', '==', 'COMPLETED').count().get(),
            db.collection('orders').where('businessId', '==', businessId).where('status', '==', 'IN_PROGRESS').count().get(),
            // Only fetch small necessary fields for revenue and trends
            db.collection('products').where('businessId', '==', businessId).select('amount', 'paymentMethod', 'date').get()
        ]);

        const products = revenueData.docs.map(doc => {
            const data = doc.data();
            return {
                amount: data.amount || 0,
                paymentMethod: data.paymentMethod || "OFFLINE",
                date: data.date?.toDate ? data.date.toDate() : new Date(data.date || now)
            };
        });

        // Total Revenue (Online vs Offline)
        const totalRevenue = products.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
        const onlineRevenue = products.filter((p: any) => p.paymentMethod === "ONLINE").reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
        const offlineRevenue = products.filter((p: any) => p.paymentMethod === "OFFLINE").reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

        // Sales Trends (Last 7 days)
        const salesTrends = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(now, i);
            const start = startOfDay(date);
            const end = endOfDay(date);

            const daySales = products.filter((p: any) => p.date >= start && p.date <= end);
            salesTrends.push({
                date: date.toLocaleDateString(),
                amount: daySales.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0),
                count: daySales.length
            });
        }

        return NextResponse.json({
            totalRevenue,
            onlineRevenue,
            offlineRevenue,
            salesTrends,
            orderStats: {
                total: ordersTotal.data().count,
                pending: ordersPending.data().count,
                completed: ordersCompleted.data().count,
                inProgress: ordersInProgress.data().count
            },
            counts: {
                products: productsCount.data().count,
                workers: workersCount.data().count
            }
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
