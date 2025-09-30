import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/hooks/use-internationalization";

interface ComponentIssueProps {
  component: {
    id: number;
    name: string;
    code: string;
    available: number;
    uom: string;
  };
  bins: Array<{
    id: number;
    code: string;
    quantity: number;
  }>;
  onConfirm: (data: {
    quantity: number;
    binId?: number;
    batchSerial?: string;
  }) => void;
  onCancel: () => void;
  isVisible: boolean;
  'data-testid'?: string;
}

export default function ComponentIssue({
  component,
  bins,
  onConfirm,
  onCancel,
  isVisible,
  'data-testid': testId
}: ComponentIssueProps) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState<number>(0);
  const [binId, setBinId] = useState<string>("");
  const [batchSerial, setBatchSerial] = useState<string>("");

  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > 0) {
      onConfirm({
        quantity,
        binId: binId ? parseInt(binId) : undefined,
        batchSerial: batchSerial.trim() || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid={testId}>
      <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {t('componentIssue.title', 'Issue Component')}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="component">
                {t('componentIssue.component', 'Component')}
              </Label>
              <Input
                id="component"
                value={`${component.name} (${component.code})`}
                readOnly
                className="bg-muted"
                data-testid="issue-component-name"
              />
            </div>
            <div>
              <Label htmlFor="available">
                {t('componentIssue.available', 'Available')}
              </Label>
              <Input
                id="available"
                value={`${component.available} ${component.uom}`}
                readOnly
                className="bg-muted"
                data-testid="issue-available"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">
                {t('componentIssue.issueQuantity', 'Issue Quantity')} *
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                max={component.available}
                step="0.01"
                value={quantity || ""}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                placeholder={t('componentIssue.enterQuantity', 'Enter quantity')}
                required
                data-testid="issue-quantity-input"
              />
            </div>
            <div>
              <Label htmlFor="bin">
                {t('componentIssue.fromBin', 'From Bin')}
              </Label>
              <Select value={binId} onValueChange={setBinId}>
                <SelectTrigger data-testid="issue-bin-select">
                  <SelectValue placeholder={t('componentIssue.autoSelect', 'Auto-select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-select</SelectItem>
                  {bins.map((bin) => (
                    <SelectItem key={bin.id} value={bin.id.toString()}>
                      {bin.code} ({bin.quantity} {component.uom})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="batchSerial">
              {t('componentIssue.batchSerial', 'Batch/Serial (if required)')}
            </Label>
            <Input
              id="batchSerial"
              value={batchSerial}
              onChange={(e) => setBatchSerial(e.target.value)}
              placeholder={t('componentIssue.scanOrEnter', 'Scan or enter batch/serial number')}
              data-testid="issue-batch-serial-input"
            />
          </div>
          
          <div className="flex items-center space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              disabled={quantity <= 0 || quantity > component.available}
              data-testid="confirm-issue-button"
            >
              {t('componentIssue.issueComponent', 'Issue Component')}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              className="flex-1" 
              onClick={onCancel}
              data-testid="cancel-issue-button"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
