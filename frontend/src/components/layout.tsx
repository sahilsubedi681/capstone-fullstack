import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Home, Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import Footer from "@/components/footer";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <Link href="/" onClick={onClick} className="text-foreground/80 hover:text-primary transition-colors text-lg font-medium">Home</Link>
      <Link href="/how-it-works" onClick={onClick} className="text-foreground/80 hover:text-primary transition-colors text-lg font-medium">How it Works</Link>
      <Link href="/about" onClick={onClick} className="text-foreground/80 hover:text-primary transition-colors text-lg font-medium">About Us</Link>
      <Link href="/contact" onClick={onClick} className="text-foreground/80 hover:text-primary transition-colors text-lg font-medium">Contact</Link>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-4 md:px-8 mx-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl group-hover:bg-primary/90 transition-colors">
              <Home className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-foreground hidden sm:inline-block">
              TribeSilverCircle
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <NavLinks />
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                <span className="text-base text-muted-foreground">Hi, {user.fullName.split(" ")[0]}</span>
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                  <Button variant="ghost" className="text-lg">Dashboard</Button>
                </Link>
                <Button onClick={handleLogout} variant="outline" className="text-lg">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/login">
                  <Button variant="ghost" className="text-lg">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="text-lg rounded-full px-6">Get Started</Button>
                </Link>
              </div>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-6 mt-8">
                  <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
                  <div className="h-px bg-border my-4" />
                  {user ? (
                    <>
                      <Link href={user.role === "admin" ? "/admin" : "/dashboard"} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full text-lg justify-start" variant="ghost">Dashboard</Button>
                      </Link>
                      <Button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} variant="outline" className="w-full text-lg justify-start">
                        <LogOut className="h-5 w-5 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full text-lg">Sign In</Button>
                      </Link>
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full text-lg rounded-full">Get Started</Button>
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <Footer />
    </div>
  );
}