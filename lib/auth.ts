import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
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

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { business: true }
                });

                if (!user) {
                    console.log("User not found");
                    throw new Error("User not found");
                }

                // Verify Business Name (Case insensitive)
                if (user.business.name.toLowerCase() !== credentials.businessName.toLowerCase()) {
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

                console.log("User authenticated:", user.id);
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    businessId: user.businessId
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
            }
            return token;
        },
        async session({ session, token }) {
            console.log("Session Callback", { sessionUser: !!session.user, tokenSub: token.sub });
            if (session.user) {
                session.user.role = token.role as string;
                session.user.businessId = token.businessId as string;
                session.user.id = token.sub as string;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login/admin", // Default, but we will handle redirection manually
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
