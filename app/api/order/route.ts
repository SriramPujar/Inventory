import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { customerName, orderName, date, location, ceremonyDates, amount, workerAmount, workerId, workerName, accessories, totalAccessories } = body;

        const newOrder = {
            customerName,
            orderName,
            date: new Date(date),
            location,
            ceremonyDates: JSON.stringify(ceremonyDates),
            amount: parseFloat(amount),
            workerAmount: workerAmount ? parseFloat(workerAmount) : 0,
            workerId: workerId || null,
            workerName: workerName || null,
            accessories: accessories || "",
            totalAccessories: totalAccessories ? parseInt(totalAccessories) : 0,
            accessoriesProvided: 0,
            payments: [],
            amountPaid: 0,
            businessId: session.user.businessId,
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection('orders').add(newOrder);

        return NextResponse.json({ id: docRef.id, ...newOrder });
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
        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.where('businessId', '==', session.user.businessId).get();

        let orders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate ? data.date.toDate() : new Date(data.date),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || new Date()),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || new Date()),
            };
        });

        if (session.user.role === "WORKER") {
            orders = orders.filter((o: any) => o.workerId === session.user.id || o.workerId === null);
        }

        // Sort by date desc
        orders.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Get Orders Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, status, workerId, ...updates } = await req.json();

        const orderRef = db.collection('orders').doc(id);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const order = orderDoc.data() as any;

        if (session.user.role === "WORKER") {
            if (order.workerId && order.workerId !== session.user.id) {
                return NextResponse.json({ error: "Not authorized to edit this order" }, { status: 403 });
            }
            // If worker is claiming, allow workerId update
            if (workerId && !order.workerId) {
                updates.workerId = workerId;
            }
        } else {
            // Admin can update workerId freely
            if (workerId !== undefined) {
                updates.workerId = workerId;
            }
        }

        const updateData: any = {
            ...updates,
            updatedAt: new Date()
        };
        if (status) updateData.status = status;

        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        // Check for new payment
        if (updates.newPayment) {
            updateData.payments = admin.firestore.FieldValue.arrayUnion(updates.newPayment);
            updateData.amountPaid = admin.firestore.FieldValue.increment(updates.newPayment.amount);
            delete updateData.newPayment;
        }

        // Handle providedAccessoryItems update
        if (updates.providedAccessoryItems) {
            updateData.providedAccessoryItems = updates.providedAccessoryItems;
            updateData.accessoriesProvided = updates.providedAccessoryItems.length;
        }

        await orderRef.update(updateData);
        return NextResponse.json({ id, ...order, ...updateData });

    } catch (error) {
        console.error("Update Order Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await db.collection('orders').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Order Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
