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
import { Plus, Search, QrCode, Truck, Package, Trash2 } from "lucide-react";

export default function ReceivingPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showScanMode, setShowScanMode] = useState(false);
  const [lines, setLines] = useState<Array<{ itemId: number; quantity: number; binId: number | null }>>([]);
  const [expandedGrnId, setExpandedGrnId] = useState<number | null>(null);

  // Fetch GRNs
  const { data: grns, isLoading } = useQuery<any>({
    queryKey: ['/api/grns', { status: statusFilter }],
    queryFn: async () => {
      const response = await fetch('/api/grns', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch suppliers and warehouses for dropdowns
  const { data: suppliers } = useQuery<any>({
    queryKey: ['/api/suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: warehouses } = useQuery<any>({
    queryKey: ['/api/warehouses'],
    queryFn: async () => {
      const response = await fetch('/api/warehouses', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: purchaseOrders } = useQuery<any>({
    queryKey: ['/api/purchase-orders', { status: 'approved' }],
    queryFn: async () => {
      const response = await fetch('/api/purchase-orders?status=approved', { credentials: 'include' });
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

  // Fetch GRN lines when expanded
  const { data: grnLines } = useQuery<any>({
    queryKey: ['/api/grns', expandedGrnId, 'lines'],
    queryFn: async () => {
      if (!expandedGrnId) return null;
      const response = await fetch(`/api/grns/${expandedGrnId}/lines`, { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: expandedGrnId !== null,
  });

  // Create GRN mutation
  const createGrnMutation = useMutation({
    mutationFn: async (grnData: any) => {
      await apiRequest('POST', '/api/grns', grnData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GRN created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grns'] });
      setShowCreateForm(false);
      setLines([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create GRN",
        variant: "destructive",
      });
    },
  });

  const handleCreateGrn = (event: React.FormEvent<HTMLFormElement>) => {
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
    const grnData = {
      poId: formData.get('poId') ? parseInt(formData.get('poId') as string) : null,
      supplierId: parseInt(formData.get('supplierId') as string),
      warehouseId: parseInt(formData.get('warehouseId') as string),
      receiptDate: formData.get('receiptDate'),
      invoiceNumber: formData.get('invoiceNumber'),
      deliveryNote: formData.get('deliveryNote'),
      transportCompany: formData.get('transportCompany'),
      notes: formData.get('notes'),
      inspectionRequired: formData.get('inspectionRequired') === 'on',
      lines: lines.length > 0 ? lines : undefined,
    };
    createGrnMutation.mutate(grnData);
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

  const filteredGrns = (grns?.data || []).filter((grn: any) => {
    const matchesSearch = !searchTerm || 
      grn.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || grn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="receiving-title">
            {t('receiving.title', 'Goods Receipt Notes (GRN)')}
          </h2>
          <p className="text-muted-foreground" data-testid="receiving-subtitle">
            {t('receiving.subtitle', 'Manage incoming deliveries and inspections')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowScanMode(true)}
            data-testid="scan-delivery-button"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {t('receiving.scanDelivery', 'Scan Delivery')}
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            data-testid="create-grn-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('receiving.createGrn', 'Create GRN')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Today's Receipts</p>
                <p className="text-2xl font-bold text-green-600" data-testid="todays-receipts">
                  {grns?.data?.filter((grn: any) => 
                    grn.receiptDate === new Date().toISOString().split('T')[0]
                  ).length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Inspection</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="pending-inspection">
                  {grns?.data?.filter((grn: any) => grn.inspectionRequired && !grn.inspectedAt).length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-search text-yellow-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Completed GRNs</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="completed-grns">
                  {grns?.data?.filter((grn: any) => grn.status === 'completed').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total GRNs</p>
                <p className="text-2xl font-bold" data-testid="total-grns">
                  {grns?.data?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clipboard-list text-purple-600"></i>
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
                  placeholder={t('receiving.searchPlaceholder', 'Search GRNs...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-grns"
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

      {/* GRNs List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('receiving.listTitle', 'Goods Receipt Notes')}</CardTitle>
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
              <table className="w-full border-collapse" data-testid="grns-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">GRN Number</th>
                    <th className="text-left p-3 font-medium">PO Number</th>
                    <th className="text-left p-3 font-medium">Supplier</th>
                    <th className="text-left p-3 font-medium">Receipt Date</th>
                    <th className="text-left p-3 font-medium">Warehouse</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrns.map((grn: any, index: number) => (
                    <>
                      <tr 
                        key={grn.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer" 
                        onClick={() => setExpandedGrnId(expandedGrnId === grn.id ? null : grn.id)}
                        data-testid={`grn-row-${index}`}
                      >
                        <td className="p-3 font-mono text-sm" data-testid={`grn-number-${index}`}>
                          {grn.number}
                        </td>
                        <td className="p-3 font-mono text-sm" data-testid={`grn-po-number-${index}`}>
                          {grn.purchaseOrder?.number || 'N/A'}
                        </td>
                        <td className="p-3" data-testid={`grn-supplier-${index}`}>
                          {grn.supplier?.name}
                        </td>
                        <td className="p-3" data-testid={`grn-receipt-date-${index}`}>
                          {grn.receiptDate}
                        </td>
                        <td className="p-3" data-testid={`grn-warehouse-${index}`}>
                          {grn.warehouse?.name}
                        </td>
                        <td className="p-3" data-testid={`grn-status-${index}`}>
                          <StatusBadge status={grn.status} />
                        </td>
                        <td className="p-3">
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); }}
                            data-testid={`grn-view-${index}`}
                          >
                            View
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); }}
                            data-testid={`grn-print-${index}`}
                          >
                            Print
                          </Button>
                        </td>
                      </tr>
                      {expandedGrnId === grn.id && (
                        <tr key={`${grn.id}-lines`} className="bg-muted/30">
                          <td colSpan={7} className="p-4">
                            <div className="pl-8">
                              <h4 className="font-semibold mb-2">Line Items:</h4>
                              {grnLines?.data?.length > 0 ? (
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left p-2">Item</th>
                                      <th className="text-left p-2">Quantity</th>
                                      <th className="text-left p-2">Bin</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {grnLines.data.map((line: any, lineIndex: number) => (
                                      <tr key={line.id} className="border-b">
                                        <td className="p-2" data-testid={`grn-line-item-${lineIndex}`}>
                                          {line.item?.name || `Item #${line.itemId}`}
                                        </td>
                                        <td className="p-2" data-testid={`grn-line-quantity-${lineIndex}`}>
                                          {line.quantity}
                                        </td>
                                        <td className="p-2" data-testid={`grn-line-bin-${lineIndex}`}>
                                          {line.bin?.name || 'N/A'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-muted-foreground text-sm" data-testid="no-grn-lines">
                                  No line items found
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {filteredGrns.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground" data-testid="no-grns">
                        {t('receiving.noData', 'No GRNs found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create GRN Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-grn-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{t('receiving.createTitle', 'Create New GRN')}</h3>
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

            <form onSubmit={handleCreateGrn} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="poId">{t('receiving.purchaseOrder', 'Purchase Order (Optional)')}</Label>
                  <Select name="poId">
                    <SelectTrigger data-testid="po-select">
                      <SelectValue placeholder="Select PO..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No PO</SelectItem>
                      {purchaseOrders?.data?.map((po: any) => (
                        <SelectItem key={po.id} value={po.id.toString()}>
                          {po.number} - {po.supplier?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="supplierId">{t('receiving.supplier', 'Supplier')} *</Label>
                  <Select name="supplierId" required>
                    <SelectTrigger data-testid="supplier-select">
                      <SelectValue placeholder="Select supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.data?.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warehouseId">{t('receiving.warehouse', 'Warehouse')} *</Label>
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
                  <Label htmlFor="receiptDate">{t('receiving.receiptDate', 'Receipt Date')} *</Label>
                  <Input
                    type="date"
                    id="receiptDate"
                    name="receiptDate"
                    required
                    data-testid="receipt-date-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">{t('receiving.invoiceNumber', 'Invoice Number')}</Label>
                  <Input
                    id="invoiceNumber"
                    name="invoiceNumber"
                    data-testid="invoice-number-input"
                  />
                </div>

                <div>
                  <Label htmlFor="deliveryNote">{t('receiving.deliveryNote', 'Delivery Note')}</Label>
                  <Input
                    id="deliveryNote"
                    name="deliveryNote"
                    data-testid="delivery-note-input"
                  />
                </div>

                <div>
                  <Label htmlFor="transportCompany">{t('receiving.transportCompany', 'Transport Company')}</Label>
                  <Input
                    id="transportCompany"
                    name="transportCompany"
                    data-testid="transport-company-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">{t('receiving.notes', 'Notes')}</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  data-testid="notes-input"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="inspectionRequired"
                  name="inspectionRequired"
                  className="rounded border-border"
                  data-testid="inspection-required-checkbox"
                />
                <Label htmlFor="inspectionRequired">
                  {t('receiving.inspectionRequired', 'Inspection Required')}
                </Label>
              </div>

              {/* Line Items Section */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    {t('receiving.lineItems', 'Line Items')}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLine}
                    data-testid="add-line-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('receiving.addLine', 'Add Line')}
                  </Button>
                </div>

                {lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('receiving.noLinesAdded', 'No line items added yet. Click "Add Line" to add items.')}
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
                  disabled={createGrnMutation.isPending}
                  data-testid="submit-grn"
                >
                  {createGrnMutation.isPending ? 'Creating...' : t('receiving.createGrn', 'Create GRN')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setLines([]);
                  }}
                  data-testid="cancel-grn-creation"
                >
                  {t('common.cancel', 'Cancel')}
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
                {t('receiving.scanDelivery', 'Scan Delivery')}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('receiving.scanInstruction', 'Scan delivery note or barcode')}
              </p>
            </div>
            
            <ScanInput 
              placeholder={t('receiving.scanPlaceholder', 'Scan or enter delivery code...')}
              onScan={(code) => {
                toast({
                  title: "Scanned",
                  description: `Code: ${code}`,
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
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
