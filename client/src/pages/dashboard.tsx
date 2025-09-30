import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/ui/metric-card";
import StatusBadge from "@/components/ui/status-badge";
import { useI18n } from "@/hooks/use-internationalization";
import { Clock, AlertTriangle, Truck, Factory } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { t } = useI18n();
  const [showScanInterface, setShowScanInterface] = useState(false);

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ['/api/dashboard/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/metrics', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch recent purchase orders for the table
  const { data: recentPOs, isLoading: posLoading } = useQuery<any>({
    queryKey: ['/api/purchase-orders'],
    queryFn: async () => {
      const response = await fetch('/api/purchase-orders', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch recent DTR entries
  const { data: recentDtr, isLoading: dtrLoading } = useQuery<any>({
    queryKey: ['/api/dtr'],
    queryFn: async () => {
      const response = await fetch('/api/dtr', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  if (metricsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="dashboard-title">
            {t('dashboard.title', 'Operations Cockpit')}
          </h2>
          <p className="text-muted-foreground" data-testid="dashboard-subtitle">
            {t('dashboard.subtitle', 'Real-time overview of your operations')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowScanInterface(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="quick-scan-button"
          >
            <i className="fas fa-qrcode mr-2"></i>
            {t('dashboard.quickScan', 'Quick Scan')}
          </Button>
          <Button variant="outline" data-testid="export-button">
            <i className="fas fa-download mr-2"></i>
            {t('dashboard.export', 'Export')}
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={t('dashboard.metrics.pendingApprovals', 'Pending Approvals')}
          value={metrics?.data?.pendingApprovals || 0}
          icon={<Clock className="h-6 w-6" />}
          variant="destructive"
          trend={{ value: 3, direction: 'up', label: 'since yesterday' }}
          data-testid="metric-pending-approvals"
        />

        <MetricCard
          title={t('dashboard.metrics.belowMinStock', 'Below Min Stock')}
          value={metrics?.data?.belowMinStock || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="warning"
          trend={{ value: 2, direction: 'down', label: 'from last week' }}
          data-testid="metric-below-min-stock"
        />

        <MetricCard
          title={t('dashboard.metrics.todaysReceipts', "Today's Receipts")}
          value={metrics?.data?.todaysReceipts || 0}
          icon={<Truck className="h-6 w-6" />}
          variant="success"
          trend={{ value: 18, direction: 'up', label: 'vs average', isPercentage: true }}
          data-testid="metric-todays-receipts"
        />

        <MetricCard
          title={t('dashboard.metrics.activeWorkOrders', 'Active Work Orders')}
          value={metrics?.data?.activeWorkOrders || 0}
          icon={<Factory className="h-6 w-6" />}
          variant="info"
          trend={{ value: 0, direction: 'neutral', label: 'no change' }}
          data-testid="metric-active-work-orders"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>{t('dashboard.recentTransactions', 'Recent Transactions')}</CardTitle>
              <Button variant="link" size="sm" data-testid="view-all-dtr">
                {t('dashboard.viewAllDtr', 'View All DTR')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!dtrLoading && recentDtr?.data?.slice(0, 3).map((transaction: any, index: number) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`transaction-${index}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.transactionType === 'GRN' ? 'bg-green-100' :
                      transaction.transactionType === 'ISSUE' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      <i className={`text-xs ${
                        transaction.transactionType === 'GRN' ? 'fas fa-arrow-down text-green-600' :
                        transaction.transactionType === 'ISSUE' ? 'fas fa-arrow-up text-blue-600' : 'fas fa-cogs text-purple-600'
                      }`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-sm" data-testid={`transaction-voucher-${index}`}>
                        {transaction.voucherNumber}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`transaction-reference-${index}`}>
                        {transaction.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium" data-testid={`transaction-quantity-${index}`}>
                      {transaction.quantityIn > 0 ? `+${transaction.quantityIn}` : `-${transaction.quantityOut}`} {transaction.uom}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`transaction-time-${index}`}>
                      {new Date(transaction.transactionDate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {dtrLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-3 bg-muted rounded-lg">
                      <div className="h-4 bg-background rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Priority Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.priorityAlerts', 'Priority Alerts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-red-50 border-l-4 border-red-500 rounded" data-testid="alert-critical-stock">
                <i className="fas fa-exclamation-circle text-red-500 mt-1"></i>
                <div>
                  <p className="font-medium text-sm text-red-800">
                    {t('dashboard.alerts.criticalStock', 'Critical Stock Alert')}
                  </p>
                  <p className="text-xs text-red-600">
                    {t('dashboard.alerts.belowSafety', 'Items below safety stock level')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics?.data?.belowMinStock || 0} {t('dashboard.alerts.itemsAffected', 'items affected')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded" data-testid="alert-pending-approvals">
                <i className="fas fa-clock text-yellow-500 mt-1"></i>
                <div>
                  <p className="font-medium text-sm text-yellow-800">
                    {t('dashboard.alerts.pendingApprovals', 'Pending Approvals')}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {t('dashboard.alerts.awaitingApproval', 'Purchase orders awaiting approval')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics?.data?.pendingApprovals || 0} {t('dashboard.alerts.documentsWaiting', 'documents waiting')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded" data-testid="alert-active-production">
                <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                <div>
                  <p className="font-medium text-sm text-blue-800">
                    {t('dashboard.alerts.activeProduction', 'Active Production')}
                  </p>
                  <p className="text-xs text-blue-600">
                    {t('dashboard.alerts.workOrdersInProgress', 'Work orders in progress')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics?.data?.activeWorkOrders || 0} {t('dashboard.alerts.ordersActive', 'orders active')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Procurement Pipeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('dashboard.procurementPipeline', 'Procurement Pipeline')}</CardTitle>
            <Button data-testid="create-rfq-button">
              <i className="fas fa-plus mr-2"></i>
              {t('dashboard.createRfq', 'Create RFQ')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Pipeline Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold" data-testid="pipeline-rfqs-count">6</span>
              </div>
              <p className="text-sm font-medium">RFQs</p>
              <p className="text-xs text-muted-foreground">Open Requests</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-yellow-600 font-bold" data-testid="pipeline-quotes-count">4</span>
              </div>
              <p className="text-sm font-medium">Quotes</p>
              <p className="text-xs text-muted-foreground">Under Review</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold" data-testid="pipeline-pos-count">
                  {metrics?.data?.pendingApprovals || 0}
                </span>
              </div>
              <p className="text-sm font-medium">POs</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold" data-testid="pipeline-deliveries-count">12</span>
              </div>
              <p className="text-sm font-medium">Deliveries</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
          </div>

          {/* Recent POs Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-card rounded-lg overflow-hidden" data-testid="recent-pos-table">
              <thead>
                <tr className="bg-muted">
                  <th className="text-muted-foreground text-left p-3 font-medium text-sm">PO Number</th>
                  <th className="text-muted-foreground text-left p-3 font-medium text-sm">Supplier</th>
                  <th className="text-muted-foreground text-left p-3 font-medium text-sm">Total Value</th>
                  <th className="text-muted-foreground text-left p-3 font-medium text-sm">Status</th>
                  <th className="text-muted-foreground text-left p-3 font-medium text-sm">Delivery Date</th>
                  <th className="text-muted-foreground text-left p-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!posLoading && recentPOs?.data?.slice(0, 3).map((po: any, index: number) => (
                  <tr key={po.id} className="border-t border-border" data-testid={`po-row-${index}`}>
                    <td className="p-3 font-mono text-sm" data-testid={`po-number-${index}`}>{po.number}</td>
                    <td className="p-3" data-testid={`po-supplier-${index}`}>{po.supplier?.name || 'N/A'}</td>
                    <td className="p-3 font-medium" data-testid={`po-total-${index}`}>{po.totalAmount} JOD</td>
                    <td className="p-3" data-testid={`po-status-${index}`}>
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="p-3" data-testid={`po-delivery-date-${index}`}>{po.deliveryDate}</td>
                    <td className="p-3">
                      <Button variant="link" size="sm" data-testid={`po-view-${index}`}>View</Button>
                      {po.status === 'pending' && (
                        <Button variant="link" size="sm" className="text-green-600 ml-2" data-testid={`po-approve-${index}`}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {posLoading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="animate-pulse">Loading recent purchase orders...</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Scan Interface Modal */}
      {showScanInterface && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="scan-modal">
          <div className="max-w-md mx-auto bg-card border border-border rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-qrcode text-primary text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold">Quick Scan</h3>
              <p className="text-muted-foreground text-sm">Scan barcode or QR code</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                className="w-full text-2xl font-mono border-4 border-dashed border-primary rounded-lg p-4 text-center"
                placeholder="Scan or type code here"
                data-testid="scan-input"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-green-600 text-white hover:bg-green-700" data-testid="process-receipt">
                  <i className="fas fa-truck mr-2"></i>
                  Receipt
                </Button>
                <Button className="bg-blue-600 text-white hover:bg-blue-700" data-testid="process-issue">
                  <i className="fas fa-arrow-up mr-2"></i>
                  Issue
                </Button>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowScanInterface(false)}
                data-testid="close-scan"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
