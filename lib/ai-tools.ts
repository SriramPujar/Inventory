import { db } from "@/lib/db";

// Types
export type SaleParams = {
    customerName: string;
    productName: string;
    amount: number;
    paymentMethod: "ONLINE" | "OFFLINE";
    date: string;
    businessId: string;
    userId: string;
};

export type OrderParams = {
    customerName: string;
    orderName: string;
    date: string;
    amount: number;
    businessId: string;
    location?: string;
    workerAmount?: number;
    accessories?: string;
};

export async function createSale(params: SaleParams) {
    try {
        const newProduct = {
            ...params,
            date: new Date(params.date),
            createdById: params.userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const docRef = await db.collection('products').add(newProduct);
        return { success: true, id: docRef.id, message: `Sale recorded for ${params.customerName}` };
    } catch (error) {
        console.error("AI Create Sale Error:", error);
        return { success: false, error: "Failed to create sale" };
    }
}

export async function createOrder(params: OrderParams) {
    try {
        const newOrder = {
            ...params,
            date: new Date(params.date),
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date(),
            // Defaults for required fields (use existing if provided in params)
            location: params.location || "Studio",
            ceremonyDates: "[]",
            workerAmount: params.workerAmount || 0,
            accessories: params.accessories || "",
            totalAccessories: 0,
            accessoriesProvided: 0,
            payments: [],
            amountPaid: 0,
            workerId: null,
            workerName: null
        };
        const docRef = await db.collection('orders').add(newOrder);
        return { success: true, id: docRef.id, message: `Order created for ${params.customerName}` };
    } catch (error) {
        console.error("AI Create Order Error:", error);
        return { success: false, error: "Failed to create order" };
    }
}


export async function updateSale(id: string, updates: Partial<SaleParams>) {
    try {
        const productRef = db.collection('products').doc(id);
        const productDoc = await productRef.get();
        if (!productDoc.exists) return { success: false, error: "Sale not found" };

        const updateData = {
            ...updates,
            updatedAt: new Date(),
            ...(updates.date && { date: new Date(updates.date) })
        };

        await productRef.update(updateData);
        return { success: true, id, message: `Sale updated successfully` };
    } catch (error) {
        console.error("AI Update Sale Error:", error);
        return { success: false, error: "Failed to update sale" };
    }
}

export async function updateOrder(
    identifier: { orderName: string; customerName: string; businessId: string; date?: string },
    updates: Partial<OrderParams>
) {
    try {
        let targetId: string | null = null;

        // Try to find by name
        let query = db.collection('orders')
            .where('businessId', '==', identifier.businessId)
            .where('customerName', '==', identifier.customerName)
            .where('orderName', '==', identifier.orderName);

        const snapshot = await query.get();

        if (snapshot.empty) return { success: false, error: `Order '${identifier.orderName}' for '${identifier.customerName}' not found.` };

        let candidates = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

        // If date is provided, filter by it
        const candidatesAll = candidates; // Keep reference to all candidates for error message
        if (identifier.date) {
            const searchDate = new Date(identifier.date).toDateString();
            candidates = candidates.filter(c => {
                const d = c.data.date.toDate ? c.data.date.toDate() : new Date(c.data.date);
                return d.toDateString() === searchDate;
            });
        }

        if (candidates.length === 0) {
            const availableDates = candidatesAll.map(c => {
                const d = c.data.date.toDate ? c.data.date.toDate() : new Date(c.data.date);
                return d.toISOString().split('T')[0];
            }).join(", ");
            return { success: false, error: `Found orders for '${identifier.customerName}' ('${identifier.orderName}') but none matched the date '${identifier.date}'. Available dates: ${availableDates}` };
        }

        if (candidates.length > 1) {
            const options = candidates.map(c => {
                const d = c.data.date.toDate ? c.data.date.toDate() : new Date(c.data.date);
                return `ID: ${c.id} (Date: ${d.toISOString().split('T')[0]})`;
            }).join(", ");
            return { success: false, error: `Multiple orders found. Please specify which one: ${options}` };
        }

        targetId = candidates[0].id;

        const orderRef = db.collection('orders').doc(targetId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) return { success: false, error: "Order not found" };

        const updateData = {
            ...updates,
            updatedAt: new Date(),
            ...(updates.date && { date: new Date(updates.date) })
        };

        await orderRef.update(updateData);
        return { success: true, id: targetId, message: `Order updated successfully` };
    } catch (error) {
        console.error("AI Update Order Error:", error);
        return { success: false, error: "Failed to update order" };
    }
}

export async function getRecentSales(businessId: string, limit = 5) {
    try {
        const snapshot = await db.collection('products')
            .where('businessId', '==', businessId)
            // .orderBy('date', 'desc') // Requires composite index, so we sort in memory for robustness
            .get();

        const sales = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString() : doc.data().date
        }));

        sales.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sales.slice(0, limit);
    } catch (error) {
        console.error("AI Get Sales Error:", error);
        return [];
    }
}

export async function getRecentOrders(businessId: string, limit = 5) {
    try {
        const snapshot = await db.collection('orders')
            .where('businessId', '==', businessId)
            .get();

        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString() : doc.data().date
        }));

        orders.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return orders.slice(0, limit);
    } catch (error) {
        console.error("AI Get Orders Error:", error);
        return [];
    }
}

export async function searchOrder(businessId: string, customerName: string, orderName: string) {
    try {
        const snapshot = await db.collection('orders')
            .where('businessId', '==', businessId)
            .where('customerName', '==', customerName)
            .where('orderName', '==', orderName)
            .get();

        if (snapshot.empty) return { found: false, message: `No order found for '${orderName}' by '${customerName}'.` };

        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString() : doc.data().date,
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt
        }));

        return { found: true, count: orders.length, orders };
    } catch (error) {
        console.error("AI Search Order Error:", error);
        return { found: false, error: "Failed to search for order" };
    }
}
