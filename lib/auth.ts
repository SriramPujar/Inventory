import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                businessName: { label: "Business Name", type: "text" },
                expectedRole: { label: "Role", type: "text" } // Hidden field to enforce page-specific login
            },
            async authorize(credentials) {
                console.log("Authorize called with:", { email: credentials?.email, business: credentials?.businessName });
                if (!credentials?.email || !credentials?.password || !credentials?.businessName) {
                    throw new Error("Missing credentials");
                }

                const usersRef = db.collection('users');
                const snapshot = await usersRef.where('email', '==', credentials.email).get();

                if (snapshot.empty) {
                    console.log("User not found");
                    throw new Error("User not found");
                }

                const userDoc = snapshot.docs[0];
                const user = userDoc.data();
                const userId = userDoc.id;

                // Fetch Business
                const businessDoc = await db.collection('businesses').doc(user.businessId).get();

                if (!businessDoc.exists) {
                    console.log("Business not found");
                    throw new Error("Business not found");
                }

                const business = businessDoc.data();

                // Verify Business Name (Case insensitive)
                if (business?.name.toLowerCase() !== credentials.businessName.toLowerCase()) {
                    console.log("Business name mismatch");
                    throw new Error("Invalid Business Name");
                }

                // Verify Password
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    console.log("Invalid password");
                    throw new Error("Invalid password");
                }

                // Verify Role if specified (to ensure Admin doesn't login via Worker page if we want strict separation)
                if (credentials.expectedRole && user.role !== credentials.expectedRole) {
                    console.log("Role mismatch");
                    throw new Error(`Access denied. Please use the ${user.role.toLowerCase()} login page.`);
                }

                console.log("User authenticated:", userId);
                return {
                    id: userId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    businessId: user.businessId,
                    businessName: business.name
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            console.log("JWT Callback", { tokenSub: token.sub, userPresent: !!user });
            if (user) {
                token.role = user.role;
                token.businessId = user.businessId;
                token.businessName = user.businessName;
            }
            return token;
        },
        async session({ session, token }) {
            console.log("Session Callback", { sessionUser: !!session.user, tokenSub: token.sub });
            if (session.user) {
                session.user.role = token.role as string;
                session.user.businessId = token.businessId as string;
                session.user.businessName = token.businessName as string;
                session.user.id = token.sub as string;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login/admin", // Default, but we will handle redirection manually
    },
    session: {
        strategy: "jwt" as const,
        maxAge: 90 * 24 * 60 * 60, // 90 days
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true,
                maxAge: 90 * 24 * 60 * 60,
            },
        },
        callbackUrl: {
            name: `next-auth.callback-url`,
            options: {
                sameSite: 'lax',
                path: '/',
                secure: true,
            },
        },
        csrfToken: {
            name: `next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true,
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
