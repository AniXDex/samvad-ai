import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { IBM_Plex_Mono, Manrope, Newsreader } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-loreline-sans",
});

const story = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-loreline-story",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Samvaad AI — Sovereign Press Briefing Assistant",
  description: "AI-based press note generation, OCR/STT fact extraction, and official briefing assistant for police departments and government officers.",
  applicationName: "Samvaad AI",
};

export const instant = false;

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-grid size-8 place-items-center rounded-[0.7rem] bg-foreground text-background shadow-xs",
        className,
      )}
    >
      <span className="font-story -translate-y-px text-[1.45rem] font-semibold italic leading-none">
        S
      </span>
      <span className="absolute bottom-[0.38rem] left-[0.42rem] h-[1.5px] w-[0.85rem] bg-brand" />
      <span className="absolute bottom-[0.28rem] right-[0.38rem] size-1 rounded-full bg-sky" />
    </span>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(
        sans.variable,
        story.variable,
        mono.variable,
        "h-full antialiased font-sans",
      )}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground dot-grid">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <header className="border-b border-border/70 bg-card/85 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <BrandMark />
                  <div className="flex flex-col">
                    <span className="font-story text-xl font-semibold italic tracking-tight text-foreground group-hover:opacity-90 transition-opacity">
                      Samvaad
                    </span>
                    <span className="text-[0.65rem] font-mono tracking-widest text-muted-foreground uppercase -mt-1">
                      Sovereign AI
                    </span>
                  </div>
                </Link>

                <nav className="hidden md:flex items-center gap-1.5 ml-4">
                  <Link
                    href="/dossiers"
                    className="text-xs font-medium px-3 py-1.5 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/70 transition-colors"
                  >
                    Dossiers
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-3">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button
                      data-slot="button"
                      data-variant="outline"
                      className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-border bg-background hover:bg-control hover:text-foreground transition-all cursor-pointer"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      data-slot="button"
                      data-variant="default"
                      className="text-xs font-semibold px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      Get Started
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <div className="flex items-center gap-2.5">
                    <OrganizationSwitcher
                      hidePersonal={false}
                      afterCreateOrganizationUrl="/dossiers"
                      afterSelectOrganizationUrl="/dossiers"
                      afterLeaveOrganizationUrl="/dossiers"
                      appearance={{
                        elements: {
                          rootBox: "flex items-center",
                          organizationSwitcherTrigger:
                            "text-xs font-medium px-3 py-1.5 rounded-full border border-border/80 bg-background hover:bg-muted/70 text-foreground transition-all cursor-pointer shadow-xs",
                        },
                      }}
                    />
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8 rounded-full ring-1 ring-border",
                        },
                      }}
                    />
                  </div>
                </Show>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}


