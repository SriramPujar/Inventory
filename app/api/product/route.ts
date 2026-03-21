import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { customerName, productName, date, amount, paymentMethod } = await req.json();

        const newProduct = {
            customerName,
            productName,
            date: new Date(date),
            amount: parseFloat(amount),
            paymentMethod,
            createdById: session.user.id,
            businessId: session.user.businessId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection('products').add(newProduct);

        return NextResponse.json({ id: docRef.id, ...newProduct });
    } catch (error) {
        console.error("Create Product Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const productsRef = db.collection('products');
        const snapshot = await productsRef.where('businessId', '==', session.user.businessId).get();

        let products = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate ? data.date.toDate() : new Date(data.date),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || new Date()),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || new Date()),
                // Mock createdBy name since we don't have joins. 
                // In a real app, we'd fetch user names or store creatorName on the product doc.
                // For now, let's just return the ID or maybe fetch users if critical.
                // The UI might need 'createdBy.name'.
                // Let's fetch all users for the business to map names.
            };
        });

        // Fetch users to map names (optimization: cache this or store name on product)
        // For now, let's fetch users since it's likely small scale.
        const usersSnapshot = await db.collection('users')
            .where('businessId', '==', session.user.businessId)
            .get();

        const usersMap = new Map();
        usersSnapshot.forEach(doc => usersMap.set(doc.id, doc.data().name));

        products = products.map((p: any) => ({
            ...p,
            createdBy: { name: usersMap.get(p.createdById) || 'Unknown' }
        }));

        if (session.user.role === "WORKER") {
            products = products.filter((p: any) => p.createdById === session.user.id);
        }

        // Sort by date desc
        products.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

        return NextResponse.json(products);
    } catch (error) {
        console.error("Get Products Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, ...updates } = await req.json();

        const productRef = db.collection('products').doc(id);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const product = productDoc.data() as any;

        if (session.user.role === "WORKER" && product.createdById !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updateData = {
            ...updates,
            amount: updates.amount ? parseFloat(updates.amount) : undefined,
            date: updates.date ? new Date(updates.date) : undefined,
            updatedAt: new Date()
        };

        // Remove undefined
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        await productRef.update(updateData);

        return NextResponse.json({ id, ...product, ...updateData });
    } catch (error) {
        console.error("Update Product Error:", error);
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

        const productRef = db.collection('products').doc(id);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const product = productDoc.data() as any;

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await productRef.delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Product Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
