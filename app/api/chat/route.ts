import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { createSale, createOrder, getRecentSales, getRecentOrders, updateSale, updateOrder, searchOrder } from "@/lib/ai-tools";

// Initialize Groq (via OpenAI SDK)
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "",
    baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { messages } = await req.json();

        const systemMessage = {
            role: "system",
            content: `You are a helpful inventory assistant for a photography studio. 
            You can add sales, create orders, check status, AND UPDATE existing items.
            Current Date: ${new Date().toISOString().split('T')[0]}
            Business ID: ${session.user.businessId}
            User ID: ${session.user.id}
            
            When adding items:
            - If payment method is not specified, ask. Default to OFFLINE if unsure but better to ask.
            - Format currency in INR (₹).

            UPDATES:
            - You can update an order by providing the Customer Name AND Order Name.
            - If multiple orders match the name, ask the user for clarification (by date).

            `
        };

        // Sanitize messages to remove 'id' which Groq rejects
        const cleanMessages = messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            // Keep name for tool messages if necessary
            ...(m.name && { name: m.name }),
            ...(m.tool_calls && { tool_calls: m.tool_calls }),
            ...(m.tool_call_id && { tool_call_id: m.tool_call_id })
        }));

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [systemMessage, ...cleanMessages],
            tools: [
                {
                    type: "function",
                    function: {
                        name: "create_sale",
                        description: "Record a new product sale",
                        parameters: {
                            type: "object",
                            properties: {
                                customerName: { type: "string" },
                                productName: { type: "string" },
                                amount: { type: "string", description: "Amount in INR" },
                                paymentMethod: { type: "string", enum: ["ONLINE", "OFFLINE"] },
                                date: { type: "string", description: "ISO date string YYYY-MM-DD" }
                            },
                            required: ["customerName", "productName", "amount", "paymentMethod", "date"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "create_order",
                        description: "Create a new event order",
                        parameters: {
                            type: "object",
                            properties: {
                                customerName: { type: "string" },
                                orderName: { type: "string" },
                                amount: { type: "string", description: "Amount in INR" },
                                date: { type: "string", description: "ISO date string YYYY-MM-DD" },
                                location: { type: "string" },
                                workerAmount: { type: "string" },
                                accessories: { type: "string" }
                            },
                            required: ["customerName", "orderName", "amount", "date"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "update_sale",
                        description: "Update an existing sale. Requires ID.",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "string", description: "The ID of the sale to update" },
                                customerName: { type: "string" },
                                productName: { type: "string" },
                                amount: { type: "string" },
                                paymentMethod: { type: "string", enum: ["ONLINE", "OFFLINE"] },
                                date: { type: "string" }
                            },
                            required: ["id"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "update_order",
                        description: "Update an existing order. Requires ID.",
                        parameters: {
                            type: "object",
                            properties: {
                                originalDate: { type: "string", description: "Original date of the order to identify it if there are duplicates (YYYY-MM-DD)" },
                                customerName: { type: "string" },
                                orderName: { type: "string" },
                                amount: { type: "string" },
                                date: { type: "string" },
                                location: { type: "string" },
                                workerAmount: { type: "string" },
                                accessories: { type: "string" }
                            },
                            // Require either ID OR (Customer Name + Order Name) - enforcing loosely via prompt, code will validate
                            required: []
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "get_recent_sales",
                        description: "Get list of recent sales",
                        parameters: {
                            type: "object",
                            properties: {
                                limit: { type: "string", description: "Number of items to return (default 5)" }
                            }
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "get_recent_orders",
                        description: "Get recent orders",
                        parameters: {
                            type: "object",
                            properties: {
                                limit: { type: "string", description: "Number of items to return (default 5)" }
                            }
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "search_order",
                        description: "Search for a specific order by name to view details",
                        parameters: {
                            type: "object",
                            properties: {
                                customerName: { type: "string" },
                                orderName: { type: "string" }
                            },
                            required: ["customerName", "orderName"]
                        }
                    }
                }
            ],
            tool_choice: "auto"
        });

        const responseMessage = response.choices[0].message;

        let toolCalls = responseMessage.tool_calls;

        // Fallback: Check for hallucinated tool calls in content
        if (!toolCalls && responseMessage.content) {
            // Robust broad match: capture everything between <function... and </function>
            // This handles variations like <function:name>, <function(name)>, etc.
            const broadMatch = responseMessage.content.match(/<function([\s\S]*?)<\/function>/);

            if (broadMatch) {
                try {
                    const rawContent = broadMatch[1]; // e.g., "(update_order)({...})" or ":update_order>{...}"

                    // 1. Extract Name: Find first alphanumeric sequence that looks like a function name
                    const nameMatch = rawContent.match(/([a-zA-Z0-9_]+)/);
                    if (!nameMatch) throw new Error("No function name found");
                    const functionName = nameMatch[1];

                    // 2. Extract JSON: Find the first '{' and try to parse from there
                    const jsonStartIndex = rawContent.indexOf('{');
                    const jsonEndIndex = rawContent.lastIndexOf('}');

                    if (jsonStartIndex === -1 || jsonEndIndex === -1) throw new Error("No JSON arguments found");

                    const jsonString = rawContent.substring(jsonStartIndex, jsonEndIndex + 1);
                    const functionArgs = JSON.parse(jsonString);

                    console.log("Detected hallucinated tool call (robust):", functionName);

                    toolCalls = [{
                        id: `call_${Date.now()}`,
                        type: 'function',
                        function: {
                            name: functionName,
                            arguments: JSON.stringify(functionArgs)
                        }
                    }];
                    // Clear content so the user doesn't see the raw code
                    responseMessage.content = null;
                } catch (e) {
                    console.error("Failed to parse hallucinated tool call:", e);
                }
            }
        }

        // Handle Tool Calls
        if (toolCalls) {

            const toolResults = await Promise.all(toolCalls.map(async (toolCall: any) => {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                // Helper to parse amount safely
                const parseAmount = (val: any) => parseFloat(String(val).replace(/[^0-9.]/g, ''));
                // Helper to parse limit safely
                const parseLimit = (val: any) => val ? parseInt(String(val).replace(/[^0-9]/g, '')) : 5;

                let result;
                if (functionName === "create_sale") {
                    result = await createSale({
                        ...args,
                        amount: parseAmount(args.amount),
                        businessId: session.user.businessId,
                        userId: session.user.id
                    });
                } else if (functionName === "create_order") {
                    result = await createOrder({
                        ...args,
                        amount: parseAmount(args.amount),
                        workerAmount: args.workerAmount ? parseAmount(args.workerAmount) : undefined,
                        businessId: session.user.businessId
                    });
                } else if (functionName === "get_recent_sales") {
                    result = await getRecentSales(session.user.businessId, parseLimit(args.limit));
                } else if (functionName === "get_recent_orders") {
                    result = await getRecentOrders(session.user.businessId, parseLimit(args.limit));
                } else if (functionName === "update_sale") {
                    result = await updateSale(args.id, {
                        ...args,
                        amount: args.amount ? parseAmount(args.amount) : undefined
                    });
                } else if (functionName === "update_order") {
                    result = await updateOrder({
                        orderName: args.orderName,
                        customerName: args.customerName,
                        businessId: session.user.businessId,
                        date: args.originalDate
                    }, {
                        ...args,
                        amount: args.amount ? parseAmount(args.amount) : undefined,
                        workerAmount: args.workerAmount ? parseAmount(args.workerAmount) : undefined
                    });
                } else if (functionName === "search_order") {
                    result = await searchOrder(session.user.businessId, args.customerName, args.orderName);
                }

                return {
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: functionName,
                    content: JSON.stringify(result)
                };
            }));

            // Send tool results back to Grok to get final friendly message
            const finalResponse = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [systemMessage, ...cleanMessages, responseMessage, ...toolResults as any]
            });

            return NextResponse.json({ content: finalResponse.choices[0].message.content });
        }

        return NextResponse.json({ content: responseMessage.content });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        const keyStatus = process.env.GROQ_API_KEY ? `Key present (${process.env.GROQ_API_KEY.substring(0, 4)}...)` : "Key MISSING";
        return NextResponse.json({ error: `${error.message || "Internal Server Error"} | Debug: ${keyStatus}` }, { status: 500 });
    }
}
