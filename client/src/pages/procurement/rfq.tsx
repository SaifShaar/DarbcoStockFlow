import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/ui/status-badge";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter } from "lucide-react";

export default function RfqPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch RFQs
  const { data: rfqs, isLoading } = useQuery({
    queryKey: ['/api/rfqs', { status: statusFilter }],
  });

  // Create RFQ mutation
  const createRfqMutation = useMutation({
    mutationFn: async (rfqData: any) => {
      await apiRequest('POST', '/api/rfqs', rfqData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "RFQ created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rfqs'] });
      setShowCreateForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create RFQ",
        variant: "destructive",
      });
    },
  });

  const handleCreateRfq = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rfqData = {
      description: formData.get('description'),
      descriptionAr: formData.get('descriptionAr'),
      requestDate: formData.get('requestDate'),
      responseDeadline: formData.get('responseDeadline'),
      status: 'draft',
    };
    createRfqMutation.mutate(rfqData);
  };

  const filteredRfqs = (Array.isArray(rfqs) ? rfqs : []).filter((rfq: any) => {
    const matchesSearch = !searchTerm || 
      rfq.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === "__all__" || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="rfq-title">
            {t('rfq.title', 'Request for Quotation Management')}
          </h2>
          <p className="text-muted-foreground" data-testid="rfq-subtitle">
            {t('rfq.subtitle', 'Create and manage supplier quotation requests')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          data-testid="create-rfq-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('rfq.createNew', 'Create RFQ')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('rfq.searchPlaceholder', 'Search RFQs...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-rfqs"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('rfq.filterByStatus', 'Filter by status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* RFQs List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('rfq.listTitle', 'RFQ List')}</CardTitle>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" data-testid="rfqs-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">RFQ Number</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-left p-3 font-medium">Request Date</th>
                    <th className="text-left p-3 font-medium">Response Deadline</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRfqs.map((rfq: any, index: number) => (
                    <tr key={rfq.id} className="border-b hover:bg-muted/50" data-testid={`rfq-row-${index}`}>
                      <td className="p-3 font-mono text-sm" data-testid={`rfq-number-${index}`}>
                        {rfq.number}
                      </td>
                      <td className="p-3" data-testid={`rfq-description-${index}`}>
                        {rfq.description}
                      </td>
                      <td className="p-3" data-testid={`rfq-request-date-${index}`}>
                        {rfq.requestDate}
                      </td>
                      <td className="p-3" data-testid={`rfq-deadline-${index}`}>
                        {rfq.responseDeadline}
                      </td>
                      <td className="p-3" data-testid={`rfq-status-${index}`}>
                        <StatusBadge status={rfq.status} />
                      </td>
                      <td className="p-3">
                        <Button variant="link" size="sm" data-testid={`rfq-view-${index}`}>
                          View
                        </Button>
                        <Button variant="link" size="sm" data-testid={`rfq-edit-${index}`}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredRfqs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground" data-testid="no-rfqs">
                        {t('rfq.noData', 'No RFQs found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create RFQ Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-rfq-modal">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{t('rfq.createTitle', 'Create New RFQ')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                data-testid="close-create-modal"
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requestDate">{t('rfq.requestDate', 'Request Date')}</Label>
                  <Input
                    type="date"
                    id="requestDate"
                    name="requestDate"
                    required
                    data-testid="rfq-request-date-input"
                  />
                </div>
                <div>
                  <Label htmlFor="responseDeadline">{t('rfq.responseDeadline', 'Response Deadline')}</Label>
                  <Input
                    type="date"
                    id="responseDeadline"
                    name="responseDeadline"
                    data-testid="rfq-deadline-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">{t('rfq.description', 'Description (English)')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={t('rfq.descriptionPlaceholder', 'Enter RFQ description...')}
                  rows={3}
                  required
                  data-testid="rfq-description-input"
                />
              </div>

              <div>
                <Label htmlFor="descriptionAr">{t('rfq.descriptionAr', 'Description (Arabic)')}</Label>
                <Textarea
                  id="descriptionAr"
                  name="descriptionAr"
                  placeholder={t('rfq.descriptionArPlaceholder', 'أدخل وصف طلب عرض الأسعار...')}
                  rows={3}
                  className="text-right"
                  dir="rtl"
                  data-testid="rfq-description-ar-input"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={createRfqMutation.isPending}
                  data-testid="submit-rfq"
                >
                  {createRfqMutation.isPending ? 'Creating...' : t('rfq.create', 'Create RFQ')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  data-testid="cancel-rfq-creation"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
