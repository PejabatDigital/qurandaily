import { buttonVariants } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="text-center">
        <h1 className="mb-2 text-date font-semibold">Page not found</h1>
        <p className="mb-6 text-body text-muted-foreground">There's nothing at this address.</p>
        <a href="/" className={buttonVariants()}>
          Back to home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
