import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
    isPercentage?: boolean;
  };
  className?: string;
  'data-testid'?: string;
}

const variantStyles = {
  default: 'text-foreground',
  destructive: 'text-destructive',
  warning: 'text-yellow-600',
  success: 'text-green-600',
  info: 'text-blue-600',
};

const iconVariantStyles = {
  default: 'bg-muted text-foreground',
  destructive: 'bg-red-100 text-destructive dark:bg-red-900/30',
  warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
};

const trendStyles = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-muted-foreground',
};

const trendIcons = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

export default function MetricCard({ 
  title, 
  value, 
  icon, 
  variant = 'default', 
  trend, 
  className,
  'data-testid': testId 
}: MetricCardProps) {
  return (
    <Card className={cn("metric-card", className)} data-testid={testId}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className={cn("text-2xl font-bold", variantStyles[variant])}>
              {value}
            </p>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            iconVariantStyles[variant]
          )}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className={cn(trendStyles[trend.direction])}>
              {trendIcons[trend.direction]} {trend.value}{trend.isPercentage ? '%' : ''}
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
