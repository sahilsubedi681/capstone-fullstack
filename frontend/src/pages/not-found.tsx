import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mb-8">
        <Home className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Page Not Found</h1>
      <p className="text-xl text-muted-foreground max-w-md mb-8">
        We couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <Link href="/">
        <Button size="lg" className="rounded-full px-8 text-lg h-14">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
