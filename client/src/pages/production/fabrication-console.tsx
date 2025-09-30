import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "@/components/ui/status-badge";
import ScanInput from "@/components/ui/scan-input";
import BuildConfirmation from "@/components/modals/build-confirmation";
import ComponentIssue from "@/components/modals/component-issue";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  QrCode, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUp, 
  List, 
  Factory,
  Package 
} from "lucide-react";

export default function FabricationConsolePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>("");
  const [showScanMode, setShowScanMode] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [buildEntry, setBuildEntry] = useState({
    quantity: 0,
    operator: "",
    completionTime: "",
    notes: "",
    backflushEnabled: true,
  });

  // Fetch Work Orders (in progress only)
  const { data: workOrders } = useQuery({
    queryKey: ['/api/work-orders', { status: 'in_progress' }],
  });

  // Fetch selected work order details
  const { data: selectedWorkOrder } = useQuery({
    queryKey: ['/api/work-orders', selectedWorkOrderId],
    enabled: !!selectedWorkOrderId,
  });

  // Fetch BOM lines for component requirements (mock data structure)
  const componentRequirements = [
    {
      id: 1,
      name: "Steel Beam - 2m",
      code: "BEAM-2M-001",
      requiredQty: 200,
      reservedQty: 150,
      issuedQty: 128,
      availableQty: 320,
      uom: "PCS",
      status: "available",
    },
    {
      id: 2,
      name: "Welding Plates",
      code: "PLATE-WLD-001",
      requiredQty: 400,
      reservedQty: 300,
      issuedQty: 256,
      availableQty: 50,
      uom: "PCS",
      status: "shortage",
    },
    {
      id: 3,
      name: "Welding Electrodes",
      code: "ELEC-6013-001",
      requiredQty: 50,
      reservedQty: 50,
      issuedQty: 32,
      availableQty: 125,
      uom: "PKG",
      status: "available",
    },
  ];

  // Mock bins data for component issue
  const mockBins = [
    { id: 1, code: "A1-01", quantity: 150 },
    { id: 2, code: "A1-02", quantity: 170 },
  ];

  // Post build mutation (mock)
  const postBuildMutation = useMutation({
    mutationFn: async (buildData: any) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return buildData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Build posted successfully",
      });
      setShowBuildModal(false);
      setBuildEntry({
        quantity: 0,
        operator: "",
        completionTime: "",
        notes: "",
        backflushEnabled: true,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post build",
        variant: "destructive",
      });
    },
  });

  // Issue component mutation (mock)
  const issueComponentMutation = useMutation({
    mutationFn: async (issueData: any) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return issueData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Component issued successfully",
      });
      setShowIssueModal(false);
      setSelectedComponent(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to issue component",
        variant: "destructive",
      });
    },
  });

  const handlePostBuild = () => {
    if (!buildEntry.quantity || buildEntry.quantity <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid build quantity",
        variant: "destructive",
      });
      return;
    }
    setShowBuildModal(true);
  };

  const confirmBuild = () => {
    postBuildMutation.mutate({
      workOrderId: selectedWorkOrderId,
      ...buildEntry,
    });
  };

  const handleIssueComponent = (component: any) => {
    setSelectedComponent(component);
    setShowIssueModal(true);
  };

  const confirmIssue = (issueData: any) => {
    issueComponentMutation.mutate({
      componentId: selectedComponent.id,
      ...issueData,
    });
  };

  // Calculate progress
  const workOrder = selectedWorkOrder?.data;
  const progressPercentage = workOrder ? 
    Math.round((parseFloat(workOrder.completedQuantity || 0) / parseFloat(workOrder.plannedQuantity)) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="fabrication-console-title">
            {t('fabricationConsole.title', 'Fabrication Console')}
          </h2>
          <p className="text-muted-foreground" data-testid="fabrication-console-subtitle">
            {t('fabricationConsole.subtitle', 'Manage work order execution and material consumption')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowScanMode(true)}
            data-testid="scan-wo-button"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {t('fabricationConsole.scanWorkOrder', 'Scan WO')}
          </Button>
        </div>
      </div>

      {/* Work Order Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Label>Work Order:</Label>
            <Select value={selectedWorkOrderId} onValueChange={setSelectedWorkOrderId}>
              <SelectTrigger className="w-64" data-testid="work-order-select">
                <SelectValue placeholder="Select work order..." />
              </SelectTrigger>
              <SelectContent>
                {workOrders?.data?.map((wo: any) => (
                  <SelectItem key={wo.id} value={wo.id.toString()}>
                    {wo.number} - {wo.item?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Work Order */}
      {workOrder && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Factory className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" data-testid="active-wo-number">
                    {workOrder.number}
                  </h3>
                  <p className="text-muted-foreground" data-testid="active-wo-item">
                    {workOrder.item?.name} ({workOrder.item?.code})
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={workOrder.status} data-testid="active-wo-status" />
              </div>
            </div>

            {/* Production Progress */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600" data-testid="wo-planned-qty">
                  {parseFloat(workOrder.plannedQuantity).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Planned Qty</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600" data-testid="wo-completed-qty">
                  {parseFloat(workOrder.completedQuantity || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600" data-testid="wo-scrap-qty">
                  {parseFloat(workOrder.scrapQuantity || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Scrap</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600" data-testid="wo-remaining-qty">
                  {(parseFloat(workOrder.plannedQuantity) - parseFloat(workOrder.completedQuantity || 0)).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Remaining</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-medium" data-testid="progress-percentage">
                  {progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                  data-testid="progress-bar"
                ></div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                className="bg-green-600 text-white hover:bg-green-700 flex flex-col items-center space-y-1 h-16"
                onClick={handlePostBuild}
                data-testid="post-build-button"
              >
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{t('fabricationConsole.postBuild', 'Post Build')}</span>
              </Button>
              <Button 
                className="bg-red-600 text-white hover:bg-red-700 flex flex-col items-center space-y-1 h-16"
                data-testid="post-scrap-button"
              >
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">{t('fabricationConsole.postScrap', 'Post Scrap')}</span>
              </Button>
              <Button 
                className="bg-blue-600 text-white hover:bg-blue-700 flex flex-col items-center space-y-1 h-16"
                data-testid="issue-components-button"
              >
                <ArrowUp className="h-5 w-5" />
                <span className="text-sm font-medium">{t('fabricationConsole.issueComponents', 'Issue Components')}</span>
              </Button>
              <Button 
                className="bg-purple-600 text-white hover:bg-purple-700 flex flex-col items-center space-y-1 h-16"
                data-testid="view-bom-button"
              >
                <List className="h-5 w-5" />
                <span className="text-sm font-medium">{t('fabricationConsole.viewBom', 'View BOM')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Requirements */}
      {workOrder && (
        <Card>
          <CardHeader>
            <CardTitle>{t('fabricationConsole.componentRequirements', 'Component Requirements')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" data-testid="component-requirements-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Component</th>
                    <th className="text-left p-3 font-medium">Required Qty</th>
                    <th className="text-left p-3 font-medium">Reserved</th>
                    <th className="text-left p-3 font-medium">Issued</th>
                    <th className="text-left p-3 font-medium">Available</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {componentRequirements.map((component, index) => (
                    <tr key={component.id} className="border-b hover:bg-muted/50" data-testid={`component-row-${index}`}>
                      <td className="p-3" data-testid={`component-name-${index}`}>
                        <div>
                          <p className="font-medium text-sm">{component.name}</p>
                          <p className="text-xs text-muted-foreground">{component.code}</p>
                        </div>
                      </td>
                      <td className="p-3 font-medium" data-testid={`component-required-${index}`}>
                        {component.requiredQty} {component.uom}
                      </td>
                      <td className="p-3 text-blue-600" data-testid={`component-reserved-${index}`}>
                        {component.reservedQty} {component.uom}
                      </td>
                      <td className="p-3 text-green-600" data-testid={`component-issued-${index}`}>
                        {component.issuedQty} {component.uom}
                      </td>
                      <td className="p-3 text-purple-600" data-testid={`component-available-${index}`}>
                        {component.availableQty} {component.uom}
                      </td>
                      <td className="p-3" data-testid={`component-status-${index}`}>
                        <StatusBadge status={component.status} />
                      </td>
                      <td className="p-3">
                        {component.status === "available" ? (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleIssueComponent(component)}
                            data-testid={`component-issue-${index}`}
                          >
                            Issue
                          </Button>
                        ) : (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            data-testid={`component-request-${index}`}
                          >
                            Request
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Build Entry Form */}
      {workOrder && (
        <Card>
          <CardHeader>
            <CardTitle>{t('fabricationConsole.recordProduction', 'Record Production')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="buildQuantity">Build Quantity *</Label>
                <Input
                  type="number"
                  id="buildQuantity"
                  value={buildEntry.quantity || ""}
                  onChange={(e) => setBuildEntry(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter quantity built"
                  min="0.01"
                  step="0.01"
                  data-testid="build-quantity-input"
                />
              </div>
              <div>
                <Label htmlFor="operator">Operator</Label>
                <Select 
                  value={buildEntry.operator} 
                  onValueChange={(value) => setBuildEntry(prev => ({ ...prev, operator: value }))}
                >
                  <SelectTrigger data-testid="operator-select">
                    <SelectValue placeholder="Select operator..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OP001">Mohammad Ahmad</SelectItem>
                    <SelectItem value="OP002">Omar Hassan</SelectItem>
                    <SelectItem value="OP003">Ali Khalil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="completionTime">Completion Time</Label>
                <Input
                  type="datetime-local"
                  id="completionTime"
                  value={buildEntry.completionTime}
                  onChange={(e) => setBuildEntry(prev => ({ ...prev, completionTime: e.target.value }))}
                  data-testid="completion-time-input"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={buildEntry.notes}
                onChange={(e) => setBuildEntry(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about this build..."
                rows={3}
                data-testid="build-notes-input"
              />
            </div>
            <div className="mt-6 flex items-center space-x-3">
              <Button 
                className="bg-green-600 text-white px-6 py-2 hover:bg-green-700 flex items-center space-x-2"
                onClick={handlePostBuild}
                disabled={!buildEntry.quantity || buildEntry.quantity <= 0}
                data-testid="submit-build-button"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Submit Build</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="backflushComponents" 
                  checked={buildEntry.backflushEnabled}
                  onCheckedChange={(checked) => setBuildEntry(prev => ({ ...prev, backflushEnabled: !!checked }))}
                  data-testid="backflush-checkbox"
                />
                <Label htmlFor="backflushComponents" className="text-sm">
                  Auto-backflush components
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Mode Modal */}
      {showScanMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="scan-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">
                {t('fabricationConsole.scanWorkOrder', 'Scan Work Order')}
              </h3>
              <p className="text-muted-foreground text-sm">
                Scan work order QR code or barcode
              </p>
            </div>
            
            <ScanInput 
              placeholder="Scan or enter work order code..."
              onScan={(code) => {
                toast({
                  title: "Scanned",
                  description: `Work Order: ${code}`,
                });
                setShowScanMode(false);
              }}
            />
            
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowScanMode(false)}
              data-testid="close-scan-modal"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Build Confirmation Modal */}
      <BuildConfirmation
        isVisible={showBuildModal}
        workOrder={{
          id: parseInt(selectedWorkOrderId || "0"),
          number: workOrder?.number || "",
          item: workOrder?.item?.name || "",
        }}
        buildQuantity={buildEntry.quantity}
        backflushEnabled={buildEntry.backflushEnabled}
        onConfirm={confirmBuild}
        onCancel={() => setShowBuildModal(false)}
        data-testid="build-confirmation-modal"
      />

      {/* Component Issue Modal */}
      {selectedComponent && (
        <ComponentIssue
          isVisible={showIssueModal}
          component={selectedComponent}
          bins={mockBins}
          onConfirm={confirmIssue}
          onCancel={() => {
            setShowIssueModal(false);
            setSelectedComponent(null);
          }}
          data-testid="component-issue-modal"
        />
      )}
    </div>
  );
}
