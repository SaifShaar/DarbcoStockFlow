import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="pt-8 pb-8 px-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-2xl">D</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Darbco ERP</h1>
            <p className="text-muted-foreground">
              Complete inventory and procurement management system
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Procurement workflow management</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Real-time inventory tracking</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Production planning & BOM management</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Arabic/English bilingual support</span>
            </div>
          </div>

          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => window.location.href = '/api/login'}
            data-testid="login-button"
          >
            Sign In to Continue
          </Button>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>© 2024 Darbco Manufacturing Solutions</p>
            <p className="mt-1">Jordan • Manufacturing Excellence</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
