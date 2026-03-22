"use client";

import { SessionProvider } from "next-auth/react";
import { BackButtonHandler } from "./BackButtonHandler";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <BackButtonHandler />
            {children}
        </SessionProvider>
    );
}
