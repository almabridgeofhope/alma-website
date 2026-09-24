import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useSession } from "./useSession";
import { cn } from "@/lib/utils";
import logo from "@/assets/alma-logo.svg";

const NAV_ITEMS = [
  { to: "/admin/transfers", label: "Transfers" },
  { to: "/admin/positionen", label: "Items" },
  { to: "/admin/finanzen", label: "Finance" },
];

const AdminLayout = () => {
  const { session } = useSession();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={logo}
              alt="Alma Bridge of Hope e.V."
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="truncate text-sm text-muted-foreground">Project accounting</span>
          </div>

          <nav className="flex items-center gap-1" aria-label="Sections">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <a
              href="/"
              className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:flex"
            >
              Website <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <span className="hidden max-w-[16rem] truncate text-sm text-muted-foreground md:inline">
              {session?.user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-content px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
