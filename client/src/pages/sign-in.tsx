import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, Building2, Globe } from "lucide-react";

export default function SignInPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (!email || !password) {
        toast({
          title: "Error",
          description: "Please enter your email and password",
          variant: "destructive",
        });
        return;
      }

      // Call the login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Welcome!",
          description: `Signed in successfully as ${result.data.firstName} ${result.data.lastName}`,
        });
        
        // Redirect to dashboard
        window.location.href = '/';
      } else {
        toast({
          title: "Sign In Failed",
          description: result.message || "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "Password reset functionality will be available soon.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {t('signIn.welcome', 'Welcome to Darbco ERP')}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {t('signIn.subtitle', 'Sign in to access your manufacturing operations')}
          </p>
        </div>

        {/* Sign In Form */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center" data-testid="sign-in-title">
              {t('signIn.title', 'Sign In')}
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              {t('signIn.description', 'Enter your credentials to continue')}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('signIn.email', 'Email Address')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@darbco.com"
                    className="pl-10"
                    required
                    data-testid="email-input"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t('signIn.password', 'Password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    required
                    data-testid="password-input"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    data-testid="remember-me"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t('signIn.rememberMe', 'Remember me')}
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 font-normal"
                  onClick={handleForgotPassword}
                  data-testid="forgot-password"
                >
                  {t('signIn.forgotPassword', 'Forgot password?')}
                </Button>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isLoading}
                data-testid="sign-in-button"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('signIn.signingIn', 'Signing in...')}
                  </div>
                ) : (
                  t('signIn.signIn', 'Sign In')
                )}
              </Button>
            </form>

            {/* Alternative Sign In */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('signIn.or', 'Or continue with')}
                </span>
              </div>
            </div>

            {/* Replit Auth Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/api/login'}
              data-testid="replit-auth-button"
            >
              <Globe className="h-4 w-4 mr-2" />
              {t('signIn.replitAuth', 'Replit Authentication')}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('signIn.secureConnection', 'Your connection is secure and encrypted')}
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
            <span>© 2024 Darbco</span>
            <span>•</span>
            <span>{t('signIn.jordan', 'Made in Jordan')}</span>
            <span>•</span>
            <span>{t('signIn.manufacturing', 'Manufacturing Excellence')}</span>
          </div>
        </div>

        {/* Demo Credentials */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2 text-sm">
              {t('signIn.demoCredentials', 'Demo Credentials')}
            </h3>
            <div className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
              <p><strong>Email:</strong> admin@darbco.com</p>
              <p><strong>Password:</strong> demo123</p>
              <p className="text-blue-600 dark:text-blue-500 mt-2">
                {t('signIn.demoNote', 'Use these credentials for demonstration purposes')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}