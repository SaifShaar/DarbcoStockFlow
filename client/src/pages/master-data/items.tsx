import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, Eye, Edit, Package, BarChart3 } from "lucide-react";

export default function ItemsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("__all__");
  const [supplierFilter, setSupplierFilter] = useState("__all__");

  // Fetch Items
  const { data: items, isLoading } = useQuery<any[]>({
    queryKey: ['/api/items', searchTerm, categoryFilter, supplierFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (categoryFilter && categoryFilter !== '__all__') params.set('category', categoryFilter);
      if (supplierFilter && supplierFilter !== '__all__') params.set('supplierId', supplierFilter);
      
      const url = `/api/items${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch suppliers for filter and form
  const { data: suppliers } = useQuery<any[]>({
    queryKey: ['/api/suppliers'],
  });

  // Fetch stock levels for all items
  const { data: stockLevels } = useQuery<any[]>({
    queryKey: ['/api/stock-levels'],
    queryFn: async () => {
      const response = await fetch('/api/stock-levels', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  // Get unique categories from items
  const categories = Array.from(new Set((Array.isArray(items) ? items : []).map((item: any) => item.category).filter(Boolean))) || [];

  // Create Item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: any) => {
      const response = await apiRequest('POST', '/api/items', itemData);
      return response;
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      
      // Invalidate all items queries regardless of filter parameters
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/items'], 
        exact: false 
      });
      
      setShowCreateForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create item",
        variant: "destructive",
      });
    },
  });

  const handleCreateItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const itemData = {
      code: formData.get('code'),
      name: formData.get('name'),
      nameAr: formData.get('nameAr'),
      description: formData.get('description'),
      descriptionAr: formData.get('descriptionAr'),
      specification: formData.get('specification'),
      specificationAr: formData.get('specificationAr'),
      uom: formData.get('uom'),
      category: formData.get('category'),
      categoryAr: formData.get('categoryAr'),
      abcClassification: formData.get('abcClassification'),
      xyzClassification: formData.get('xyzClassification'),
      minStock: formData.get('minStock') ? parseFloat(formData.get('minStock') as string) : null,
      maxStock: formData.get('maxStock') ? parseFloat(formData.get('maxStock') as string) : null,
      reorderPoint: formData.get('reorderPoint') ? parseFloat(formData.get('reorderPoint') as string) : null,
      leadTime: formData.get('leadTime') ? parseInt(formData.get('leadTime') as string) : null,
      defaultSupplierId: formData.get('defaultSupplierId') && formData.get('defaultSupplierId') !== '__none__' ? parseInt(formData.get('defaultSupplierId') as string) : null,
      requiresBatch: formData.get('requiresBatch') === 'on',
      requiresSerial: formData.get('requiresSerial') === 'on',
      imageUrl: formData.get('imageUrl'),
    };
    createItemMutation.mutate(itemData);
  };

  const filteredItems = Array.isArray(items) ? items : [];
  
  // Calculate stock quantities for each item
  const getItemStockQuantity = (itemId: number) => {
    if (!Array.isArray(stockLevels)) return { onHand: 0, available: 0 };
    
    const itemStocks = stockLevels.filter(stock => stock.itemId === itemId);
    const onHand = itemStocks.reduce((sum, stock) => sum + parseFloat(stock.quantity || '0'), 0);
    const available = itemStocks.reduce((sum, stock) => sum + parseFloat(stock.availableQuantity || '0'), 0);
    
    return { onHand, available };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="items-title">
            {t('items.title', 'Items Master Data')}
          </h2>
          <p className="text-muted-foreground" data-testid="items-subtitle">
            {t('items.subtitle', 'Manage inventory items and specifications')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          data-testid="create-item-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('items.createItem', 'Create Item')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Items</p>
                <p className="text-2xl font-bold" data-testid="total-items-count">
                  {Array.isArray(items) ? items.length : 0}
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
                <p className="text-muted-foreground text-sm">Categories</p>
                <p className="text-2xl font-bold text-green-600" data-testid="categories-count">
                  {categories.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-tags text-green-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Items</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="active-items-count">
                  {(Array.isArray(items) ? items : []).filter((item: any) => item.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-purple-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Batch Tracked</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="batch-tracked-count">
                  {(Array.isArray(items) ? items : []).filter((item: any) => item.requiresBatch || item.requiresSerial).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-600" />
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
                  placeholder={t('items.searchPlaceholder', 'Search items...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-items"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="category-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-48" data-testid="supplier-filter">
                <SelectValue placeholder="Filter by supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Suppliers</SelectItem>
                {(Array.isArray(suppliers) ? suppliers : []).map((supplier: any) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('items.listTitle', 'Items')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" data-testid="items-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Code</th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">UOM</th>
                    <th className="text-left p-3 font-medium">On-Hand QTY</th>
                    <th className="text-left p-3 font-medium">Available</th>
                    <th className="text-left p-3 font-medium">Min Stock</th>
                    <th className="text-left p-3 font-medium">Tracking</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item: any, index: number) => {
                    const stockQty = getItemStockQuantity(item.id);
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/50" data-testid={`item-row-${index}`}>
                        <td className="p-3 font-mono text-sm" data-testid={`item-code-${index}`}>
                          {item.code}
                        </td>
                        <td className="p-3" data-testid={`item-name-${index}`}>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            {item.nameAr && (
                              <p className="text-xs text-muted-foreground" dir="rtl">{item.nameAr}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3" data-testid={`item-category-${index}`}>
                          {item.category && (
                            <Badge variant="secondary">{item.category}</Badge>
                          )}
                        </td>
                        <td className="p-3 font-medium" data-testid={`item-uom-${index}`}>
                          {item.uom}
                        </td>
                        <td className="p-3 font-bold" data-testid={`item-onhand-${index}`}>
                          <span className={stockQty.onHand > 0 ? "text-green-600" : "text-red-500"}>
                            {stockQty.onHand.toLocaleString()} {item.uom}
                          </span>
                        </td>
                        <td className="p-3 font-medium" data-testid={`item-available-${index}`}>
                          <span className="text-blue-600">
                            {stockQty.available.toLocaleString()} {item.uom}
                          </span>
                        </td>
                        <td className="p-3" data-testid={`item-min-stock-${index}`}>
                          {item.minStock ? `${parseFloat(item.minStock).toLocaleString()} ${item.uom}` : 'N/A'}
                        </td>
                        <td className="p-3" data-testid={`item-tracking-${index}`}>
                          <div className="flex space-x-1">
                            {item.requiresBatch && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Batch
                              </Badge>
                            )}
                            {item.requiresSerial && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Serial
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" data-testid={`item-view-${index}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" data-testid={`item-edit-${index}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground" data-testid="no-items">
                        {t('items.noData', 'No items found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Item Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-item-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create New Item</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                data-testid="close-create-modal"
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="code">Item Code *</Label>
                    <Input
                      id="code"
                      name="code"
                      required
                      data-testid="item-code-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name (English) *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      data-testid="item-name-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameAr">Name (Arabic)</Label>
                    <Input
                      id="nameAr"
                      name="nameAr"
                      className="text-right"
                      dir="rtl"
                      data-testid="item-name-ar-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description">Description (English)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      data-testid="item-description-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                    <Textarea
                      id="descriptionAr"
                      name="descriptionAr"
                      rows={3}
                      className="text-right"
                      dir="rtl"
                      data-testid="item-description-ar-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specification">Specification (English)</Label>
                    <Textarea
                      id="specification"
                      name="specification"
                      rows={3}
                      data-testid="item-specification-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specificationAr">Specification (Arabic)</Label>
                    <Textarea
                      id="specificationAr"
                      name="specificationAr"
                      rows={3}
                      className="text-right"
                      dir="rtl"
                      data-testid="item-specification-ar-input"
                    />
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Classification</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="uom">Unit of Measure *</Label>
                    <Select name="uom" required>
                      <SelectTrigger data-testid="uom-select">
                        <SelectValue placeholder="Select UOM..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PCS">PCS - Pieces</SelectItem>
                        <SelectItem value="KG">KG - Kilograms</SelectItem>
                        <SelectItem value="M">M - Meters</SelectItem>
                        <SelectItem value="L">L - Liters</SelectItem>
                        <SelectItem value="PKG">PKG - Package</SelectItem>
                        <SelectItem value="BOX">BOX - Box</SelectItem>
                        <SelectItem value="SET">SET - Set</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      data-testid="category-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="abcClassification">ABC Classification</Label>
                    <Select name="abcClassification">
                      <SelectTrigger data-testid="abc-classification-select">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A - High Value</SelectItem>
                        <SelectItem value="B">B - Medium Value</SelectItem>
                        <SelectItem value="C">C - Low Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="xyzClassification">XYZ Classification</Label>
                    <Select name="xyzClassification">
                      <SelectTrigger data-testid="xyz-classification-select">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="X">X - Stable Demand</SelectItem>
                        <SelectItem value="Y">Y - Variable Demand</SelectItem>
                        <SelectItem value="Z">Z - Irregular Demand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Inventory Settings */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Inventory Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="minStock">Minimum Stock</Label>
                    <Input
                      type="number"
                      id="minStock"
                      name="minStock"
                      min="0"
                      step="0.01"
                      data-testid="min-stock-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxStock">Maximum Stock</Label>
                    <Input
                      type="number"
                      id="maxStock"
                      name="maxStock"
                      min="0"
                      step="0.01"
                      data-testid="max-stock-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reorderPoint">Reorder Point</Label>
                    <Input
                      type="number"
                      id="reorderPoint"
                      name="reorderPoint"
                      min="0"
                      step="0.01"
                      data-testid="reorder-point-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="leadTime">Lead Time (Days)</Label>
                    <Input
                      type="number"
                      id="leadTime"
                      name="leadTime"
                      min="0"
                      data-testid="lead-time-input"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier and Tracking */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Supplier & Tracking</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultSupplierId">Default Supplier</Label>
                    <Select name="defaultSupplierId">
                      <SelectTrigger data-testid="default-supplier-select">
                        <SelectValue placeholder="Select supplier..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No default supplier</SelectItem>
                        {(Array.isArray(suppliers) ? suppliers : []).map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      data-testid="image-url-input"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="requiresBatch" name="requiresBatch" data-testid="requires-batch-checkbox" />
                    <Label htmlFor="requiresBatch">Requires Batch Tracking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="requiresSerial" name="requiresSerial" data-testid="requires-serial-checkbox" />
                    <Label htmlFor="requiresSerial">Requires Serial Tracking</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={createItemMutation.isPending}
                  data-testid="create-item-submit"
                >
                  {createItemMutation.isPending ? 'Creating...' : 'Create Item'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  data-testid="cancel-item-creation"
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
