import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Eye, Edit, Users, Star, TrendingUp, Clock } from "lucide-react";

export default function SuppliersPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Suppliers
  const { data: suppliers, isLoading } = useQuery<any>({
    queryKey: ['/api/suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Create Supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (supplierData: any) => {
      await apiRequest('POST', '/api/suppliers', supplierData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setShowCreateForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  const handleCreateSupplier = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const supplierData = {
      code: formData.get('code'),
      name: formData.get('name'),
      nameAr: formData.get('nameAr'),
      contactPerson: formData.get('contactPerson'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      addressAr: formData.get('addressAr'),
      vatNumber: formData.get('vatNumber'),
      paymentTerms: formData.get('paymentTerms'),
      leadTime: formData.get('leadTime') ? parseInt(formData.get('leadTime') as string) : null,
      currency: formData.get('currency'),
    };
    createSupplierMutation.mutate(supplierData);
  };

  const filteredSuppliers = (suppliers?.data || []).filter((supplier: any) => {
    const matchesSearch = !searchTerm || 
      supplier.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.nameAr?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get supplier performance category based on score
  const getPerformanceCategory = (score: number | null) => {
    if (!score) return { label: 'Not Rated', color: 'gray' };
    if (score >= 90) return { label: 'Excellent', color: 'green' };
    if (score >= 80) return { label: 'Good', color: 'blue' };
    if (score >= 70) return { label: 'Fair', color: 'yellow' };
    return { label: 'Poor', color: 'red' };
  };

  const getStarRating = (score: number | null) => {
    if (!score) return 0;
    return Math.round(score / 20); // Convert 0-100 score to 0-5 stars
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="suppliers-title">
            {t('suppliers.title', 'Suppliers')}
          </h2>
          <p className="text-muted-foreground" data-testid="suppliers-subtitle">
            {t('suppliers.subtitle', 'Manage supplier information and performance')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          data-testid="create-supplier-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('suppliers.createSupplier', 'Create Supplier')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Suppliers</p>
                <p className="text-2xl font-bold" data-testid="total-suppliers-count">
                  {(suppliers?.data || []).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Top Rated</p>
                <p className="text-2xl font-bold text-green-600" data-testid="top-rated-count">
                  {(suppliers?.data || []).filter((s: any) => parseFloat(s.score || 0) >= 90).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Suppliers</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="active-suppliers-count">
                  {(suppliers?.data || []).filter((s: any) => s.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg Lead Time</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="avg-lead-time">
                  {(suppliers?.data || []).length > 0 ? 
                    Math.round((suppliers?.data || []).reduce((sum: number, s: any) => sum + (s.leadTime || 0), 0) / (suppliers?.data || []).length) : 0
                  } days
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
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
                  placeholder={t('suppliers.searchPlaceholder', 'Search suppliers...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-suppliers"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('suppliers.listTitle', 'Suppliers')}</CardTitle>
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
              <table className="w-full border-collapse" data-testid="suppliers-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Code</th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Contact</th>
                    <th className="text-left p-3 font-medium">Lead Time</th>
                    <th className="text-left p-3 font-medium">Currency</th>
                    <th className="text-left p-3 font-medium">Performance</th>
                    <th className="text-left p-3 font-medium">Rating</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier: any, index: number) => {
                    const performance = getPerformanceCategory(supplier.score);
                    const stars = getStarRating(supplier.score);
                    
                    return (
                      <tr key={supplier.id} className="border-b hover:bg-muted/50" data-testid={`supplier-row-${index}`}>
                        <td className="p-3 font-mono text-sm" data-testid={`supplier-code-${index}`}>
                          {supplier.code}
                        </td>
                        <td className="p-3" data-testid={`supplier-name-${index}`}>
                          <div>
                            <p className="font-medium text-sm">{supplier.name}</p>
                            {supplier.nameAr && (
                              <p className="text-xs text-muted-foreground" dir="rtl">{supplier.nameAr}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3" data-testid={`supplier-contact-${index}`}>
                          <div>
                            {supplier.contactPerson && (
                              <p className="text-sm font-medium">{supplier.contactPerson}</p>
                            )}
                            {supplier.email && (
                              <p className="text-xs text-muted-foreground">{supplier.email}</p>
                            )}
                            {supplier.phone && (
                              <p className="text-xs text-muted-foreground">{supplier.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3" data-testid={`supplier-lead-time-${index}`}>
                          {supplier.leadTime ? `${supplier.leadTime} days` : 'N/A'}
                        </td>
                        <td className="p-3 font-medium" data-testid={`supplier-currency-${index}`}>
                          {supplier.currency}
                        </td>
                        <td className="p-3" data-testid={`supplier-performance-${index}`}>
                          <Badge 
                            variant="secondary" 
                            className={`
                              ${performance.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                              ${performance.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                              ${performance.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${performance.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                              ${performance.color === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
                            `}
                          >
                            {performance.label}
                          </Badge>
                        </td>
                        <td className="p-3" data-testid={`supplier-rating-${index}`}>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= stars 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            {supplier.score && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({supplier.score})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3" data-testid={`supplier-status-${index}`}>
                          <Badge variant={supplier.isActive ? "default" : "secondary"}>
                            {supplier.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" data-testid={`supplier-view-${index}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" data-testid={`supplier-edit-${index}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSuppliers.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground" data-testid="no-suppliers">
                        {t('suppliers.noData', 'No suppliers found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Supplier Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-supplier-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create New Supplier</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                data-testid="close-create-modal"
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="code">Supplier Code *</Label>
                    <Input
                      id="code"
                      name="code"
                      required
                      data-testid="supplier-code-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name (English) *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      data-testid="supplier-name-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameAr">Name (Arabic)</Label>
                    <Input
                      id="nameAr"
                      name="nameAr"
                      className="text-right"
                      dir="rtl"
                      data-testid="supplier-name-ar-input"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      name="contactPerson"
                      data-testid="contact-person-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      data-testid="email-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      data-testid="phone-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Address (English)</Label>
                    <Textarea
                      id="address"
                      name="address"
                      rows={3}
                      data-testid="address-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="addressAr">Address (Arabic)</Label>
                    <Textarea
                      id="addressAr"
                      name="addressAr"
                      rows={3}
                      className="text-right"
                      dir="rtl"
                      data-testid="address-ar-input"
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Business Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="vatNumber">VAT Number</Label>
                    <Input
                      id="vatNumber"
                      name="vatNumber"
                      data-testid="vat-number-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select name="paymentTerms">
                      <SelectTrigger data-testid="payment-terms-select">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NET30">Net 30 Days</SelectItem>
                        <SelectItem value="NET60">Net 60 Days</SelectItem>
                        <SelectItem value="COD">Cash on Delivery</SelectItem>
                        <SelectItem value="ADVANCE">Advance Payment</SelectItem>
                        <SelectItem value="LC">Letter of Credit</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency">
                      <SelectTrigger data-testid="currency-select">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JOD">JOD - Jordanian Dinar</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                        <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={createSupplierMutation.isPending}
                  data-testid="submit-supplier"
                >
                  {createSupplierMutation.isPending ? 'Creating...' : 'Create Supplier'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  data-testid="cancel-supplier-creation"
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
