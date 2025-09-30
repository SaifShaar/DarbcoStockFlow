import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/ui/status-badge";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, RefreshCw, TrendingUp, TrendingDown, Building2, Trash2 } from "lucide-react";

export default function TransfersAdjustmentsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Transfer line items state
  const [transferLines, setTransferLines] = useState<Array<{ 
    itemId: number | null; 
    quantity: number; 
    fromBinId: number | null;
    toBinId: number | null;
  }>>([]);
  
  // Adjustment line items state
  const [adjustmentLines, setAdjustmentLines] = useState<Array<{ 
    itemId: number | null; 
    quantity: number;
    adjustmentType: 'increase' | 'decrease';
    binId: number | null;
  }>>([]);

  // Fetch Transfers
  const { data: transfers, isLoading: transfersLoading } = useQuery<any>({
    queryKey: ['/api/transfers', { status: statusFilter }],
    queryFn: async () => {
      const response = await fetch('/api/transfers', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch Adjustments
  const { data: adjustments, isLoading: adjustmentsLoading } = useQuery<any>({
    queryKey: ['/api/adjustments', { status: statusFilter }],
    queryFn: async () => {
      const response = await fetch('/api/adjustments', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch warehouses for dropdowns
  const { data: warehouses } = useQuery<any>({
    queryKey: ['/api/warehouses'],
    queryFn: async () => {
      const response = await fetch('/api/warehouses', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch items for dropdowns
  const { data: items } = useQuery<any>({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const response = await fetch('/api/items', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch bins for dropdowns
  const { data: bins } = useQuery<any>({
    queryKey: ['/api/bins'],
    queryFn: async () => {
      const response = await fetch('/api/bins', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Transfer line items functions
  const addTransferLine = () => {
    setTransferLines([...transferLines, { itemId: null, quantity: 0, fromBinId: null, toBinId: null }]);
  };

  const removeTransferLine = (index: number) => {
    setTransferLines(transferLines.filter((_, i) => i !== index));
  };

  const updateTransferLine = (index: number, field: string, value: any) => {
    const updatedLines = [...transferLines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setTransferLines(updatedLines);
  };

  // Adjustment line items functions
  const addAdjustmentLine = () => {
    setAdjustmentLines([...adjustmentLines, { itemId: null, quantity: 0, adjustmentType: 'increase', binId: null }]);
  };

  const removeAdjustmentLine = (index: number) => {
    setAdjustmentLines(adjustmentLines.filter((_, i) => i !== index));
  };

  const updateAdjustmentLine = (index: number, field: string, value: any) => {
    const updatedLines = [...adjustmentLines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setAdjustmentLines(updatedLines);
  };

  // Create Transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      await apiRequest('POST', '/api/transfers', transferData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      setShowTransferForm(false);
      setTransferLines([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create transfer",
        variant: "destructive",
      });
    },
  });

  // Create Adjustment mutation
  const createAdjustmentMutation = useMutation({
    mutationFn: async (adjustmentData: any) => {
      await apiRequest('POST', '/api/adjustments', adjustmentData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Adjustment created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/adjustments'] });
      setShowAdjustmentForm(false);
      setAdjustmentLines([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create adjustment",
        variant: "destructive",
      });
    },
  });

  const handleCreateTransfer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate lines if any exist
    if (transferLines.length > 0) {
      const invalidLines = transferLines.filter(line => !line.itemId || line.quantity <= 0);
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
    const transferData = {
      fromWarehouseId: parseInt(formData.get('fromWarehouseId') as string),
      toWarehouseId: parseInt(formData.get('toWarehouseId') as string),
      transferDate: formData.get('transferDate'),
      notes: formData.get('notes'),
      items: transferLines.map(line => ({
        itemId: line.itemId,
        quantity: line.quantity,
        fromBinId: line.fromBinId,
        toBinId: line.toBinId
      })),
    };
    createTransferMutation.mutate(transferData);
  };

  const handleCreateAdjustment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate lines if any exist
    if (adjustmentLines.length > 0) {
      const invalidLines = adjustmentLines.filter(line => !line.itemId || line.quantity <= 0);
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
    const adjustmentData = {
      warehouseId: parseInt(formData.get('warehouseId') as string),
      adjustmentDate: formData.get('adjustmentDate'),
      reason: formData.get('reason'),
      reasonAr: formData.get('reasonAr'),
      notes: formData.get('notes'),
      items: adjustmentLines.map(line => ({
        itemId: line.itemId,
        quantity: line.quantity,
        adjustmentType: line.adjustmentType,
        binId: line.binId
      })),
    };
    createAdjustmentMutation.mutate(adjustmentData);
  };

  const filteredTransfers = (transfers?.data || []).filter((transfer: any) => {
    const matchesSearch = !searchTerm || 
      transfer.transferNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.fromWarehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toWarehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredAdjustments = (adjustments?.data || []).filter((adjustment: any) => {
    const matchesSearch = !searchTerm || 
      adjustment.adjustmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adjustment.warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adjustment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="transfers-adjustments-title">
            {t('transfersAdjustments.title', 'Transfers & Adjustments')}
          </h2>
          <p className="text-muted-foreground" data-testid="transfers-adjustments-subtitle">
            {t('transfersAdjustments.subtitle', 'Manage inventory transfers between warehouses and stock adjustments')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Transfers</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="pending-transfers-count">
                  {(transfers?.data || []).filter((t: any) => t.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Recent Adjustments</p>
                <p className="text-2xl font-bold text-green-600" data-testid="recent-adjustments-count">
                  {(adjustments?.data || []).filter((a: any) => {
                    const adjustmentDate = new Date(a.adjustmentDate);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return adjustmentDate >= weekAgo;
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Warehouses</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="active-warehouses-count">
                  {(warehouses?.data || []).filter((w: any) => w.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('transfersAdjustments.searchPlaceholder', 'Search transfers and adjustments...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-transfers-adjustments"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Transfers and Adjustments */}
      <Tabs defaultValue="transfers" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="transfers" data-testid="transfers-tab">
              {t('transfersAdjustments.transfers', 'Transfers')}
            </TabsTrigger>
            <TabsTrigger value="adjustments" data-testid="adjustments-tab">
              {t('transfersAdjustments.adjustments', 'Adjustments')}
            </TabsTrigger>
          </TabsList>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowTransferForm(true)}
              data-testid="create-transfer-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('transfersAdjustments.createTransfer', 'Create Transfer')}
            </Button>
            <Button
              onClick={() => setShowAdjustmentForm(true)}
              variant="outline"
              data-testid="create-adjustment-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('transfersAdjustments.createAdjustment', 'Create Adjustment')}
            </Button>
          </div>
        </div>

        {/* Transfers Tab */}
        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>{t('transfersAdjustments.transfersList', 'Inventory Transfers')}</CardTitle>
            </CardHeader>
            <CardContent>
              {transfersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTransfers.map((transfer: any, index: number) => (
                    <div key={transfer.id} className="p-4 border rounded-lg" data-testid={`transfer-item-${index}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium" data-testid={`transfer-number-${index}`}>
                              {transfer.transferNumber || `TR-${transfer.id}`}
                            </h3>
                            <StatusBadge status={transfer.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <RefreshCw className="h-3 w-3 inline mr-1" />
                            From: {transfer.fromWarehouse?.name} → To: {transfer.toWarehouse?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Transfer Date: {new Date(transfer.transferDate).toLocaleDateString()}
                          </p>
                          {transfer.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {transfer.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {transfer.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredTransfers.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground" data-testid="no-transfers">
                      {t('transfersAdjustments.noTransfers', 'No transfers found')}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adjustments Tab */}
        <TabsContent value="adjustments">
          <Card>
            <CardHeader>
              <CardTitle>{t('transfersAdjustments.adjustmentsList', 'Stock Adjustments')}</CardTitle>
            </CardHeader>
            <CardContent>
              {adjustmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAdjustments.map((adjustment: any, index: number) => (
                    <div key={adjustment.id} className="p-4 border rounded-lg" data-testid={`adjustment-item-${index}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium" data-testid={`adjustment-number-${index}`}>
                              {adjustment.adjustmentNumber || `ADJ-${adjustment.id}`}
                            </h3>
                            <StatusBadge status={adjustment.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3 inline mr-1" />
                            Warehouse: {adjustment.warehouse?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Reason: {adjustment.reason}
                            {adjustment.reasonAr && (
                              <span className="mr-2" dir="rtl"> - {adjustment.reasonAr}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Adjustment Date: {new Date(adjustment.adjustmentDate).toLocaleDateString()}
                          </p>
                          {adjustment.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {adjustment.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {adjustment.items?.length || 0} items
                          </p>
                          <div className="flex items-center text-xs mt-1">
                            {adjustment.adjustmentType === 'increase' ? (
                              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                            )}
                            <span className={adjustment.adjustmentType === 'increase' ? 'text-green-600' : 'text-red-600'}>
                              {adjustment.adjustmentType === 'increase' ? 'Increase' : 'Decrease'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredAdjustments.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground" data-testid="no-adjustments">
                      {t('transfersAdjustments.noAdjustments', 'No adjustments found')}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Transfer Modal */}
      {showTransferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-transfer-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create Inventory Transfer</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTransferForm(false)}
                data-testid="close-transfer-modal"
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromWarehouseId">From Warehouse *</Label>
                  <Select name="fromWarehouseId" required>
                    <SelectTrigger data-testid="from-warehouse-select">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {(warehouses?.data || []).map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="toWarehouseId">To Warehouse *</Label>
                  <Select name="toWarehouseId" required>
                    <SelectTrigger data-testid="to-warehouse-select">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {(warehouses?.data || []).map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="transferDate">Transfer Date *</Label>
                <Input
                  type="date"
                  id="transferDate"
                  name="transferDate"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  data-testid="transfer-date-input"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  data-testid="transfer-notes-input"
                />
              </div>

              {/* Line Items Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Transfer Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTransferLine}
                    data-testid="add-transfer-line"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Line
                  </Button>
                </div>
                
                {transferLines.length > 0 && (
                  <div className="space-y-3">
                    {transferLines.map((line, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 p-3 border rounded-lg bg-muted/50">
                        <div className="col-span-4">
                          <Label className="text-xs">Item *</Label>
                          <Select
                            value={line.itemId?.toString() || ""}
                            onValueChange={(value) => updateTransferLine(index, 'itemId', parseInt(value))}
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

                        <div className="col-span-2">
                          <Label className="text-xs">Quantity *</Label>
                          <Input
                            type="number"
                            value={line.quantity || 0}
                            onChange={(e) => updateTransferLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="any"
                            data-testid={`line-quantity-${index}`}
                          />
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs">From Bin</Label>
                          <Select
                            value={line.fromBinId?.toString() || "none"}
                            onValueChange={(value) => updateTransferLine(index, 'fromBinId', value === "none" ? null : parseInt(value))}
                          >
                            <SelectTrigger data-testid={`line-from-bin-${index}`}>
                              <SelectValue placeholder="Select bin..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Bin</SelectItem>
                              {bins?.data?.map((bin: any) => (
                                <SelectItem key={bin.id} value={bin.id.toString()}>
                                  {bin.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-3">
                          <Label className="text-xs">To Bin</Label>
                          <Select
                            value={line.toBinId?.toString() || "none"}
                            onValueChange={(value) => updateTransferLine(index, 'toBinId', value === "none" ? null : parseInt(value))}
                          >
                            <SelectTrigger data-testid={`line-to-bin-${index}`}>
                              <SelectValue placeholder="Select bin..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Bin</SelectItem>
                              {bins?.data?.map((bin: any) => (
                                <SelectItem key={bin.id} value={bin.id.toString()}>
                                  {bin.code}
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
                            onClick={() => removeTransferLine(index)}
                            data-testid={`remove-transfer-line-${index}`}
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
                  disabled={createTransferMutation.isPending}
                  data-testid="submit-transfer"
                >
                  {createTransferMutation.isPending ? 'Creating...' : 'Create Transfer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTransferForm(false)}
                  data-testid="cancel-transfer-creation"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Adjustment Modal */}
      {showAdjustmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-adjustment-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create Stock Adjustment</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdjustmentForm(false)}
                data-testid="close-adjustment-modal"
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-4">
              <div>
                <Label htmlFor="warehouseId">Warehouse *</Label>
                <Select name="warehouseId" required>
                  <SelectTrigger data-testid="adjustment-warehouse-select">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {(warehouses?.data || []).map((warehouse: any) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="adjustmentDate">Adjustment Date *</Label>
                <Input
                  type="date"
                  id="adjustmentDate"
                  name="adjustmentDate"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  data-testid="adjustment-date-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reason">Reason (English) *</Label>
                  <Input
                    id="reason"
                    name="reason"
                    required
                    data-testid="adjustment-reason-input"
                  />
                </div>
                <div>
                  <Label htmlFor="reasonAr">Reason (Arabic)</Label>
                  <Input
                    id="reasonAr"
                    name="reasonAr"
                    className="text-right"
                    dir="rtl"
                    data-testid="adjustment-reason-ar-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  data-testid="adjustment-notes-input"
                />
              </div>

              {/* Line Items Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Adjustment Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAdjustmentLine}
                    data-testid="add-adjustment-line"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Line
                  </Button>
                </div>
                
                {adjustmentLines.length > 0 && (
                  <div className="space-y-3">
                    {adjustmentLines.map((line, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 p-3 border rounded-lg bg-muted/50">
                        <div className="col-span-4">
                          <Label className="text-xs">Item *</Label>
                          <Select
                            value={line.itemId?.toString() || ""}
                            onValueChange={(value) => updateAdjustmentLine(index, 'itemId', parseInt(value))}
                          >
                            <SelectTrigger data-testid={`adj-line-item-${index}`}>
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

                        <div className="col-span-2">
                          <Label className="text-xs">Quantity *</Label>
                          <Input
                            type="number"
                            value={line.quantity || 0}
                            onChange={(e) => updateAdjustmentLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="any"
                            data-testid={`adj-line-quantity-${index}`}
                          />
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs">Type *</Label>
                          <Select
                            value={line.adjustmentType}
                            onValueChange={(value) => updateAdjustmentLine(index, 'adjustmentType', value)}
                          >
                            <SelectTrigger data-testid={`adj-line-type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="increase">
                                <div className="flex items-center">
                                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                                  Increase
                                </div>
                              </SelectItem>
                              <SelectItem value="decrease">
                                <div className="flex items-center">
                                  <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                                  Decrease
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-3">
                          <Label className="text-xs">Bin</Label>
                          <Select
                            value={line.binId?.toString() || "none"}
                            onValueChange={(value) => updateAdjustmentLine(index, 'binId', value === "none" ? null : parseInt(value))}
                          >
                            <SelectTrigger data-testid={`adj-line-bin-${index}`}>
                              <SelectValue placeholder="Select bin..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Bin</SelectItem>
                              {bins?.data?.map((bin: any) => (
                                <SelectItem key={bin.id} value={bin.id.toString()}>
                                  {bin.code}
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
                            onClick={() => removeAdjustmentLine(index)}
                            data-testid={`remove-adjustment-line-${index}`}
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
                  disabled={createAdjustmentMutation.isPending}
                  data-testid="submit-adjustment"
                >
                  {createAdjustmentMutation.isPending ? 'Creating...' : 'Create Adjustment'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdjustmentForm(false)}
                  data-testid="cancel-adjustment-creation"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}