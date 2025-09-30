import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Building2, MapPin, Edit, Eye } from "lucide-react";

export default function WarehousesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBinForm, setShowBinForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Warehouses
  const { data: warehouses, isLoading } = useQuery<any>({
    queryKey: ['/api/warehouses'],
    queryFn: async () => {
      const response = await fetch('/api/warehouses', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch bins for selected warehouse
  const { data: bins } = useQuery<any>({
    queryKey: ['/api/warehouses', selectedWarehouse?.id, 'bins'],
    queryFn: async () => {
      const response = await fetch(`/api/warehouses/${selectedWarehouse?.id}/bins`, { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!selectedWarehouse?.id,
  });

  // Create Warehouse mutation
  const createWarehouseMutation = useMutation({
    mutationFn: async (warehouseData: any) => {
      await apiRequest('POST', '/api/warehouses', warehouseData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Warehouse created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setShowCreateForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create warehouse",
        variant: "destructive",
      });
    },
  });

  // Create Bin mutation
  const createBinMutation = useMutation({
    mutationFn: async (binData: any) => {
      await apiRequest('POST', '/api/bins', binData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bin created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses', selectedWarehouse?.id, 'bins'] });
      setShowBinForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create bin",
        variant: "destructive",
      });
    },
  });

  const handleCreateWarehouse = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const warehouseData = {
      code: formData.get('code'),
      name: formData.get('name'),
      nameAr: formData.get('nameAr'),
      location: formData.get('location'),
    };
    createWarehouseMutation.mutate(warehouseData);
  };

  const handleCreateBin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const binData = {
      warehouseId: selectedWarehouse?.id,
      code: formData.get('code'),
      name: formData.get('name'),
      nameAr: formData.get('nameAr'),
      aisle: formData.get('aisle'),
      rack: formData.get('rack'),
      shelf: formData.get('shelf'),
      capacity: formData.get('capacity') ? parseFloat(formData.get('capacity') as string) : null,
    };
    createBinMutation.mutate(binData);
  };

  const filteredWarehouses = (warehouses?.data || []).filter((warehouse: any) => {
    const matchesSearch = !searchTerm || 
      warehouse.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.nameAr?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="warehouses-title">
            {t('warehouses.title', 'Warehouse Management')}
          </h2>
          <p className="text-muted-foreground" data-testid="warehouses-subtitle">
            {t('warehouses.subtitle', 'Manage warehouses and bin locations')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          data-testid="create-warehouse-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('warehouses.createWarehouse', 'Create Warehouse')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Warehouses</p>
                <p className="text-2xl font-bold" data-testid="total-warehouses-count">
                  {(warehouses?.data || []).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Warehouses</p>
                <p className="text-2xl font-bold text-green-600" data-testid="active-warehouses-count">
                  {(warehouses?.data || []).filter((w: any) => w.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Bins</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="total-bins-count">
                  {selectedWarehouse ? (bins?.data || []).length : '--'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
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
                  placeholder={t('warehouses.searchPlaceholder', 'Search warehouses...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-warehouses"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouses List */}
        <Card>
          <CardHeader>
            <CardTitle>{t('warehouses.listTitle', 'Warehouses')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
                {filteredWarehouses.map((warehouse: any, index: number) => (
                  <div
                    key={warehouse.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedWarehouse?.id === warehouse.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedWarehouse(warehouse)}
                    data-testid={`warehouse-item-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium" data-testid={`warehouse-name-${index}`}>
                            {warehouse.name}
                          </h3>
                          <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                            {warehouse.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono" data-testid={`warehouse-code-${index}`}>
                          {warehouse.code}
                        </p>
                        {warehouse.nameAr && (
                          <p className="text-sm text-muted-foreground" dir="rtl" data-testid={`warehouse-name-ar-${index}`}>
                            {warehouse.nameAr}
                          </p>
                        )}
                        {warehouse.location && (
                          <p className="text-xs text-muted-foreground mt-1" data-testid={`warehouse-location-${index}`}>
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {warehouse.location}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`warehouse-view-${index}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`warehouse-edit-${index}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredWarehouses.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground" data-testid="no-warehouses">
                    {t('warehouses.noData', 'No warehouses found')}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bins List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedWarehouse 
                  ? `${t('warehouses.binsFor', 'Bins for')} ${selectedWarehouse.name}`
                  : t('warehouses.selectWarehouse', 'Select a warehouse')
                }
              </CardTitle>
              {selectedWarehouse && (
                <Button
                  size="sm"
                  onClick={() => setShowBinForm(true)}
                  data-testid="create-bin-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bin
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedWarehouse ? (
              <div className="space-y-3">
                {(bins?.data || []).map((bin: any, index: number) => (
                  <div key={bin.id} className="p-3 bg-muted rounded-lg" data-testid={`bin-item-${index}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm" data-testid={`bin-name-${index}`}>
                          {bin.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono" data-testid={`bin-code-${index}`}>
                          {bin.code}
                        </p>
                        {bin.nameAr && (
                          <p className="text-xs text-muted-foreground" dir="rtl" data-testid={`bin-name-ar-${index}`}>
                            {bin.nameAr}
                          </p>
                        )}
                        {(bin.aisle || bin.rack || bin.shelf) && (
                          <p className="text-xs text-muted-foreground" data-testid={`bin-location-${index}`}>
                            {[bin.aisle, bin.rack, bin.shelf].filter(Boolean).join('-')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {bin.capacity && (
                          <p className="text-xs text-muted-foreground" data-testid={`bin-capacity-${index}`}>
                            Capacity: {bin.capacity}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(bins?.data || []).length === 0 && (
                  <div className="p-8 text-center text-muted-foreground" data-testid="no-bins">
                    {t('warehouses.noBins', 'No bins configured for this warehouse')}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground" data-testid="select-warehouse-message">
                {t('warehouses.selectWarehouseMessage', 'Select a warehouse to view and manage its bins')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Warehouse Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-warehouse-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create New Warehouse</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                data-testid="close-create-modal"
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Warehouse Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    required
                    data-testid="warehouse-code-input"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name (English) *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    data-testid="warehouse-name-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nameAr">Name (Arabic)</Label>
                <Input
                  id="nameAr"
                  name="nameAr"
                  className="text-right"
                  dir="rtl"
                  data-testid="warehouse-name-ar-input"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Textarea
                  id="location"
                  name="location"
                  rows={3}
                  data-testid="warehouse-location-input"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={createWarehouseMutation.isPending}
                  data-testid="submit-warehouse"
                >
                  {createWarehouseMutation.isPending ? 'Creating...' : 'Create Warehouse'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  data-testid="cancel-warehouse-creation"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Bin Modal */}
      {showBinForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-bin-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create New Bin for {selectedWarehouse?.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBinForm(false)}
                data-testid="close-bin-modal"
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleCreateBin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="binCode">Bin Code *</Label>
                  <Input
                    id="binCode"
                    name="code"
                    required
                    data-testid="bin-code-input"
                  />
                </div>
                <div>
                  <Label htmlFor="binName">Name (English) *</Label>
                  <Input
                    id="binName"
                    name="name"
                    required
                    data-testid="bin-name-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="binNameAr">Name (Arabic)</Label>
                <Input
                  id="binNameAr"
                  name="nameAr"
                  className="text-right"
                  dir="rtl"
                  data-testid="bin-name-ar-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="aisle">Aisle</Label>
                  <Input
                    id="aisle"
                    name="aisle"
                    data-testid="bin-aisle-input"
                  />
                </div>
                <div>
                  <Label htmlFor="rack">Rack</Label>
                  <Input
                    id="rack"
                    name="rack"
                    data-testid="bin-rack-input"
                  />
                </div>
                <div>
                  <Label htmlFor="shelf">Shelf</Label>
                  <Input
                    id="shelf"
                    name="shelf"
                    data-testid="bin-shelf-input"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    type="number"
                    id="capacity"
                    name="capacity"
                    step="0.01"
                    data-testid="bin-capacity-input"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={createBinMutation.isPending}
                  data-testid="submit-bin"
                >
                  {createBinMutation.isPending ? 'Creating...' : 'Create Bin'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBinForm(false)}
                  data-testid="cancel-bin-creation"
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