import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (!snapshot.empty) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newWorker = {
            name,
            email,
            password: hashedPassword,
            role: "WORKER",
            businessId: session.user.businessId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await usersRef.add(newWorker);

        return NextResponse.json({ success: true, worker: { id: docRef.id, name, email } });
    } catch (error) {
        console.error("Create Worker Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const businessId = session.user.businessId;

        // Fetch Workers
        const workersSnapshot = await db.collection('users')
            .where('businessId', '==', businessId)
            .where('role', '==', 'WORKER')
            .get();

        const workers = workersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || new Date())
            };
        });

        // Fetch Orders and Products to calculate counts
        // Optimization: If this gets slow, we should store counts on the user document
        const ordersSnapshot = await db.collection('orders')
            .where('businessId', '==', businessId)
            .get();
        const productsSnapshot = await db.collection('products')
            .where('businessId', '==', businessId)
            .get();

        const orders = ordersSnapshot.docs.map(doc => doc.data());
        const products = productsSnapshot.docs.map(doc => doc.data());

        const workersWithCounts = workers.map((worker: any) => {
            const assignedOrdersCount = orders.filter((o: any) => o.workerId === worker.id).length;
            const salesCount = products.filter((p: any) => p.createdById === worker.id).length;

            return {
                id: worker.id,
                name: worker.name,
                email: worker.email,
                createdAt: worker.createdAt,
                _count: {
                    assignedOrders: assignedOrdersCount,
                    sales: salesCount
                }
            };
        });

        return NextResponse.json(workersWithCounts);
    } catch (error) {
        console.error("Get Workers Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
