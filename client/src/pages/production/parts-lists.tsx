import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Copy,
  AlertTriangle,
  CheckCircle,
  Eye
} from "lucide-react";

interface PartsListLineProps {
  line: any;
  onUpdate: (id: number, data: any) => void;
  onDelete: (id: number) => void;
  items: any[];
  stockLevels: any;
}

function PartsListLine({ line, onUpdate, onDelete, items, stockLevels }: PartsListLineProps) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(parseFloat(line.quantity) || 0);
  const [notes, setNotes] = useState(line.notes || '');

  const handleSave = () => {
    onUpdate(line.id, { 
      quantity: quantity.toString(), 
      notes 
    });
    setEditing(false);
  };

  // Calculate stock availability for this component
  const getStockInfo = () => {
    const stockData = stockLevels?.data || [];
    const itemStock = stockData.find((stock: any) => 
      stock.itemId === line.itemId
    );
    
    const available = parseFloat(itemStock?.availableQuantity || '0');
    const required = quantity;
    
    return {
      available,
      required,
      canSupply: available >= required,
      shortage: Math.max(0, required - available),
    };
  };

  const stockInfo = getStockInfo();
  const item = items.find((i: any) => i.id === line.itemId);

  return (
    <div className={`bg-muted p-3 rounded border-l-2 ${stockInfo.canSupply ? 'border-green-400' : 'border-red-400'}`} data-testid={`parts-list-line-${line.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-4 w-4 text-blue-600" />
          <div>
            <p className="font-medium text-sm" data-testid={`parts-list-line-name-${line.id}`}>
              {item?.name}
            </p>
            <p className="text-xs text-muted-foreground" data-testid={`parts-list-line-code-${line.id}`}>
              {item?.code}
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
                data-testid={`parts-list-line-quantity-edit-${line.id}`}
              />
              <span className="text-xs text-muted-foreground">{line.uom}</span>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
                className="w-20 text-xs"
                data-testid={`parts-list-line-notes-edit-${line.id}`}
              />
              <Button size="sm" onClick={handleSave} data-testid={`parts-list-line-save-${line.id}`}>
                <CheckCircle className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <div className="text-xs space-y-1 text-right">
                <div className="font-medium" data-testid={`parts-list-line-quantity-${line.id}`}>
                  {quantity} {line.uom}
                </div>
                {notes && (
                  <div className="text-muted-foreground" data-testid={`parts-list-line-notes-${line.id}`}>
                    {notes}
                  </div>
                )}
              </div>
              <div className="text-xs space-y-1 text-right">
                <div className={stockInfo.canSupply ? "text-green-600" : "text-red-600"} data-testid={`parts-list-line-stock-${line.id}`}>
                  Stock: {stockInfo.available.toLocaleString()} {line.uom}
                </div>
                {!stockInfo.canSupply && (
                  <div className="text-red-600 font-medium" data-testid={`parts-list-line-shortage-${line.id}`}>
                    Short: {stockInfo.shortage.toLocaleString()} {line.uom}
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setEditing(true)}
                data-testid={`parts-list-line-edit-${line.id}`}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onDelete(line.id)}
            className="text-red-600 hover:text-red-700"
            data-testid={`parts-list-line-delete-${line.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PartsListsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPartsListId, setSelectedPartsListId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPartsListName, setNewPartsListName] = useState("");
  const [newPartsListDescription, setNewPartsListDescription] = useState("");
  const [newPartsListCategory, setNewPartsListCategory] = useState("");
  const [newComponentItemId, setNewComponentItemId] = useState("");
  const [newComponentQuantity, setNewComponentQuantity] = useState(1);
  const [newComponentNotes, setNewComponentNotes] = useState("");

  // Fetch parts lists
  const { data: partsLists } = useQuery<any>({
    queryKey: ['/api/parts-lists'],
    queryFn: async () => {
      const response = await fetch('/api/parts-lists', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch items for component selection
  const { data: items } = useQuery<any>({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const response = await fetch('/api/items', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch stock levels for stock checking
  const { data: stockLevels } = useQuery<any>({
    queryKey: ['/api/stock-levels'],
    queryFn: async () => {
      const response = await fetch('/api/stock-levels', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch parts list lines for selected parts list
  const { data: partsListLines } = useQuery<any>({
    queryKey: ['/api/parts-lists', selectedPartsListId, 'lines'],
    queryFn: async () => {
      const response = await fetch(`/api/parts-lists/${selectedPartsListId}/lines`, { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!selectedPartsListId,
  });

  // Get selected parts list details
  const selectedPartsList = (partsLists?.data || []).find((list: any) => list.id === selectedPartsListId);

  // Create parts list mutation
  const createPartsListMutation = useMutation({
    mutationFn: async (partsListData: any) => {
      await apiRequest('POST', '/api/parts-lists', partsListData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Parts list created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-lists'] });
      setIsCreateDialogOpen(false);
      setNewPartsListName("");
      setNewPartsListDescription("");
      setNewPartsListCategory("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create parts list",
        variant: "destructive",
      });
    },
  });

  // Add parts list line mutation
  const addPartsListLineMutation = useMutation({
    mutationFn: async (lineData: any) => {
      await apiRequest('POST', '/api/parts-list-lines', lineData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Component added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-lists', selectedPartsListId, 'lines'] });
      setNewComponentItemId("");
      setNewComponentQuantity(1);
      setNewComponentNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add component",
        variant: "destructive",
      });
    },
  });

  // Update parts list line mutation
  const updatePartsListLineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest('PUT', `/api/parts-list-lines/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-lists', selectedPartsListId, 'lines'] });
    },
  });

  // Delete parts list line mutation
  const deletePartsListLineMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/parts-list-lines/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Component removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-lists', selectedPartsListId, 'lines'] });
    },
  });

  const handleCreatePartsList = () => {
    if (!newPartsListName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a parts list name",
        variant: "destructive",
      });
      return;
    }

    createPartsListMutation.mutate({
      name: newPartsListName,
      description: newPartsListDescription,
      category: newPartsListCategory,
    });
  };

  const handleAddComponent = () => {
    if (!selectedPartsListId || !newComponentItemId) {
      toast({
        title: "Error",
        description: "Please select a parts list and component item",
        variant: "destructive",
      });
      return;
    }

    const selectedItem = (items?.data || []).find((item: any) => item.id.toString() === newComponentItemId);
    
    addPartsListLineMutation.mutate({
      partsListId: selectedPartsListId,
      itemId: parseInt(newComponentItemId),
      quantity: newComponentQuantity.toString(),
      uom: selectedItem?.uom || 'PCS',
      notes: newComponentNotes,
      sortOrder: ((partsListLines?.data || []).length) + 1,
    });
  };

  const handleUpdatePartsListLine = useCallback((id: number, data: any) => {
    updatePartsListLineMutation.mutate({ id, data });
  }, [updatePartsListLineMutation]);

  const handleDeletePartsListLine = useCallback((id: number) => {
    deletePartsListLineMutation.mutate(id);
  }, [deletePartsListLineMutation]);

  // Calculate stock availability summary
  const calculateStockSummary = () => {
    const lines = partsListLines?.data || [];
    const stockData = stockLevels?.data || [];
    
    if (lines.length === 0) return { totalComponents: 0, availableComponents: 0, shortageComponents: 0 };

    let availableComponents = 0;
    let shortageComponents = 0;

    lines.forEach((line: any) => {
      const itemStock = stockData.find((stock: any) => stock.itemId === line.itemId);
      const available = parseFloat(itemStock?.availableQuantity || '0');
      const required = parseFloat(line.quantity || '0');
      
      if (available >= required) {
        availableComponents++;
      } else {
        shortageComponents++;
      }
    });

    return {
      totalComponents: lines.length,
      availableComponents,
      shortageComponents,
    };
  };

  const stockSummary = calculateStockSummary();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="parts-lists-title">
            {t('partsLists.title', 'Parts Lists')}
          </h2>
          <p className="text-muted-foreground" data-testid="parts-lists-subtitle">
            {t('partsLists.subtitle', 'Create and manage reusable component lists')}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-parts-list-button">
              <Plus className="h-4 w-4 mr-2" />
              {t('partsLists.createNew', 'New Parts List')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Parts List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newPartsListName}
                  onChange={(e) => setNewPartsListName(e.target.value)}
                  placeholder="Enter parts list name"
                  data-testid="parts-list-name-input"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPartsListDescription}
                  onChange={(e) => setNewPartsListDescription(e.target.value)}
                  placeholder="Enter description"
                  data-testid="parts-list-description-input"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newPartsListCategory}
                  onChange={(e) => setNewPartsListCategory(e.target.value)}
                  placeholder="Enter category"
                  data-testid="parts-list-category-input"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePartsList}
                  disabled={createPartsListMutation.isPending}
                  data-testid="create-parts-list-submit"
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parts Lists Overview */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('partsLists.overview', 'Parts Lists Overview')}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {t('partsLists.selectList', 'Select List:')}
              </span>
              <Select 
                value={selectedPartsListId?.toString() || ""} 
                onValueChange={(value) => setSelectedPartsListId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-64" data-testid="parts-list-select">
                  <SelectValue placeholder="Select parts list..." />
                </SelectTrigger>
                <SelectContent>
                  {partsLists?.data?.map((list: any) => (
                    <SelectItem key={list.id} value={list.id.toString()}>
                      {list.name} {list.category && `(${list.category})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Parts List Details */}
          {selectedPartsListId && selectedPartsList && (
            <div className="space-y-4">
              <div className="bg-primary/5 border-l-4 border-primary p-4 rounded" data-testid="selected-parts-list">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium" data-testid="selected-parts-list-name">
                        {selectedPartsList.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid="selected-parts-list-details">
                        {selectedPartsList.description} | {selectedPartsList.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{stockSummary.totalComponents} components</Badge>
                  </div>
                </div>
              </div>
              
              {/* Components List */}
              <div className="space-y-2">
                {partsListLines?.data?.map((line: any) => (
                  <PartsListLine
                    key={line.id}
                    line={line}
                    onUpdate={handleUpdatePartsListLine}
                    onDelete={handleDeletePartsListLine}
                    items={items?.data || []}
                    stockLevels={stockLevels}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Add Component Form */}
          {selectedPartsListId && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">{t('partsLists.addComponent', 'Add Component')}</h4>
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
                  value={newComponentNotes}
                  onChange={(e) => setNewComponentNotes(e.target.value)}
                  placeholder="Notes"
                  data-testid="component-notes-input"
                />
                <Button 
                  onClick={handleAddComponent}
                  disabled={!newComponentItemId || addPartsListLineMutation.isPending}
                  data-testid="add-component-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stock Summary & Actions */}
        <div className="space-y-6">
          {/* Stock Summary */}
          {selectedPartsListId && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-medium mb-3">Stock Availability</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Components:</span>
                  <span className="font-medium" data-testid="total-components">
                    {stockSummary.totalComponents}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available:</span>
                  <span className="font-medium text-green-600" data-testid="available-components">
                    {stockSummary.availableComponents}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Shortages:</span>
                  <span className="font-medium text-red-600" data-testid="shortage-components">
                    {stockSummary.shortageComponents}
                  </span>
                </div>
                <hr className="border-border" />
                {stockSummary.shortageComponents === 0 && stockSummary.totalComponents > 0 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-300">All components available</span>
                    </div>
                  </div>
                ) : stockSummary.shortageComponents > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700 dark:text-red-300">Stock shortages detected</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* List Information */}
          {selectedPartsList && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-medium mb-3">List Information</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Name</Label>
                  <Input 
                    value={selectedPartsList.name || ''} 
                    readOnly 
                    className="bg-muted"
                    data-testid="parts-list-name-display"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Category</Label>
                  <Input 
                    value={selectedPartsList.category || 'N/A'} 
                    readOnly 
                    className="bg-muted"
                    data-testid="parts-list-category-display"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <Input 
                    value={selectedPartsList.description || 'N/A'} 
                    readOnly 
                    className="bg-muted"
                    data-testid="parts-list-description-display"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}