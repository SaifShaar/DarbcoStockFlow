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
import { Plus, Search, Filter, Eye, Edit, FileText, ShoppingCart } from "lucide-react";

export default function QuotesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");

  // Fetch Quotes
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['/api/quotes', { status: statusFilter, supplierId: supplierFilter }],
  });

  // Fetch Suppliers for filter
  const { data: suppliers } = useQuery({
    queryKey: ['/api/suppliers'],
  });

  // Fetch RFQs for dropdown
  const { data: rfqs } = useQuery({
    queryKey: ['/api/rfqs', { status: 'pending' }],
  });

  // Create Quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (quoteData: any) => {
      await apiRequest('POST', '/api/quotes', quoteData);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Quote created successfully",
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/quotes'], 
        exact: false 
      });
      setShowCreateForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create quote",
        variant: "destructive",
      });
    },
  });

  // Convert to PO mutation
  const convertToPOMutation = useMutation({
    mutationFn: async ({ quoteId, orderDetails }: any) => {
      await apiRequest('POST', `/api/quotes/${quoteId}/convert-to-po`, orderDetails);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Purchase Order created from quote successfully",
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/quotes'], 
        exact: false 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/purchase-orders'], 
        exact: false 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert quote to purchase order",
        variant: "destructive",
      });
    },
  });

  const handleCreateQuote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const quoteData = {
      rfqId: formData.get('rfqId') ? parseInt(formData.get('rfqId') as string) : null,
      supplierId: parseInt(formData.get('supplierId') as string),
      quoteDate: formData.get('quoteDate'),
      validUntil: formData.get('validUntil'),
      totalAmount: formData.get('totalAmount'),
      leadTime: formData.get('leadTime') ? parseInt(formData.get('leadTime') as string) : null,
      paymentTerms: formData.get('paymentTerms'),
      notes: formData.get('notes'),
      notesAr: formData.get('notesAr'),
    };
    createQuoteMutation.mutate(quoteData);
  };

  const handleConvertToPO = (quoteId: number) => {
    const orderDetails = {
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      paymentTerms: "NET30",
      deliveryTerms: "FOB",
    };
    convertToPOMutation.mutate({ quoteId, orderDetails });
  };

  const filteredQuotes = (Array.isArray(quotes) ? quotes : []).filter((quote: any) => {
    const matchesSearch = !searchTerm || 
      quote.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === "__all__" || quote.status === statusFilter;
    const matchesSupplier = !supplierFilter || supplierFilter === "__all__" || quote.supplierId.toString() === supplierFilter;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="quotes-title">
            {t('quotes.title', 'Quote Management')}
          </h2>
          <p className="text-muted-foreground" data-testid="quotes-subtitle">
            {t('quotes.subtitle', 'Manage supplier quotes and convert to purchase orders')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          data-testid="create-quote-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('quotes.createNew', 'Create Quote')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Quotes</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="total-quotes-count">
                  {filteredQuotes.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Quotes</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="pending-quotes-count">
                  {filteredQuotes.filter((q: any) => q.status === 'pending').length}
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
                <p className="text-muted-foreground text-sm">Approved Quotes</p>
                <p className="text-2xl font-bold text-green-600" data-testid="approved-quotes-count">
                  {filteredQuotes.filter((q: any) => q.status === 'approved').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Converted to PO</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="converted-quotes-count">
                  {filteredQuotes.filter((q: any) => q.status === 'converted').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
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
                  placeholder={t('quotes.searchPlaceholder', 'Search quotes...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-quotes"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
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

      {/* Quotes List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quotes.listTitle', 'Quotes')}</CardTitle>
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
              <table className="w-full border-collapse" data-testid="quotes-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Quote #</th>
                    <th className="text-left p-4 font-medium">Supplier</th>
                    <th className="text-left p-4 font-medium">Quote Date</th>
                    <th className="text-left p-4 font-medium">Valid Until</th>
                    <th className="text-left p-4 font-medium">Total Amount</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground" data-testid="no-quotes">
                        No quotes found
                      </td>
                    </tr>
                  ) : (
                    filteredQuotes.map((quote: any) => (
                      <tr key={quote.id} className="border-b hover:bg-muted/50" data-testid={`quote-row-${quote.id}`}>
                        <td className="p-4 font-mono">{quote.quoteNumber}</td>
                        <td className="p-4">{quote.supplier?.name || 'N/A'}</td>
                        <td className="p-4">{quote.quoteDate}</td>
                        <td className="p-4">{quote.validUntil || 'N/A'}</td>
                        <td className="p-4">{quote.totalAmount ? `${quote.totalAmount} JOD` : 'N/A'}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(quote.status)}>
                            {quote.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`view-quote-${quote.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {quote.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConvertToPO(quote.id)}
                                data-testid={`convert-to-po-${quote.id}`}
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Convert to PO
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Quote Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4" data-testid="create-quote-title">
              {t('quotes.createNew', 'Create New Quote')}
            </h3>
            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rfqId">Related RFQ</Label>
                  <Select name="rfqId">
                    <SelectTrigger data-testid="rfq-select">
                      <SelectValue placeholder="Select RFQ (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No RFQ</SelectItem>
                      {(Array.isArray(rfqs) ? rfqs : []).map((rfq: any) => (
                        <SelectItem key={rfq.id} value={rfq.id.toString()}>
                          {rfq.number} - {rfq.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="supplierId">Supplier *</Label>
                  <Select name="supplierId" required>
                    <SelectTrigger data-testid="supplier-select">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(suppliers) ? suppliers : []).map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quoteDate">Quote Date *</Label>
                  <Input
                    type="date"
                    name="quoteDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    data-testid="quote-date"
                  />
                </div>

                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    type="date"
                    name="validUntil"
                    data-testid="valid-until"
                  />
                </div>

                <div>
                  <Label htmlFor="totalAmount">Total Amount (JOD) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    name="totalAmount"
                    placeholder="0.00"
                    required
                    data-testid="total-amount"
                  />
                </div>

                <div>
                  <Label htmlFor="leadTime">Lead Time (Days)</Label>
                  <Input
                    type="number"
                    name="leadTime"
                    placeholder="Days"
                    data-testid="lead-time"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  name="paymentTerms"
                  placeholder="e.g., NET30, COD"
                  data-testid="payment-terms"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (English)</Label>
                <Textarea
                  name="notes"
                  placeholder="Additional notes or conditions"
                  data-testid="notes"
                />
              </div>

              <div>
                <Label htmlFor="notesAr">Notes (Arabic)</Label>
                <Textarea
                  name="notesAr"
                  placeholder="ملاحظات إضافية أو شروط"
                  dir="rtl"
                  data-testid="notes-ar"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  data-testid="cancel-quote-creation"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createQuoteMutation.isPending}
                  data-testid="submit-quote"
                >
                  {createQuoteMutation.isPending ? 'Creating...' : t('common.save', 'Create Quote')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}