import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Samvaad AI — Sovereign Press Briefing Assistant",
  description: "AI-based press note generation and official communication assistant for government and police departments.",
};

/**
 * ClerkProvider reads the session cookie at request time, which Cache
 * Components cannot prerender into the static shell. Per the Next 16
 * "Authentication with Cache Components" guide, opt the whole tree into
 * blocking render; adopt Suspense + `use cache: private` per route later.
 */
export const instant = false;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", figtree.variable)}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-wider">
                  SA
                </div>
                <div>
                  <Link href="/" className="font-semibold text-base tracking-tight hover:opacity-90">
                    Samvaad AI
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground hidden sm:inline-block">
                    Press Briefing System
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="text-sm font-medium px-3.5 py-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="text-sm font-medium px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-xs">
                      Sign up
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9",
                      },
                    }}
                  />
                </Show>
              </div>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

