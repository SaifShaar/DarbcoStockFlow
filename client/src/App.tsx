import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { I18nProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";
import SignInPage from "@/pages/sign-in";
import Dashboard from "@/pages/dashboard";
import RfqPage from "@/pages/procurement/rfq";
import QuotesPage from "@/pages/procurement/quotes";
import PurchaseOrdersPage from "@/pages/procurement/purchase-orders";
import ReceivingPage from "@/pages/inventory/receiving";
import MaterialIssuePage from "@/pages/inventory/material-issue";
import MaterialReturnPage from "@/pages/inventory/material-return";
import TransfersAdjustmentsPage from "@/pages/inventory/transfers-adjustments";
import BomDesignerPage from "@/pages/production/bom-designer";
import PartsListsPage from "@/pages/production/parts-lists";
import WorkOrdersPage from "@/pages/production/work-orders";
import FabricationConsolePage from "@/pages/production/fabrication-console";
import ItemsPage from "@/pages/master-data/items";
import SuppliersPage from "@/pages/master-data/suppliers";
import WarehousesPage from "@/pages/master-data/warehouses";
import UsersPage from "@/pages/administration/users";
import ReportsPage from "@/pages/reports";
import TopNavigation from "@/components/layout/top-navigation";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/procurement/rfq" component={RfqPage} />
            <Route path="/procurement/quotes" component={QuotesPage} />
            <Route path="/procurement/purchase-orders" component={PurchaseOrdersPage} />
            <Route path="/inventory/receiving" component={ReceivingPage} />
            <Route path="/inventory/material-issue" component={MaterialIssuePage} />
            <Route path="/inventory/material-return" component={MaterialReturnPage} />
            <Route path="/inventory/transfers" component={TransfersAdjustmentsPage} />
            <Route path="/production/bom-designer" component={BomDesignerPage} />
            <Route path="/production/parts-lists" component={PartsListsPage} />
            <Route path="/production/work-orders" component={WorkOrdersPage} />
            <Route path="/production/fabrication-console" component={FabricationConsolePage} />
            <Route path="/master-data/items" component={ItemsPage} />
            <Route path="/master-data/suppliers" component={SuppliersPage} />
            <Route path="/master-data/warehouses" component={WarehousesPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route path="/administration/users" component={UsersPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
