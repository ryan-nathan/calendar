import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Hotel Management System</h1>
        <p className="text-xl text-muted-foreground mb-8">Manage your hotel rooms, rates, and availability</p>
        <Button asChild size="lg">
          <Link to="/calendar">View Calendar</Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;
