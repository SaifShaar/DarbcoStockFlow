import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-internationalization";

interface BuildConfirmationProps {
  workOrder: {
    id: number;
    number: string;
    item: string;
  };
  buildQuantity: number;
  backflushEnabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isVisible: boolean;
  'data-testid'?: string;
}

export default function BuildConfirmation({
  workOrder,
  buildQuantity,
  backflushEnabled,
  onConfirm,
  onCancel,
  isVisible,
  'data-testid': testId
}: BuildConfirmationProps) {
  const { t } = useI18n();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid={testId}>
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <i className="fas fa-check text-green-600"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {t('buildConfirmation.title', 'Confirm Build')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('buildConfirmation.subtitle', 'Review build details before posting')}
            </p>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('buildConfirmation.workOrder', 'Work Order:')}
            </span>
            <span className="font-medium" data-testid="modal-work-order">
              {workOrder.number}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('buildConfirmation.item', 'Item:')}
            </span>
            <span className="font-medium" data-testid="modal-item">
              {workOrder.item}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('buildConfirmation.buildQuantity', 'Build Quantity:')}
            </span>
            <span className="font-medium text-green-600" data-testid="modal-quantity">
              {buildQuantity} PCS
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('buildConfirmation.backflushComponents', 'Backflush Components:')}
            </span>
            <span className="font-medium" data-testid="modal-backflush">
              {backflushEnabled ? t('common.yes', 'Yes') : t('common.no', 'No')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            className="flex-1 bg-green-600 text-white hover:bg-green-700" 
            onClick={onConfirm}
            data-testid="confirm-build-button"
          >
            {t('buildConfirmation.confirmBuild', 'Confirm Build')}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onCancel}
            data-testid="cancel-build-button"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
