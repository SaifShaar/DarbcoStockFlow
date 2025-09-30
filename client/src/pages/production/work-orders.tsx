import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/ui/status-badge";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, Eye, Play, CheckCircle, Factory } from "lucide-react";

export default function WorkOrdersPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("");

  // Fetch Work Orders
  const { data: workOrders, isLoading } = useQuery<any>({
    queryKey: ['/api/work-orders', { status: statusFilter, itemId: itemFilter }],
    queryFn: async () => {
      const response = await fetch('/api/work-orders', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  // Fetch items and BOMs for dropdowns
  const { data: items } = useQuery<any>({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const response = await fetch('/api/items', { credentials: 'include' });
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

  // Create Work Order mutation
  const createWorkOrderMutation = useMutation({
    mutationFn: async (woData: any) => {
      await apiRequest('POST', '/api/work-orders', woData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Work order created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      setShowCreateForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create work order",
        variant: "destructive",
      });
    },
  });

  // Release Work Order mutation
  const releaseWorkOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('PUT', `/api/work-orders/${id}/release`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Work order released successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to release work order",
        variant: "destructive",
      });
    },
  });

  const handleCreateWorkOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const woData = {
      itemId: parseInt(formData.get('itemId') as string),
      plannedQuantity: parseFloat(formData.get('plannedQuantity') as string),
      startDate: formData.get('startDate'),
      dueDate: formData.get('dueDate'),
      warehouseId: formData.get('warehouseId') ? parseInt(formData.get('warehouseId') as string) : null,
      priority: formData.get('priority'),
      notes: formData.get('notes'),
      notesAr: formData.get('notesAr'),
    };
    createWorkOrderMutation.mutate(woData);
  };

  const filteredWorkOrders = workOrders?.data?.filter((wo: any) => {
    const matchesSearch = !searchTerm || 
      wo.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.item?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || wo.status === statusFilter;
    const matchesItem = !itemFilter || wo.itemId.toString() === itemFilter;
    return matchesSearch && matchesStatus && matchesItem;
  }) || [];

  // Calculate progress percentage
  const getProgressPercentage = (wo: any) => {
    if (!wo.plannedQuantity) return 0;
    return Math.round((parseFloat(wo.completedQuantity || 0) / parseFloat(wo.plannedQuantity)) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="work-orders-title">
            {t('workOrders.title', 'Work Orders')}
          </h2>
          <p className="text-muted-foreground" data-testid="work-orders-subtitle">
            {t('workOrders.subtitle', 'Plan and manage production work orders')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          data-testid="create-wo-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('workOrders.createWo', 'Create Work Order')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Work Orders</p>
                <p className="text-2xl font-bold" data-testid="total-wos-count">
                  {workOrders?.data?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Factory className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">In Progress</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="in-progress-wos-count">
                  {workOrders?.data?.filter((wo: any) => wo.status === 'in_progress').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-600" data-testid="completed-wos-count">
                  {workOrders?.data?.filter((wo: any) => wo.status === 'completed').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Draft</p>
                <p className="text-2xl font-bold text-gray-600" data-testid="draft-wos-count">
                  {workOrders?.data?.filter((wo: any) => wo.status === 'draft').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-alt text-gray-600"></i>
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
                  placeholder={t('workOrders.searchPlaceholder', 'Search work orders...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-work-orders"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={itemFilter} onValueChange={setItemFilter}>
              <SelectTrigger className="w-48" data-testid="item-filter">
                <SelectValue placeholder="Filter by item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Items</SelectItem>
                {items?.data?.map((item: any) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('workOrders.listTitle', 'Work Orders')}</CardTitle>
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
              <table className="w-full border-collapse" data-testid="work-orders-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">WO Number</th>
                    <th className="text-left p-3 font-medium">Item</th>
                    <th className="text-left p-3 font-medium">Planned Qty</th>
                    <th className="text-left p-3 font-medium">Completed Qty</th>
                    <th className="text-left p-3 font-medium">Progress</th>
                    <th className="text-left p-3 font-medium">Due Date</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkOrders.map((wo: any, index: number) => (
                    <tr key={wo.id} className="border-b hover:bg-muted/50" data-testid={`wo-row-${index}`}>
                      <td className="p-3 font-mono text-sm" data-testid={`wo-number-${index}`}>
                        {wo.number}
                      </td>
                      <td className="p-3" data-testid={`wo-item-${index}`}>
                        <div>
                          <p className="font-medium text-sm">{wo.item?.name}</p>
                          <p className="text-xs text-muted-foreground">{wo.item?.code}</p>
                        </div>
                      </td>
                      <td className="p-3 font-medium" data-testid={`wo-planned-qty-${index}`}>
                        {parseFloat(wo.plannedQuantity).toLocaleString()} {wo.item?.uom}
                      </td>
                      <td className="p-3 font-medium" data-testid={`wo-completed-qty-${index}`}>
                        {parseFloat(wo.completedQuantity || 0).toLocaleString()} {wo.item?.uom}
                      </td>
                      <td className="p-3" data-testid={`wo-progress-${index}`}>
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${getProgressPercentage(wo)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{getProgressPercentage(wo)}%</span>
                        </div>
                      </td>
                      <td className="p-3" data-testid={`wo-due-date-${index}`}>
                        {wo.dueDate || 'N/A'}
                      </td>
                      <td className="p-3" data-testid={`wo-status-${index}`}>
                        <StatusBadge status={wo.status} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`wo-view-${index}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {wo.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => releaseWorkOrderMutation.mutate(wo.id)}
                              disabled={releaseWorkOrderMutation.isPending}
                              className="text-green-600 hover:text-green-700"
                              data-testid={`wo-release-${index}`}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredWorkOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground" data-testid="no-work-orders">
                        {t('workOrders.noData', 'No work orders found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Work Order Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-wo-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create New Work Order</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                data-testid="close-create-modal"
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="itemId">Item *</Label>
                  <Select name="itemId" required>
                    <SelectTrigger data-testid="item-select">
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
                </div>

                <div>
                  <Label htmlFor="plannedQuantity">Planned Quantity *</Label>
                  <Input
                    type="number"
                    id="plannedQuantity"
                    name="plannedQuantity"
                    min="0.01"
                    step="0.01"
                    required
                    data-testid="planned-quantity-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    data-testid="start-date-input"
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    data-testid="due-date-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warehouseId">Warehouse</Label>
                  <Select name="warehouseId">
                    <SelectTrigger data-testid="warehouse-select">
                      <SelectValue placeholder="Select warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific warehouse</SelectItem>
                      {warehouses?.data?.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority">
                    <SelectTrigger data-testid="priority-select">
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (English)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  data-testid="notes-input"
                />
              </div>

              <div>
                <Label htmlFor="notesAr">Notes (Arabic)</Label>
                <Textarea
                  id="notesAr"
                  name="notesAr"
                  rows={3}
                  className="text-right"
                  dir="rtl"
                  data-testid="notes-ar-input"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={createWorkOrderMutation.isPending}
                  data-testid="submit-wo"
                >
                  {createWorkOrderMutation.isPending ? 'Creating...' : 'Create Work Order'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  data-testid="cancel-wo-creation"
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
