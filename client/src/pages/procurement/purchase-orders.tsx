import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/ui/status-badge";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, Eye, Edit, Check } from "lucide-react";

export default function PurchaseOrdersPage() {
    const { t } = useI18n();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [supplierFilter, setSupplierFilter] = useState("");

    // Fetch Purchase Orders
    const { data: pos, isLoading } = useQuery({
        queryKey: ['/api/purchase-orders', { status: statusFilter, supplierId: supplierFilter }],
    });

    // Fetch Suppliers for filter
    const { data: suppliers } = useQuery({
        queryKey: ['/api/suppliers'],
    });

    // Approve PO mutation
    const approveMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest('PUT', `/api/purchase-orders/${id}/approve`, {});
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Purchase order approved successfully",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/purchase-orders'] });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to approve purchase order",
                variant: "destructive",
            });
        },
    });

    const filteredPos = pos?.data?.filter((po: any) => {
        const matchesSearch = !searchTerm ||
            po.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || po.status === statusFilter;
        const matchesSupplier = !supplierFilter || po.supplierId.toString() === supplierFilter;
        return matchesSearch && matchesStatus && matchesSupplier;
    }) || [];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold" data-testid="po-title">
                        {t('purchaseOrders.title', 'Purchase Orders')}
                    </h2>
                    <p className="text-muted-foreground" data-testid="po-subtitle">
                        {t('purchaseOrders.subtitle', 'Manage purchase orders and approvals')}
                    </p>
                </div>
                <Button data-testid="create-po-button">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('purchaseOrders.createNew', 'Create PO')}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Total POs</p>
                                <p className="text-2xl font-bold" data-testid="total-pos-count">
                                    {pos?.data?.length || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-file-alt text-blue-600"></i>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Pending Approval</p>
                                <p className="text-2xl font-bold text-yellow-600" data-testid="pending-pos-count">
                                    {pos?.data?.filter((po: any) => po.status === 'pending').length || 0}
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
                                <p className="text-muted-foreground text-sm">Approved</p>
                                <p className="text-2xl font-bold text-green-600" data-testid="approved-pos-count">
                                    {pos?.data?.filter((po: any) => po.status === 'approved').length || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-check text-green-600"></i>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Total Value</p>
                                <p className="text-2xl font-bold text-purple-600" data-testid="total-value">
                                    {pos?.data?.reduce((sum: number, po: any) => sum + parseFloat(po.totalAmount || 0), 0).toLocaleString()} JOD
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-dollar-sign text-purple-600"></i>
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
                                    placeholder={t('purchaseOrders.searchPlaceholder', 'Search purchase orders...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                    data-testid="search-pos"
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
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                            <SelectTrigger className="w-48" data-testid="supplier-filter">
                                <SelectValue placeholder="Filter by supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Suppliers</SelectItem>
                                {suppliers?.data?.map((supplier: any) => (
                                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                        {supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Purchase Orders List */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('purchaseOrders.listTitle', 'Purchase Orders')}</CardTitle>
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
                            <table className="w-full border-collapse" data-testid="pos-table">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3 font-medium">PO Number</th>
                                        <th className="text-left p-3 font-medium">Supplier</th>
                                        <th className="text-left p-3 font-medium">Order Date</th>
                                        <th className="text-left p-3 font-medium">Delivery Date</th>
                                        <th className="text-left p-3 font-medium">Total Amount</th>
                                        <th className="text-left p-3 font-medium">Status</th>
                                        <th className="text-left p-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPos.map((po: any, index: number) => (
                                        <tr key={po.id} className="border-b hover:bg-muted/50" data-testid={`po-row-${index}`}>
                                            <td className="p-3 font-mono text-sm" data-testid={`po-number-${index}`}>
                                                {po.number}
                                            </td>
                                            <td className="p-3" data-testid={`po-supplier-${index}`}>
                                                {po.supplier?.name || 'N/A'}
                                            </td>
                                            <td className="p-3" data-testid={`po-order-date-${index}`}>
                                                {po.orderDate}
                                            </td>
                                            <td className="p-3" data-testid={`po-delivery-date-${index}`}>
                                                {po.deliveryDate || 'N/A'}
                                            </td>
                                            <td className="p-3 font-medium" data-testid={`po-total-${index}`}>
                                                {parseFloat(po.totalAmount || 0).toLocaleString()} JOD
                                            </td>
                                            <td className="p-3" data-testid={`po-status-${index}`}>
                                                <StatusBadge status={po.status} />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center space-x-2">
                                                    <Button variant="ghost" size="sm" data-testid={`po-view-${index}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {po.status === 'draft' && (
                                                        <Button variant="ghost" size="sm" data-testid={`po-edit-${index}`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {po.status === 'pending' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => approveMutation.mutate(po.id)}
                                                            disabled={approveMutation.isPending}
                                                            className="text-green-600 hover:text-green-700"
                                                            data-testid={`po-approve-${index}`}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPos.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground" data-testid="no-pos">
                                                {t('purchaseOrders.noData', 'No purchase orders found')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
