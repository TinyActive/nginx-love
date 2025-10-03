import { useState } from 'react';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/auth';
import { toast } from 'sonner';
import { Route } from '@/routes/login';

export default function Login() {
  const { t } = useTranslation();
  const router = useRouter();
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const { login, loginWith2FA, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = Route.useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState('');
  
  const search = Route.useSearch();
  
  const isLoggingIn = isLoading || isSubmitting || authLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (requires2FA && userId) {
        // Verify 2FA token
        const response = await loginWith2FA(userId, twoFactor);
        toast.success('Login successful');
        
        await router.invalidate();
        
        // Wait a moment for auth state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await navigate({ to: search.redirect || '/dashboard' });
      } else {
        // Initial login
        const response = await login(username, password);
        
        if (response.requires2FA) {
          setRequires2FA(true);
          setUserId(response.user.id);
          toast.info('Please enter your 2FA code');
        } else {
          toast.success('Login successful');
          
          await router.invalidate();
          
          // Wait a moment for auth state to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          await navigate({ to: search.redirect || '/dashboard' });
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {requires2FA ? 'Two-Factor Authentication' : t('login.title')}
          </CardTitle>
          <CardDescription>
            {requires2FA 
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Nginx + ModSecurity Management Portal'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!requires2FA && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">{t('login.username')}</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('login.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </>
            )}
            
            {requires2FA && (
              <div className="space-y-2">
                <Label htmlFor="twoFactor">Authentication Code</Label>
                <Input
                  id="twoFactor"
                  type="text"
                  value={twoFactor}
                  onChange={(e) => setTwoFactor(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="text-center text-2xl tracking-widest font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the code from your authenticator app
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoggingIn || (requires2FA && twoFactor.length !== 6)}>
              {isLoggingIn ? 'Verifying...' : requires2FA ? 'Verify & Sign In' : t('login.signin')}
            </Button>

            {requires2FA && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setRequires2FA(false);
                  setUserId('');
                  setTwoFactor('');
                }}
              >
                Back to Login
              </Button>
            )}

            {!requires2FA && (
              <p className="text-xs text-center text-muted-foreground mt-4">
                Demo credentials: <code className="bg-muted px-1 py-0.5 rounded">admin / Admin@123</code>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
