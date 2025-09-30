import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/hooks/use-internationalization";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  FileText,
  DollarSign,
  Package,
  Truck,
  AlertTriangle,
  Calendar,
  Filter
} from "lucide-react";

export default function ReportsPage() {
  const { t } = useI18n();
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");

  // Fetch dashboard metrics
  const { data: metrics } = useQuery<any>({
    queryKey: ['/api/dashboard/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/metrics', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch inventory reports data
  const { data: inventoryReport } = useQuery<any>({
    queryKey: ['/api/reports/inventory', { dateFrom, dateTo, warehouseId: selectedWarehouse }],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        ...(selectedWarehouse !== "all" && { warehouseId: selectedWarehouse }),
      });
      const response = await fetch(`/api/reports/inventory?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch procurement reports data
  const { data: procurementReport } = useQuery<any>({
    queryKey: ['/api/reports/procurement', { dateFrom, dateTo, supplierId: selectedSupplier }],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        ...(selectedSupplier !== "all" && { supplierId: selectedSupplier }),
      });
      const response = await fetch(`/api/reports/procurement?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch production reports data
  const { data: productionReport } = useQuery<any>({
    queryKey: ['/api/reports/production', { dateFrom, dateTo }],
    queryFn: async () => {
      const params = new URLSearchParams({ dateFrom, dateTo });
      const response = await fetch(`/api/reports/production?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch master data for filters
  const { data: warehouses } = useQuery<any>({
    queryKey: ['/api/warehouses'],
    queryFn: async () => {
      const response = await fetch('/api/warehouses', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: suppliers } = useQuery<any>({
    queryKey: ['/api/suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const exportReport = (reportType: string) => {
    // Export functionality would be implemented here
    console.log(`Exporting ${reportType} report...`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="reports-title">
            {t('reports.title', 'Reports & Analytics')}
          </h2>
          <p className="text-muted-foreground" data-testid="reports-subtitle">
            {t('reports.subtitle', 'Comprehensive business intelligence and reporting')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" data-testid="export-all-reports">
            <Download className="h-4 w-4 mr-2" />
            {t('reports.exportAll', 'Export All')}
          </Button>
          <Button data-testid="schedule-reports">
            <Calendar className="h-4 w-4 mr-2" />
            {t('reports.schedule', 'Schedule Reports')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            {t('reports.filters', 'Report Filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">{t('reports.dateFrom', 'Date From')}</Label>
              <Input
                type="date"
                id="dateFrom"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="date-from-filter"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">{t('reports.dateTo', 'Date To')}</Label>
              <Input
                type="date"
                id="dateTo"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="date-to-filter"
              />
            </div>
            <div>
              <Label htmlFor="warehouse">{t('reports.warehouse', 'Warehouse')}</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger data-testid="warehouse-filter">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {(warehouses?.data || []).map((warehouse: any) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supplier">{t('reports.supplier', 'Supplier')}</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger data-testid="supplier-filter">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {(suppliers?.data || []).map((supplier: any) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Purchase Value</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="total-purchase-value">
                  {procurementReport?.data?.totalPurchaseValue || 0} JOD
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  12% vs last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Inventory Value</p>
                <p className="text-2xl font-bold text-green-600" data-testid="total-inventory-value">
                  {inventoryReport?.data?.totalInventoryValue || 0} JOD
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  8% vs last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Production Output</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="production-output">
                  {productionReport?.data?.totalProduction || 0} Units
                </p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  5% vs last month
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600" data-testid="critical-alerts">
                  {(metrics?.data?.belowMinStock || 0) + (metrics?.data?.pendingApprovals || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires attention
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Tabs */}
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory" data-testid="inventory-reports-tab">
            {t('reports.inventory', 'Inventory Reports')}
          </TabsTrigger>
          <TabsTrigger value="procurement" data-testid="procurement-reports-tab">
            {t('reports.procurement', 'Procurement Reports')}
          </TabsTrigger>
          <TabsTrigger value="production" data-testid="production-reports-tab">
            {t('reports.production', 'Production Reports')}
          </TabsTrigger>
          <TabsTrigger value="financial" data-testid="financial-reports-tab">
            {t('reports.financial', 'Financial Reports')}
          </TabsTrigger>
        </TabsList>

        {/* Inventory Reports */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('reports.stockLevels', 'Stock Levels by Category')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('stock-levels')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="stock-levels-chart">
                  {/* Stock levels would be displayed as charts here */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Raw Materials</p>
                      <p className="text-sm text-muted-foreground">125 items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">85%</p>
                      <p className="text-xs text-muted-foreground">Optimal</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Finished Goods</p>
                      <p className="text-sm text-muted-foreground">67 items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-600">65%</p>
                      <p className="text-xs text-muted-foreground">Medium</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Consumables</p>
                      <p className="text-sm text-muted-foreground">89 items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">35%</p>
                      <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('reports.inventoryMovement', 'Inventory Movement Trends')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('inventory-movement')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="inventory-movement-chart">
                  {/* Movement trends chart would go here */}
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Inventory Movement Chart</p>
                      <p className="text-sm text-muted-foreground">Last 30 days trends</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('reports.abcAnalysis', 'ABC Analysis')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('abc-analysis')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4" data-testid="abc-analysis-chart">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">A</p>
                    <p className="text-sm text-green-600">High Value</p>
                    <p className="text-lg font-semibold mt-2">24 items</p>
                    <p className="text-xs text-muted-foreground">80% of value</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">B</p>
                    <p className="text-sm text-yellow-600">Medium Value</p>
                    <p className="text-lg font-semibold mt-2">67 items</p>
                    <p className="text-xs text-muted-foreground">15% of value</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">C</p>
                    <p className="text-sm text-blue-600">Low Value</p>
                    <p className="text-lg font-semibold mt-2">156 items</p>
                    <p className="text-xs text-muted-foreground">5% of value</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('reports.stockValuation', 'Stock Valuation Report')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('stock-valuation')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="stock-valuation-summary">
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span>Total Inventory Value</span>
                    <span className="font-bold">285,450 JOD</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span>Raw Materials</span>
                    <span className="font-bold">156,780 JOD</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span>Work in Progress</span>
                    <span className="font-bold">67,320 JOD</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span>Finished Goods</span>
                    <span className="font-bold">61,350 JOD</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Procurement Reports */}
        <TabsContent value="procurement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('reports.supplierPerformance', 'Supplier Performance')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('supplier-performance')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="supplier-performance-chart">
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Supplier Performance Chart</p>
                      <p className="text-sm text-muted-foreground">Quality, Delivery & Cost metrics</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('reports.purchaseAnalysis', 'Purchase Analysis')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('purchase-analysis')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="purchase-analysis-chart">
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Purchase Category Breakdown</p>
                      <p className="text-sm text-muted-foreground">Spend by category & supplier</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Production Reports */}
        <TabsContent value="production" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('reports.productionEfficiency', 'Production Efficiency')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('production-efficiency')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="production-efficiency-chart">
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Production Efficiency Trends</p>
                      <p className="text-sm text-muted-foreground">OEE, utilization & throughput</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('reports.workOrderStatus', 'Work Order Status')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('work-order-status')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4" data-testid="work-order-status-summary">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className="text-sm text-blue-600">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">34</p>
                    <p className="text-sm text-green-600">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">8</p>
                    <p className="text-sm text-yellow-600">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">3</p>
                    <p className="text-sm text-red-600">Delayed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('reports.costAnalysis', 'Cost Analysis')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('cost-analysis')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="cost-analysis-summary">
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span>Material Cost</span>
                    <span className="font-bold">125,680 JOD</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span>Labor Cost</span>
                    <span className="font-bold">45,320 JOD</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span>Overhead Cost</span>
                    <span className="font-bold">23,150 JOD</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded font-bold">
                    <span>Total Cost</span>
                    <span>194,150 JOD</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('reports.vatReport', 'Jordan VAT Report')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportReport('vat-report')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="vat-report-summary">
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span>VAT on Purchases</span>
                    <span className="font-bold">18,240 JOD</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span>VAT on Sales</span>
                    <span className="font-bold">24,680 JOD</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded font-bold">
                    <span>Net VAT Payable</span>
                    <span className="text-red-600">6,440 JOD</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      <FileText className="h-4 w-4 inline mr-1" />
                      VAT rate: 16% (Jordan Standard Rate)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}