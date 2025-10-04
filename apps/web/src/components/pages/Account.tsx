import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Key, 
  Shield, 
  Activity, 
  Save, 
  Eye, 
  EyeOff, 
  Copy, 
  CheckCircle2,
  Lock,
  Smartphone,
  Globe,
  Clock,
  MapPin,
  Loader2
} from "lucide-react";
import { UserProfile, ActivityLog } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { accountService } from "@/services/auth.service";

const Account = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationToken, setVerificationToken] = useState("");
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    timezone: "",
    language: "en" as "en" | "vi"
  });

  // Load profile on mount
  useEffect(() => {
    loadProfile();
    loadActivityLogs();
  }, []);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone || "",
        timezone: profile.timezone,
        language: profile.language
      });
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      const data = await accountService.getProfile();
      setProfile(data);
      setTwoFactorEnabled(data.twoFactorEnabled);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load profile",
        variant: "destructive"
      });
    }
  };

  const loadActivityLogs = async () => {
    try {
      const data = await accountService.getActivityLogs(1, 10);
      setActivityLogs(data.logs);
    } catch (error: any) {
      console.error("Failed to load activity logs:", error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const updatedProfile = await accountService.updateProfile(profileForm);
      setProfile(updatedProfile);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirm password do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      await accountService.changePassword(passwordForm);
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully"
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change password",
        variant: "destructive"
      });
    }
  };

  const handleEnable2FA = async () => {
    if (twoFactorEnabled) {
      // Disable 2FA - need password confirmation
      const password = prompt("Enter your password to disable 2FA:");
      if (!password) return;

      try {
        await accountService.disable2FA(password);
        setTwoFactorEnabled(false);
        setTwoFactorSetup(null);
        toast({
          title: "2FA disabled",
          description: "Two-factor authentication has been disabled"
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to disable 2FA",
          variant: "destructive"
        });
      }
    } else {
      // Setup 2FA - get QR code
      try {
        const setup = await accountService.setup2FA();
        setTwoFactorSetup(setup);
        toast({
          title: "2FA Setup",
          description: "Scan the QR code with your authenticator app"
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to setup 2FA",
          variant: "destructive"
        });
      }
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast({
        title: "Invalid token",
        description: "Please enter a 6-digit code",
        variant: "destructive"
      });
      return;
    }

    try {
      await accountService.enable2FA(verificationToken);
      setTwoFactorEnabled(true);
      setTwoFactorSetup(null);
      setVerificationToken("");
      toast({
        title: "2FA enabled",
        description: "Two-factor authentication has been enabled successfully"
      });
      loadProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Invalid verification code",
        variant: "destructive"
      });
    }
  };

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Backup code copied to clipboard"
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <User className="h-4 w-4" />;
      case 'logout': return <User className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'config_change': return <Activity className="h-4 w-4" />;
      case 'user_action': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'default';
      case 'logout': return 'secondary';
      case 'security': return 'destructive';
      case 'config_change': return 'outline';
      case 'user_action': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account, security, and preferences</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="2fa">
            <Smartphone className="h-4 w-4 mr-2" />
            Two-Factor Auth
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile && (
                <>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar} alt={profile.fullName} />
                      <AvatarFallback>{profile.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-medium">{profile.fullName}</h3>
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                      <Badge variant="default" className="mt-2">
                        <Shield className="h-3 w-3 mr-1" />
                        {profile.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+84 123 456 789"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={profileForm.timezone} onValueChange={(value) => setProfileForm({ ...profileForm, timezone: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</SelectItem>
                          <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                          <SelectItem value="Asia/Singapore">Asia/Singapore (GMT+8)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                          <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={profileForm.language} onValueChange={(value: any) => setProfileForm({ ...profileForm, language: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="vi">Tiếng Việt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      <p>Account created: {new Date(profile.createdAt).toLocaleDateString()}</p>
                      <p>Last login: {new Date(profile.lastLogin).toLocaleString()}</p>
                    </div>
                    <Button onClick={handleProfileUpdate}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Choose a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={handlePasswordChange} className="w-full">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2FA Tab */}
        <TabsContent value="2fa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Secure your account with time-based one-time passwords
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleEnable2FA}
                />
              </div>

              {twoFactorSetup && (
                <>
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Scan the QR code with your authenticator app to complete setup.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Authenticator App</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                      </p>
                      <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                        <img 
                          src={twoFactorSetup.qrCode} 
                          alt="2FA QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center font-mono">
                        Secret Key: {twoFactorSetup.secret}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Verify Setup</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enter the 6-digit code from your authenticator app to verify and enable 2FA.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter 6-digit code"
                          value={verificationToken}
                          onChange={(e) => setVerificationToken(e.target.value)}
                          maxLength={6}
                        />
                        <Button onClick={handleVerify2FA}>
                          Verify
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Backup Codes</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {twoFactorSetup.backupCodes?.map((code, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded border">
                            <code className="text-sm font-mono">{code}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyBackupCode(code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {twoFactorEnabled && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Two-factor authentication is currently enabled for your account. Toggle the switch above to disable it.
                  </AlertDescription>
                </Alert>
              )}

              {!twoFactorEnabled && !twoFactorSetup && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Two-factor authentication is not enabled. Enable it to add an extra layer of security to your account.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>View your recent account activity and login history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            {getActivityIcon(log.type)}
                            <div>
                              <p className="font-medium">{log.action}</p>
                              {log.details && (
                                <p className="text-xs text-muted-foreground">{log.details}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActivityColor(log.type)}>
                            {log.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Vietnam
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        Windows • Chrome • 192.168.1.100
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active: Just now
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Mobile App</p>
                      <p className="text-sm text-muted-foreground">
                        iOS • Safari • 192.168.1.101
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active: 2 hours ago
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Revoke</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;
