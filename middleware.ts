import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    console.log("Middleware Path:", path);

    // Get the secret - NextAuth uses this specific env var
    const secret = process.env.NEXTAUTH_SECRET;
    console.log("Middleware Secret Present:", !!secret);
    console.log("Middleware Cookies:", req.cookies.getAll().map(c => c.name).join(", "));

    if (!secret) {
        console.error("CRITICAL: NEXTAUTH_SECRET is not defined in middleware!");
        console.error("Environment variables available:", Object.keys(process.env).filter(k => k.includes('AUTH')));
        // Allow access without auth if secret is missing (dev fallback)
        return NextResponse.next();
    }

    try {
        const token = await getToken({
            req,
            secret,
            secureCookie: process.env.NODE_ENV === "production"
        });

        console.log("Middleware Token:", token ? "Found" : "Missing");
        if (token) {
            console.log("Token Role:", token.role);
            console.log("Token Sub:", token.sub);
        }

        // Protect Admin routes
        if (path.startsWith("/admin")) {
            if (!token || token.role !== "ADMIN") {
                console.log("Redirecting to Admin Login - No valid admin token");
                return NextResponse.redirect(new URL("/login/admin", req.url));
            }
        }

        // Protect Worker routes
        if (path.startsWith("/worker")) {
            if (!token || token.role !== "WORKER") {
                console.log("Redirecting to Worker Login - No valid worker token");
                return NextResponse.redirect(new URL("/login/worker", req.url));
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.error("Middleware Error:", error);
        // On error, redirect to login
        if (path.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/login/admin", req.url));
        } else if (path.startsWith("/worker")) {
            return NextResponse.redirect(new URL("/login/worker", req.url));
        }
        return NextResponse.next();
    }
}

export const config = { matcher: ["/admin/:path*", "/worker/:path*"] };
