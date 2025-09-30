import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-internationalization";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Settings, 
  ChevronDown,
  FileText,
  Users,
  Truck,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Factory,
  Wrench,
  Clipboard,
  Database,
  BarChart3,
  Building2
} from "lucide-react";

interface SidebarItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  children?: SidebarItemProps[];
  onClick?: () => void;
}

function SidebarItem({ href, icon, label, isActive, children, onClick }: SidebarItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (children) {
    return (
      <div className="space-y-1">
        <Button
          variant="ghost"
          className={`sidebar-nav-item w-full justify-start ${isActive ? 'active' : ''}`}
          onClick={() => {
            setIsExpanded(!isExpanded);
            onClick?.();
          }}
          data-testid={`sidebar-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {icon}
          <span className="ml-3">{label}</span>
          <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
        {isExpanded && (
          <div className="ml-8 space-y-1">
            {children.map((child, index) => (
              <SidebarItem key={index} {...child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href}>
        <Button
          variant="ghost"
          className={`sidebar-nav-item w-full justify-start ${isActive ? 'active' : ''}`}
          data-testid={`sidebar-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {icon}
          <span className="ml-3">{label}</span>
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant="ghost"
      className={`sidebar-nav-item w-full justify-start ${isActive ? 'active' : ''}`}
      onClick={onClick}
      data-testid={`sidebar-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </Button>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useI18n();

  const menuItems: SidebarItemProps[] = [
    {
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: t('sidebar.operationsCockpit', 'Operations Cockpit'),
      isActive: location === "/",
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      label: t('sidebar.procurement', 'Procurement'),
      children: [
        {
          href: "/procurement/rfq",
          icon: <FileText className="h-4 w-4" />,
          label: t('sidebar.rfqManagement', 'RFQ Management'),
          isActive: location === "/procurement/rfq",
        },
        {
          href: "/procurement/purchase-orders",
          icon: <Clipboard className="h-4 w-4" />,
          label: t('sidebar.purchaseOrders', 'Purchase Orders'),
          isActive: location === "/procurement/purchase-orders",
        },
        {
          href: "/master-data/suppliers",
          icon: <Users className="h-4 w-4" />,
          label: t('sidebar.supplier360', 'Supplier 360'),
          isActive: location === "/master-data/suppliers",
        },
      ],
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: t('sidebar.inventory', 'Inventory'),
      children: [
        {
          href: "/inventory/receiving",
          icon: <Truck className="h-4 w-4" />,
          label: t('sidebar.grnReceiving', 'GRN & Receiving'),
          isActive: location === "/inventory/receiving",
        },
        {
          href: "/inventory/material-issue",
          icon: <ArrowUp className="h-4 w-4" />,
          label: t('sidebar.materialIssue', 'Material Issue (MIN)'),
          isActive: location === "/inventory/material-issue",
        },
        {
          href: "/inventory/material-return",
          icon: <ArrowDown className="h-4 w-4" />,
          label: t('sidebar.materialReturn', 'Material Return (MRN)'),
          isActive: location === "/inventory/material-return",
        },
        {
          href: "/inventory/transfers",
          icon: <RefreshCw className="h-4 w-4" />,
          label: t('sidebar.transfersAdjustments', 'Transfers & Adjustments'),
          isActive: location === "/inventory/transfers",
        },
      ],
    },
    {
      icon: <Factory className="h-5 w-5" />,
      label: t('sidebar.production', 'Production'),
      children: [
        {
          href: "/production/bom-designer",
          icon: <Wrench className="h-4 w-4" />,
          label: t('sidebar.bomDesigner', 'BOM Designer'),
          isActive: location === "/production/bom-designer",
        },
        {
          href: "/production/parts-lists",
          icon: <Package className="h-4 w-4" />,
          label: t('sidebar.partsLists', 'Parts Lists'),
          isActive: location === "/production/parts-lists",
        },
        {
          href: "/production/work-orders",
          icon: <Clipboard className="h-4 w-4" />,
          label: t('sidebar.workOrders', 'Work Orders'),
          isActive: location === "/production/work-orders",
        },
        {
          href: "/production/fabrication-console",
          icon: <Factory className="h-4 w-4" />,
          label: t('sidebar.fabricationConsole', 'Fabrication Console'),
          isActive: location === "/production/fabrication-console",
        },
      ],
    },
    {
      icon: <Database className="h-5 w-5" />,
      label: t('sidebar.masterData', 'Master Data'),
      children: [
        {
          href: "/master-data/items",
          icon: <Package className="h-4 w-4" />,
          label: t('sidebar.item360', 'Item 360'),
          isActive: location === "/master-data/items",
        },
        {
          href: "/master-data/warehouses",
          icon: <Building2 className="h-4 w-4" />,
          label: t('sidebar.warehouseManagement', 'Warehouse Management'),
          isActive: location === "/master-data/warehouses",
        },
      ],
    },
    {
      href: "/reports",
      icon: <BarChart3 className="h-5 w-5" />,
      label: t('sidebar.reportsAnalytics', 'Reports & Analytics'),
      isActive: location === "/reports",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: t('sidebar.administration', 'Administration'),
      children: [
        {
          href: "/administration/users",
          icon: <Users className="h-4 w-4" />,
          label: t('sidebar.userManagement', 'User Management'),
          isActive: location === "/administration/users",
        },
        {
          href: "/administration/settings",
          icon: <Settings className="h-4 w-4" />,
          label: t('sidebar.systemSettings', 'System Settings'),
          isActive: location === "/administration/settings",
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-16 overflow-y-auto" data-testid="sidebar">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <SidebarItem key={index} {...item} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
