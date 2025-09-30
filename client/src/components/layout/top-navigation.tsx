import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/use-internationalization";
import { Search, Bell, Globe, User } from "lucide-react";

export default function TopNavigation() {
  const { user } = useAuth();
  const { language, toggleLanguage } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <nav className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50" data-testid="top-navigation">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <h1 className="text-xl font-semibold">Darbco ERP</h1>
          </div>
          <div className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
            <Search className="text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search items, POs, suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-64 focus-visible:ring-0"
              data-testid="global-search"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center space-x-2"
            data-testid="language-toggle"
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm">{language.toUpperCase()}</span>
          </Button>
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative" data-testid="notifications-button">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </Button>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium" data-testid="user-name">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-muted-foreground" data-testid="user-role">
                {user?.role || 'User'}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-8 h-8 bg-primary rounded-full flex items-center justify-center p-0"
              data-testid="user-menu-button"
            >
              <User className="h-4 w-4 text-primary-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
