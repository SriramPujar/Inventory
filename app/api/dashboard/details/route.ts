import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const businessId = session.user.businessId;
        let data: any[] = [];

        if (type === 'PRODUCTS' || type === 'DAILY') {
            const snapshot = await db.collection('products')
                .where('businessId', '==', businessId)
                .limit(100)
                .get();
            data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        if (type === 'TOTAL_ORDERS' || type === 'PENDING' || type === 'COMPLETED' || type === 'DAILY') {
            let query = db.collection('orders').where('businessId', '==', businessId);
            
            if (type === 'PENDING') query = query.where('status', '==', 'PENDING');
            if (type === 'COMPLETED') query = query.where('status', '==', 'COMPLETED');
            
            const snapshot = await query.limit(100).get();
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (type === 'DAILY') {
                data = [...data, ...orders];
            } else {
                data = orders;
            }
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Dashboard Details Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
