"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpenCheck, Compass, Home, Menu, Settings, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/life-map", label: "Life Map", icon: Compass },
  { href: "/values", label: "Values", icon: BookOpenCheck },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/reviews", label: "Reviews", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/life-map": "Life Map",
  "/values": "Values and Criteria",
  "/goals": "Goals",
  "/goals/new": "Create Goal",
  "/reviews": "Reviews",
  "/reviews/new": "Weekly Review",
  "/settings": "Settings",
  "/setup": "Guided Setup",
};

function routeTitle(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/goals/") && pathname.endsWith("/edit")) return "Edit Goal";
  if (pathname.startsWith("/goals/")) return "Goal Detail";
  if (pathname.startsWith("/reviews/")) return "Review Detail";
  return "Aloriq";
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              active && "bg-accent text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = routeTitle(pathname);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card px-4 py-6 lg:block">
        <Link href="/dashboard" className="mb-8 block px-3">
          <div className="text-xl font-semibold tracking-normal">Aloriq</div>
          <div className="mt-1 text-xs text-muted-foreground">Choose, measure, review.</div>
        </Link>
        <NavLinks />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="mb-6">
                  <SheetTitle>Aloriq</SheetTitle>
                </SheetHeader>
                <NavLinks />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">Goals above tasks. Aloriq keeps the alignment visible.</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-card lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-muted-foreground", active && "text-primary")}>
                <Icon className="size-4" />
                <span className="truncate">{item.label.replace("Life Map", "Map")}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
