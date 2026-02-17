import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="md:pl-64">
        <div className="p-4 pt-16 md:p-8 md:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
