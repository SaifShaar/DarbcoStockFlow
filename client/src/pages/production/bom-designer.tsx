import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Save, 
  Upload, 
  Trash2, 
  GripVertical, 
  Box, 
  Settings 
} from "lucide-react";

interface BomLineProps {
  line: any;
  onUpdate: (id: number, data: any) => void;
  onDelete: (id: number) => void;
  items: any[];
  stockLevels: any;
}

function BomLine({ line, onUpdate, onDelete, items, stockLevels }: BomLineProps) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(line.quantity);
  const [wastagePercent, setWastagePercent] = useState(line.wastagePercent || 0);

  const handleSave = () => {
    onUpdate(line.id, { quantity, wastagePercent });
    setEditing(false);
  };

  // Calculate stock availability for this component
  const getStockInfo = () => {
    const stockData = stockLevels?.data || [];
    const itemStock = stockData.find((stock: any) => 
      stock.itemId === line.componentItemId
    );
    
    const onHand = parseFloat(itemStock?.quantity || '0');
    const available = parseFloat(itemStock?.availableQuantity || '0');
    const required = parseFloat(quantity);
    const withWastage = required * (1 + (wastagePercent / 100));
    
    return {
      onHand,
      available,
      required,
      withWastage,
      canProduce: available >= withWastage,
      shortage: Math.max(0, withWastage - available),
    };
  };

  const stockInfo = getStockInfo();

  return (
    <div className={`bg-muted p-3 rounded border-l-2 ${stockInfo.canProduce ? 'border-green-400' : 'border-red-400'}`} data-testid={`bom-line-${line.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <Box className="h-4 w-4 text-blue-600" />
          <div>
            <p className="font-medium text-sm" data-testid={`bom-line-name-${line.id}`}>
              {line.componentItem?.name}
            </p>
            <p className="text-xs text-muted-foreground" data-testid={`bom-line-code-${line.id}`}>
              {line.componentItem?.code}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {editing ? (
            <>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-16 text-xs"
                step="0.01"
                data-testid={`bom-line-quantity-edit-${line.id}`}
              />
              <span className="text-xs text-muted-foreground">{line.uom}</span>
              <Input
                type="number"
                value={wastagePercent}
                onChange={(e) => setWastagePercent(parseFloat(e.target.value) || 0)}
                className="w-16 text-xs"
                step="0.1"
                placeholder="Wastage %"
                data-testid={`bom-line-wastage-edit-${line.id}`}
              />
              <Button size="sm" onClick={handleSave} data-testid={`bom-line-save-${line.id}`}>
                <Save className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <div className="text-xs space-y-1">
                <div className="font-medium" data-testid={`bom-line-quantity-${line.id}`}>
                  {quantity} {line.uom}
                </div>
                <div className="text-muted-foreground" data-testid={`bom-line-wastage-${line.id}`}>
                  {wastagePercent}% waste
                </div>
              </div>
              <div className="text-xs space-y-1">
                <div className={stockInfo.canProduce ? "text-green-600" : "text-red-600"} data-testid={`bom-line-stock-${line.id}`}>
                  Stock: {stockInfo.available.toLocaleString()} {line.uom}
                </div>
                {!stockInfo.canProduce && (
                  <div className="text-red-600 font-medium" data-testid={`bom-line-shortage-${line.id}`}>
                    Short: {stockInfo.shortage.toLocaleString()} {line.uom}
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setEditing(true)}
                data-testid={`bom-line-edit-${line.id}`}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onDelete(line.id)}
            className="text-red-600 hover:text-red-700"
            data-testid={`bom-line-delete-${line.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BomDesignerPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedParentItem, setSelectedParentItem] = useState<string>("");
  const [selectedBomId, setSelectedBomId] = useState<number | null>(null);
  const [newComponentItemId, setNewComponentItemId] = useState<string>("");
  const [newComponentQuantity, setNewComponentQuantity] = useState<number>(1);
  const [newComponentWastage, setNewComponentWastage] = useState<number>(0);

  // Fetch items for parent selection and component addition
  const { data: items } = useQuery<any>({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const response = await fetch('/api/items', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch BOMs for selected parent item
  const { data: boms } = useQuery<any>({
    queryKey: ['/api/boms/parent', selectedParentItem],
    queryFn: async () => {
      const response = await fetch(`/api/boms/parent/${selectedParentItem}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!selectedParentItem,
  });

  // Fetch BOM lines for selected BOM
  const { data: bomLines } = useQuery<any>({
    queryKey: ['/api/boms', selectedBomId, 'lines'],
    queryFn: async () => {
      const response = await fetch(`/api/boms/${selectedBomId}/lines`, { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!selectedBomId,
  });

  // Fetch stock levels for BOM analysis
  const { data: stockLevels } = useQuery<any>({
    queryKey: ['/api/stock-levels'],
    queryFn: async () => {
      const response = await fetch('/api/stock-levels', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Get selected BOM details
  const selectedBom = (boms?.data || []).find((bom: any) => bom.id === selectedBomId);

  // Create BOM mutation
  const createBomMutation = useMutation({
    mutationFn: async (bomData: any) => {
      await apiRequest('POST', '/api/boms', bomData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "BOM created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/boms/parent', selectedParentItem] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create BOM",
        variant: "destructive",
      });
    },
  });

  // Add BOM line mutation
  const addBomLineMutation = useMutation({
    mutationFn: async (lineData: any) => {
      await apiRequest('POST', '/api/bom-lines', lineData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Component added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/boms', selectedBomId, 'lines'] });
      setNewComponentItemId("");
      setNewComponentQuantity(1);
      setNewComponentWastage(0);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add component",
        variant: "destructive",
      });
    },
  });

  // Update BOM line mutation
  const updateBomLineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest('PUT', `/api/bom-lines/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boms', selectedBomId, 'lines'] });
    },
  });

  // Delete BOM line mutation
  const deleteBomLineMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/bom-lines/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Component removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/boms', selectedBomId, 'lines'] });
    },
  });

  // Activate BOM mutation
  const activateBomMutation = useMutation({
    mutationFn: async (bomId: number) => {
      await apiRequest('PUT', `/api/boms/${bomId}/activate`, { parentItemId: selectedParentItem });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "BOM activated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/boms/parent', selectedParentItem] });
    },
  });

  const handleCreateNewBom = () => {
    if (!selectedParentItem) {
      toast({
        title: "Error",
        description: "Please select a parent item first",
        variant: "destructive",
      });
      return;
    }

    const version = `1.${((boms?.data || []).length) + 1}`;
    createBomMutation.mutate({
      parentItemId: parseInt(selectedParentItem),
      version,
      effectiveDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleAddComponent = () => {
    if (!selectedBomId || !newComponentItemId) {
      toast({
        title: "Error",
        description: "Please select a BOM and component item",
        variant: "destructive",
      });
      return;
    }

    const selectedItem = (items?.data || []).find((item: any) => item.id.toString() === newComponentItemId);
    
    addBomLineMutation.mutate({
      bomId: selectedBomId,
      componentItemId: parseInt(newComponentItemId),
      quantity: newComponentQuantity.toString(),
      uom: selectedItem?.uom || 'PCS',
      wastagePercent: newComponentWastage.toString(),
      sortOrder: ((bomLines?.data || []).length) + 1,
    });
  };

  const handleUpdateBomLine = useCallback((id: number, data: any) => {
    // Convert numeric fields to strings for decimal schema
    const formattedData = {
      ...data,
      quantity: data.quantity ? data.quantity.toString() : data.quantity,
      wastagePercent: data.wastagePercent ? data.wastagePercent.toString() : data.wastagePercent,
    };
    updateBomLineMutation.mutate({ id, data: formattedData });
  }, [updateBomLineMutation]);

  const handleDeleteBomLine = useCallback((id: number) => {
    deleteBomLineMutation.mutate(id);
  }, [deleteBomLineMutation]);

  // Calculate production feasibility
  const calculateProductionInfo = () => {
    const bomData = bomLines?.data || [];
    const stockData = stockLevels?.data || [];
    
    if (bomData.length === 0 || stockData.length === 0) {
      return { maxUnits: 0, constrainingItem: null, allComponentsAvailable: false };
    }

    let maxUnits = Infinity;
    let constrainingItem = null;
    let allComponentsAvailable = true;

    bomData.forEach((line: any) => {
      const itemStock = stockData.find((stock: any) => 
        stock.itemId === line.componentItemId
      );
      
      const available = parseFloat(itemStock?.availableQuantity || '0');
      const required = parseFloat(line.quantity);
      const withWastage = required * (1 + ((line.wastagePercent || 0) / 100));
      
      if (withWastage > 0) {
        const possibleUnits = Math.floor(available / withWastage);
        
        if (possibleUnits < maxUnits) {
          maxUnits = possibleUnits;
          constrainingItem = line.componentItem?.name || 'Unknown Item';
        }
        
        if (available < withWastage) {
          allComponentsAvailable = false;
        }
      }
    });

    return {
      maxUnits: maxUnits === Infinity ? 0 : maxUnits,
      constrainingItem,
      allComponentsAvailable,
    };
  };

  const productionInfo = calculateProductionInfo();

  // Calculate total cost (mock calculation)
  const materialCost = bomLines?.data?.reduce((sum: number, line: any) => {
    return sum + (parseFloat(line.quantity) * 10); // Mock unit cost
  }, 0) || 0;

  const laborCost = materialCost * 0.2; // 20% of material
  const overhead = materialCost * 0.15; // 15% of material
  const totalCost = materialCost + laborCost + overhead;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="bom-designer-title">
            {t('bomDesigner.title', 'BOM Designer')}
          </h2>
          <p className="text-muted-foreground" data-testid="bom-designer-subtitle">
            {t('bomDesigner.subtitle', 'Create and manage bill of materials')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" data-testid="import-bom-button">
            <Upload className="h-4 w-4 mr-2" />
            {t('bomDesigner.importBom', 'Import')}
          </Button>
          <Button 
            onClick={() => selectedBomId && activateBomMutation.mutate(selectedBomId)}
            disabled={!selectedBomId || selectedBom?.isActive}
            data-testid="save-version-button"
          >
            <Save className="h-4 w-4 mr-2" />
            {t('bomDesigner.saveVersion', 'Save Version')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BOM Tree Structure */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('bomDesigner.assemblyTree', 'Assembly Tree')}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {t('bomDesigner.parentItem', 'Parent Item:')}
              </span>
              <Select value={selectedParentItem} onValueChange={setSelectedParentItem}>
                <SelectTrigger className="w-64" data-testid="parent-item-select">
                  <SelectValue placeholder="Select parent item..." />
                </SelectTrigger>
                <SelectContent>
                  {items?.data?.map((item: any) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} ({item.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* BOM Version Selection */}
          {selectedParentItem && (
            <div className="mb-4 flex items-center space-x-3">
              <Label>BOM Version:</Label>
              <Select 
                value={selectedBomId?.toString() || ""} 
                onValueChange={(value) => setSelectedBomId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-48" data-testid="bom-version-select">
                  <SelectValue placeholder="Select BOM version..." />
                </SelectTrigger>
                <SelectContent>
                  {boms?.data?.map((bom: any) => (
                    <SelectItem key={bom.id} value={bom.id.toString()}>
                      Version {bom.version} {bom.isActive ? '(Active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                onClick={handleCreateNewBom}
                data-testid="create-new-bom-button"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Version
              </Button>
            </div>
          )}
          
          {/* Root Item */}
          {selectedParentItem && selectedBomId && (
            <div className="space-y-2">
              <div className="bg-primary/5 border-l-4 border-primary p-4 rounded" data-testid="root-item">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Box className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium" data-testid="root-item-name">
                        {items?.data?.find((item: any) => item.id.toString() === selectedParentItem)?.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid="root-item-details">
                        {items?.data?.find((item: any) => item.id.toString() === selectedParentItem)?.code} | 
                        Version {selectedBom?.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Qty: 1 PCS</span>
                  </div>
                </div>
              </div>
              
              {/* Child Components */}
              <div className="ml-8 space-y-2">
                {bomLines?.data?.map((line: any) => (
                  <BomLine
                    key={line.id}
                    line={line}
                    onUpdate={handleUpdateBomLine}
                    onDelete={handleDeleteBomLine}
                    items={items?.data || []}
                    stockLevels={stockLevels}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Add Component Form */}
          {selectedBomId && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">{t('bomDesigner.addComponent', 'Add Component')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select value={newComponentItemId} onValueChange={setNewComponentItemId}>
                  <SelectTrigger data-testid="component-item-select">
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items?.data?.map((item: any) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} ({item.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={newComponentQuantity}
                  onChange={(e) => setNewComponentQuantity(parseFloat(e.target.value) || 1)}
                  placeholder="Quantity"
                  min="0.01"
                  step="0.01"
                  data-testid="component-quantity-input"
                />
                <Input
                  type="number"
                  value={newComponentWastage}
                  onChange={(e) => setNewComponentWastage(parseFloat(e.target.value) || 0)}
                  placeholder="Wastage %"
                  min="0"
                  step="0.1"
                  data-testid="component-wastage-input"
                />
                <Button 
                  onClick={handleAddComponent}
                  disabled={!newComponentItemId || addBomLineMutation.isPending}
                  data-testid="add-component-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* BOM Properties */}
        <div className="space-y-6">
          {/* Production Planning */}
          {selectedBomId && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-medium mb-3">Production Planning</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Can Produce:</span>
                  <span className={`font-bold text-lg ${productionInfo.maxUnits > 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="max-production-units">
                    {productionInfo.maxUnits} units
                  </span>
                </div>
                {!productionInfo.allComponentsAvailable && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-700 dark:text-red-300">Stock Shortage</span>
                    </div>
                    {productionInfo.constrainingItem && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1" data-testid="constraining-item">
                        Limited by: {productionInfo.constrainingItem}
                      </p>
                    )}
                  </div>
                )}
                {productionInfo.allComponentsAvailable && productionInfo.maxUnits > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700 dark:text-green-300">Ready for Production</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Version Info */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium mb-3">{t('bomDesigner.versionInformation', 'Version Information')}</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Version</Label>
                <Input 
                  value={selectedBom?.version || ''} 
                  readOnly 
                  className="bg-muted"
                  data-testid="bom-version-display"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <Input 
                  value={selectedBom?.isActive ? 'Active' : 'Draft'} 
                  readOnly 
                  className="bg-muted"
                  data-testid="bom-status-display"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Effective Date</Label>
                <Input 
                  value={selectedBom?.effectiveDate || ''} 
                  readOnly 
                  className="bg-muted"
                  data-testid="bom-effective-date"
                />
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium mb-3">{t('bomDesigner.costSummary', 'Cost Summary')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material Cost:</span>
                <span className="font-medium" data-testid="material-cost">
                  {materialCost.toFixed(2)} JOD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labor Cost:</span>
                <span className="font-medium" data-testid="labor-cost">
                  {laborCost.toFixed(2)} JOD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overhead:</span>
                <span className="font-medium" data-testid="overhead-cost">
                  {overhead.toFixed(2)} JOD
                </span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between font-semibold">
                <span>Total Cost:</span>
                <span data-testid="total-cost">{totalCost.toFixed(2)} JOD</span>
              </div>
            </div>
          </div>

          {/* Production Settings */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium mb-3">{t('bomDesigner.productionSettings', 'Production Settings')}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="backflush" 
                  checked={selectedBom?.backflushEnabled || false}
                  data-testid="backflush-checkbox"
                />
                <Label htmlFor="backflush" className="text-sm">Enable Backflush</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="autoReserve" 
                  checked={selectedBom?.autoReserveEnabled || false}
                  data-testid="auto-reserve-checkbox"
                />
                <Label htmlFor="autoReserve" className="text-sm">Auto Reserve Components</Label>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Lead Time (Days)</Label>
                <Input 
                  type="number" 
                  value={selectedBom?.leadTime || 0} 
                  min="0"
                  data-testid="lead-time-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
