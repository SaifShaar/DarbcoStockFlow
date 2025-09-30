import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/ui/status-badge";
import ScanInput from "@/components/ui/scan-input";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, QrCode, ArrowUp, Package, Trash2 } from "lucide-react";

export default function MaterialIssuePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showScanMode, setShowScanMode] = useState(false);
  const [lines, setLines] = useState<Array<{ itemId: number; quantity: number; binId: number | null }>>([]);
  const [expandedMinId, setExpandedMinId] = useState<number | null>(null);

  // Fetch MINs
  const { data: mins, isLoading } = useQuery<any>({
    queryKey: ['/api/mins', { status: statusFilter }],
    queryFn: async () => {
      const response = await fetch('/api/mins', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch warehouses and work orders for dropdowns
  const { data: warehouses } = useQuery<any>({
    queryKey: ['/api/warehouses'],
    queryFn: async () => {
      const response = await fetch('/api/warehouses', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: workOrders } = useQuery<any>({
    queryKey: ['/api/work-orders', { status: 'in_progress' }],
    queryFn: async () => {
      const response = await fetch('/api/work-orders', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: items } = useQuery<any>({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const response = await fetch('/api/items', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: bins } = useQuery<any>({
    queryKey: ['/api/bins'],
    queryFn: async () => {
      const response = await fetch('/api/bins', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch MIN lines when expanded
  const { data: minLines } = useQuery<any>({
    queryKey: ['/api/mins', expandedMinId, 'lines'],
    queryFn: async () => {
      if (!expandedMinId) return null;
      const response = await fetch(`/api/mins/${expandedMinId}/lines`, { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: expandedMinId !== null,
  });

  // Create MIN mutation
  const createMinMutation = useMutation({
    mutationFn: async (minData: any) => {
      await apiRequest('POST', '/api/mins', minData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "MIN created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mins'] });
      setShowCreateForm(false);
      setLines([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create MIN",
        variant: "destructive",
      });
    },
  });

  const handleCreateMin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate lines if any exist
    if (lines.length > 0) {
      const invalidLines = lines.filter(line => !line.itemId || line.quantity <= 0);
      if (invalidLines.length > 0) {
        toast({
          title: "Validation Error",
          description: "Please select an item and enter a valid quantity (greater than 0) for all line items",
          variant: "destructive",
        });
        return;
      }
    }
    
    const formData = new FormData(event.currentTarget);
    const minData = {
      warehouseId: parseInt(formData.get('warehouseId') as string),
      workOrderId: formData.get('workOrderId') ? parseInt(formData.get('workOrderId') as string) : null,
      department: formData.get('department'),
      issueDate: formData.get('issueDate'),
      purpose: formData.get('purpose'),
      purposeAr: formData.get('purposeAr'),
      notes: formData.get('notes'),
      lines: lines.length > 0 ? lines : undefined,
    };
    createMinMutation.mutate(minData);
  };

  const addLine = () => {
    setLines([...lines, { itemId: 0, quantity: 0, binId: null }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setLines(updatedLines);
  };

  const filteredMins = mins?.data?.filter((min: any) => {
    const matchesSearch = !searchTerm || 
      min.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      min.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || min.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="material-issue-title">
            {t('materialIssue.title', 'Material Issue Notes (MIN)')}
          </h2>
          <p className="text-muted-foreground" data-testid="material-issue-subtitle">
            {t('materialIssue.subtitle', 'Issue materials for production and operations')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowScanMode(true)}
            data-testid="scan-issue-button"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {t('materialIssue.scanIssue', 'Scan Issue')}
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            data-testid="create-min-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('materialIssue.createMin', 'Create MIN')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Today's Issues</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="todays-issues">
                  {mins?.data?.filter((min: any) => 
                    min.issueDate === new Date().toISOString().split('T')[0]
                  ).length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ArrowUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Issues</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="pending-issues">
                  {mins?.data?.filter((min: any) => min.status === 'pending').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Completed Issues</p>
                <p className="text-2xl font-bold text-green-600" data-testid="completed-issues">
                  {mins?.data?.filter((min: any) => min.status === 'completed').length || 0}
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
                <p className="text-muted-foreground text-sm">Total MINs</p>
                <p className="text-2xl font-bold" data-testid="total-mins">
                  {mins?.data?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-alt text-purple-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('materialIssue.searchPlaceholder', 'Search MINs...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-mins"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MINs List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('materialIssue.listTitle', 'Material Issue Notes')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" data-testid="mins-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">MIN Number</th>
                    <th className="text-left p-3 font-medium">Work Order</th>
                    <th className="text-left p-3 font-medium">Department</th>
                    <th className="text-left p-3 font-medium">Issue Date</th>
                    <th className="text-left p-3 font-medium">Warehouse</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMins.map((min: any, index: number) => (
                    <>
                      <tr 
                        key={min.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer" 
                        onClick={() => setExpandedMinId(expandedMinId === min.id ? null : min.id)}
                        data-testid={`min-row-${index}`}
                      >
                        <td className="p-3 font-mono text-sm" data-testid={`min-number-${index}`}>
                          {min.number}
                        </td>
                        <td className="p-3 font-mono text-sm" data-testid={`min-wo-number-${index}`}>
                          {min.workOrder?.number || 'N/A'}
                        </td>
                        <td className="p-3" data-testid={`min-department-${index}`}>
                          {min.department || 'N/A'}
                        </td>
                        <td className="p-3" data-testid={`min-issue-date-${index}`}>
                          {min.issueDate}
                        </td>
                        <td className="p-3" data-testid={`min-warehouse-${index}`}>
                          {min.warehouse?.name}
                        </td>
                        <td className="p-3" data-testid={`min-status-${index}`}>
                          <StatusBadge status={min.status} />
                        </td>
                        <td className="p-3">
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); }}
                            data-testid={`min-view-${index}`}
                          >
                            View
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); }}
                            data-testid={`min-print-${index}`}
                          >
                            Print
                          </Button>
                        </td>
                      </tr>
                      {expandedMinId === min.id && (
                        <tr key={`${min.id}-lines`} className="bg-muted/30">
                          <td colSpan={7} className="p-4">
                            <div className="pl-8">
                              <h4 className="font-semibold mb-2">Line Items:</h4>
                              {minLines?.data?.length > 0 ? (
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left p-2">Item</th>
                                      <th className="text-left p-2">Quantity</th>
                                      <th className="text-left p-2">Bin</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {minLines.data.map((line: any, lineIndex: number) => (
                                      <tr key={line.id} className="border-b">
                                        <td className="p-2" data-testid={`min-line-item-${lineIndex}`}>
                                          {line.item?.name || `Item #${line.itemId}`}
                                        </td>
                                        <td className="p-2" data-testid={`min-line-quantity-${lineIndex}`}>
                                          {line.quantity}
                                        </td>
                                        <td className="p-2" data-testid={`min-line-bin-${lineIndex}`}>
                                          {line.bin?.name || 'N/A'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-muted-foreground text-sm" data-testid="no-min-lines">
                                  No line items found
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {filteredMins.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground" data-testid="no-mins">
                        {t('materialIssue.noData', 'No MINs found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create MIN Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-min-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create New MIN</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setLines([]);
                }}
                data-testid="close-create-modal"
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleCreateMin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warehouseId">Warehouse *</Label>
                  <Select name="warehouseId" required>
                    <SelectTrigger data-testid="warehouse-select">
                      <SelectValue placeholder="Select warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.data?.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workOrderId">Work Order (Optional)</Label>
                  <Select name="workOrderId">
                    <SelectTrigger data-testid="work-order-select">
                      <SelectValue placeholder="Select work order..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Work Order</SelectItem>
                      {workOrders?.data?.map((wo: any) => (
                        <SelectItem key={wo.id} value={wo.id.toString()}>
                          {wo.number} - {wo.item?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    data-testid="department-input"
                  />
                </div>

                <div>
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    type="date"
                    id="issueDate"
                    name="issueDate"
                    required
                    data-testid="issue-date-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="purpose">Purpose (English)</Label>
                <Textarea
                  id="purpose"
                  name="purpose"
                  rows={3}
                  data-testid="purpose-input"
                />
              </div>

              <div>
                <Label htmlFor="purposeAr">Purpose (Arabic)</Label>
                <Textarea
                  id="purposeAr"
                  name="purposeAr"
                  rows={3}
                  className="text-right"
                  dir="rtl"
                  data-testid="purpose-ar-input"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  data-testid="notes-input"
                />
              </div>

              {/* Line Items Section */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    {t('materialIssue.lineItems', 'Line Items')}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLine}
                    data-testid="add-line-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('materialIssue.addLine', 'Add Line')}
                  </Button>
                </div>

                {lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('materialIssue.noLinesAdded', 'No line items added yet. Click "Add Line" to add items.')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lines.map((line, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg bg-muted/20">
                        <div className="col-span-5">
                          <Label className="text-xs">Item *</Label>
                          <Select
                            value={line.itemId?.toString() || ""}
                            onValueChange={(value) => updateLine(index, 'itemId', parseInt(value))}
                          >
                            <SelectTrigger data-testid={`line-item-${index}`}>
                              <SelectValue placeholder="Select item..." />
                            </SelectTrigger>
                            <SelectContent>
                              {items?.data?.map((item: any) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.code} - {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-3">
                          <Label className="text-xs">Quantity *</Label>
                          <Input
                            type="number"
                            value={line.quantity || 0}
                            onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="any"
                            data-testid={`line-quantity-${index}`}
                          />
                        </div>

                        <div className="col-span-3">
                          <Label className="text-xs">Bin</Label>
                          <Select
                            value={line.binId?.toString() || "none"}
                            onValueChange={(value) => updateLine(index, 'binId', value === "none" ? null : parseInt(value))}
                          >
                            <SelectTrigger data-testid={`line-bin-${index}`}>
                              <SelectValue placeholder="Select bin..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Bin</SelectItem>
                              {bins?.data?.map((bin: any) => (
                                <SelectItem key={bin.id} value={bin.id.toString()}>
                                  {bin.code} - {bin.warehouse?.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(index)}
                            data-testid={`remove-line-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={createMinMutation.isPending}
                  data-testid="submit-min"
                >
                  {createMinMutation.isPending ? 'Creating...' : 'Create MIN'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setLines([]);
                  }}
                  data-testid="cancel-min-creation"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
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
                {t('materialIssue.scanIssue', 'Scan Issue')}
              </h3>
              <p className="text-muted-foreground text-sm">
                Scan item barcode for issue
              </p>
            </div>
            
            <ScanInput 
              placeholder="Scan or enter item code..."
              onScan={(code) => {
                toast({
                  title: "Scanned",
                  description: `Item code: ${code}`,
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
    </div>
  );
}
