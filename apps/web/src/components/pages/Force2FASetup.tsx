import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { accountService } from '@/services/auth.service';

interface Force2FASetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function Force2FASetup({ onComplete, onSkip }: Force2FASetupProps) {
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; qrCode: string; backupCodes: string[] } | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  useEffect(() => {
    // Setup 2FA on component mount
    const setup2FA = async () => {
      try {
        const setup = await accountService.setup2FA();
        setTwoFactorSetup(setup);
      } catch (error: any) {
        toast.error('Failed to setup 2FA', {
          description: error.response?.data?.message || 'Please try again',
        });
      } finally {
        setIsLoading(false);
      }
    };

    setup2FA();
  }, []);

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationToken || verificationToken.length !== 6) {
      toast.error('Invalid token', {
        description: 'Please enter a 6-digit code',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await accountService.enable2FA(verificationToken);
      toast.success('🛡️ 2FA Enabled Successfully', {
        description: 'Your account is now secured with two-factor authentication!',
      });
      
      // Complete the setup
      onComplete();
    } catch (error: any) {
      toast.error('Verification failed', {
        description: error.response?.data?.message || 'Invalid verification code',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setShowSkipDialog(true);
  };

  const handleConfirmSkip = () => {
    setShowSkipDialog(false);
    toast.warning('⚠️ 2FA Not Enabled', {
      description: 'Your account is not protected by two-factor authentication',
    });
    if (onSkip) {
      onSkip();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Setting up 2FA...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!twoFactorSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <Alert className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <AlertDescription className="text-red-800 dark:text-red-200">
                Failed to setup 2FA. Please contact administrator.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Security Warning Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Security Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                You are about to skip Two-Factor Authentication setup.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
                <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
                  ⚠️ Security Risks:
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1 ml-4 list-disc">
                  <li>Your account will be vulnerable to unauthorized access</li>
                  <li>Single password authentication is not secure enough</li>
                  <li>Risk of account compromise increases significantly</li>
                  <li>System administrators may restrict your access</li>
                </ul>
              </div>
              <p className="text-sm font-medium text-foreground">
                Are you sure you want to continue without 2FA?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back & Setup 2FA</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSkip}
              className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
            >
              I Understand the Risks, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Enable Two-Factor Authentication</CardTitle>
          <CardDescription>
            Secure your account with an additional layer of protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Two-factor authentication significantly improves your account security by requiring both your password and a verification code.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Step 1: Scan QR Code</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
              </p>
              <div className="flex items-center justify-center p-4 bg-white rounded-lg border">
                <img 
                  src={twoFactorSetup.qrCode} 
                  alt="2FA QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center font-mono">
                Manual Entry: {twoFactorSetup.secret}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Step 2: Save Backup Codes</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Save these backup codes in a secure location. You can use them to access your account if you lose your device.
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                {twoFactorSetup.backupCodes.map((code, index) => (
                  <div key={index} className="font-mono text-sm flex items-center justify-between">
                    <span>{code}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        toast.success('Code copied to clipboard');
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Step 3: Verify Setup</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 6-digit code from your authenticator app to verify and enable 2FA.
                </p>
                <Input
                  placeholder="Enter 6-digit code"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={verificationToken.length !== 6 || isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Enable 2FA'}
              </Button>
            </form>
          </div>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Once verified, you'll be able to access the system with your new password and 2FA enabled.
            </AlertDescription>
          </Alert>

          {onSkip && (
            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={handleSkip}
              >
                Skip for now (Not recommended)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
