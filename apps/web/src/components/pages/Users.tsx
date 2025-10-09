import { useState } from "react";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Key, Trash2, Edit, Shield, Loader2, Users as UsersIcon, Copy, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";
import { SkeletonStatsCard, SkeletonTable } from "@/components/ui/skeletons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useSuspenseUsers,
  useSuspenseUserStats,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUpdateUserStatus,
  useResetUserPassword
} from "@/queries";

// Component for user statistics with suspense
function UserStatsCards() {
  const { data: stats } = useSuspenseUserStats();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.data.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.data.active} active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Administrators</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.data.byRole.admin}</div>
          <p className="text-xs text-muted-foreground">
            Full access users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.data.recentLogins}</div>
          <p className="text-xs text-muted-foreground">
            In the last 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for users table with suspense
function UsersTable() {
  const { toast } = useToast();
  const currentUser = useStore(state => state.currentUser);
  const { data: users } = useSuspenseUsers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ isOpen: boolean; userId: string; username: string; newPassword?: string; }>({ isOpen: false, userId: '', username: '' });
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId: string; username: string }>({ 
    isOpen: false, 
    userId: '', 
    username: '' 
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const updateUserStatus = useUpdateUserStatus();
  const resetUserPassword = useResetUserPassword();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "viewer" as "admin" | "moderator" | "viewer",
    status: "active" as "active" | "inactive" | "suspended"
  });

  // Check permissions
  const canManageUsers = currentUser?.role === 'admin';
  const canViewUsers = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  const handleAddUser = async () => {
    // Validation
    if (!formData.username || !formData.email || !formData.fullName) {
      toast({
        title: "Validation error",
        description: "Username, email, and full name are required",
        variant: "destructive"
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: "Validation error",
        description: "Password is required for new users",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        await updateUser.mutateAsync({
          id: editingUser.id,
          data: {
            username: formData.username,
            email: formData.email,
            fullName: formData.fullName,
            role: formData.role,
            status: formData.status as "active" | "inactive" | "suspended"
          }
        });

        toast({ title: "User updated successfully" });
      } else {
        // Create new user
        await createUser.mutateAsync({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
          status: formData.status as "active" | "inactive"
        });

        toast({
          title: "User created successfully",
          description: "User has been invited to the system"
        });
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: editingUser ? "Error updating user" : "Error creating user",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      fullName: "",
      role: "viewer",
      status: "active"
    });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      fullName: user.fullName || "",
      role: user.role,
      status: user.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const user = users.data.find(u => u.id === id);
    if (!user) return;
    
    setDeleteConfirm({ isOpen: true, userId: id, username: user.username });
  };

  const confirmDelete = async () => {
    try {
      await deleteUser.mutateAsync(deleteConfirm.userId);
      setDeleteConfirm({ isOpen: false, userId: '', username: '' });
      toast({ title: "User deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    const user = users.data.find(u => u.id === id);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    try {
      await updateUserStatus.mutateAsync({ id, status: newStatus });
      toast({ title: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully` });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    // Open confirmation dialog
    setResetPasswordDialog({ isOpen: true, userId, username });
  };

  const confirmResetPassword = async () => {
    if (!resetPasswordDialog.userId) return;

    try {
      const result = await resetUserPassword.mutateAsync(resetPasswordDialog.userId);
      
      // Backend returns: { success, message, data: { temporaryPassword, note } }
      const newPassword = result?.data?.temporaryPassword;
      
      if (!newPassword) {
        throw new Error('Failed to get temporary password from response');
      }
      
      // Force re-render: close and reopen dialog with password
      const currentUserId = resetPasswordDialog.userId;
      const currentUsername = resetPasswordDialog.username;
      
      // Close dialog first
      setResetPasswordDialog({ isOpen: false, userId: '', username: '' });
      
      // Then reopen with password after a tiny delay
      setTimeout(() => {
        setResetPasswordDialog({ 
          isOpen: true, 
          userId: currentUserId, 
          username: currentUsername,
          newPassword: newPassword
        });
        setPasswordCopied(false);
      }, 100);
      
    } catch (error: any) {
      toast({
        title: "Error resetting password",
        description: error.response?.data?.message || error.message || "Failed to reset password",
        variant: "destructive"
      });
      // Close dialog on error
      setResetPasswordDialog({ isOpen: false, userId: '', username: '' });
    }
  };

  const handleCopyPassword = async () => {
    if (!resetPasswordDialog.newPassword) {
      toast({
        title: "No password to copy",
        description: "Password is empty",
        variant: "destructive"
      });
      return;
    }

    const password = resetPasswordDialog.newPassword;
    let copySuccess = false;
    let copyMethod = '';

    try {
      // Method 1: Modern Clipboard API (requires HTTPS or localhost)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(password);
          copySuccess = true;
          copyMethod = 'clipboard API';
        } catch (clipboardError) {
          // Clipboard API failed, will try fallback
        }
      }
      
      // Method 2: execCommand with proper event handling and delay
      if (!copySuccess) {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = password;
          
          // Make it visible but off-screen to ensure it works
          textArea.style.position = 'fixed';
          textArea.style.top = '0';
          textArea.style.left = '-9999px';
          textArea.style.opacity = '0';
          textArea.setAttribute('readonly', '');
          textArea.contentEditable = 'true';
          
          document.body.appendChild(textArea);
          
          // iOS Safari needs this
          if (navigator.userAgent.match(/ipad|iphone/i)) {
            const range = document.createRange();
            range.selectNodeContents(textArea);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            textArea.setSelectionRange(0, password.length);
          } else {
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, password.length);
          }
          
          // Small delay before executing copy
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const successful = document.execCommand('copy');
          
          if (successful) {
            copySuccess = true;
            copyMethod = 'execCommand';
            
            // Keep element for a bit to ensure clipboard is populated
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          document.body.removeChild(textArea);
        } catch (execError) {
          // execCommand failed
        }
      }
      
      if (copySuccess) {
        setPasswordCopied(true);
        toast({ 
          title: "Password copied!",
          description: `Password copied using ${copyMethod}. Try pasting now (Ctrl+V or Cmd+V).`,
          duration: 5000
        });
      } else {
        throw new Error('All copy methods failed');
      }
      
    } catch (error) {
      toast({
        title: "Automatic copy failed",
        description: "Please click the password text to select it, then press Ctrl+C (or Cmd+C) to copy manually",
        variant: "destructive",
        duration: 7000
      });
    }
  };

  const closeResetPasswordDialog = () => {
    setResetPasswordDialog({ isOpen: false, userId: '', username: '' });
    setPasswordCopied(false);
  };

  if (!canViewUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'default';
      case 'viewer': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (_role: string) => {
    return <Shield className="h-3 w-3 mr-1" />;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UsersIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage users and role-based access control</p>
          </div>
        </div>
        {canManageUsers && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingUser(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Invite New User"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Update user information and permissions" : "Send an invitation to a new user"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="john.doe"
                    disabled={!!editingUser}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                {!editingUser && (
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                      <SelectItem value="moderator">Moderator - Can manage configurations</SelectItem>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddUser} disabled={createUser.isPending || updateUser.isPending}>
                  {createUser.isPending || updateUser.isPending ? "Processing..." : `${editingUser ? "Update" : "Invite"} User`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Password Reset Confirmation/Result Dialog */}
      <AlertDialog open={resetPasswordDialog.isOpen} onOpenChange={(open) => !open && closeResetPasswordDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {resetPasswordDialog.newPassword ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Password Reset Successful
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Reset Password Confirmation
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {!resetPasswordDialog.newPassword ? (
                <>
                  <p>Are you sure you want to reset the password for user <strong>{resetPasswordDialog.username}</strong>?</p>
                  <p className="text-sm text-muted-foreground">
                    A new secure password will be generated. The user will need to use this temporary password to log in.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm">
                    Password has been reset for user <strong>{resetPasswordDialog.username}</strong>.
                  </p>
                  <div className="bg-muted p-4 rounded-lg border space-y-2">
                    <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={resetPasswordDialog.newPassword}
                        readOnly
                        className="flex-1 font-mono text-sm"
                        onClick={(e) => e.currentTarget.select()}
                        onFocus={(e) => e.currentTarget.select()}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopyPassword}
                        className="shrink-0"
                      >
                        {passwordCopied ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Click the password field to select all, then press Ctrl+C (or Cmd+C on Mac) to copy
                    </p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Please save this password securely. For security reasons, it cannot be displayed again. 
                        Share it with the user through a secure channel.
                      </span>
                    </p>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {!resetPasswordDialog.newPassword ? (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmResetPassword}
                  disabled={resetUserPassword.isPending}
                >
                  {resetUserPassword.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={closeResetPasswordDialog}>
                Close
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Suspense fallback={<SkeletonStatsCard />}>
        <UserStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.data.length})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleColor(user.role)}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.status === 'active'}
                        onCheckedChange={() => handleToggleStatus(user.id)}
                        disabled={!canManageUsers}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {canManageUsers && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user.id, user.username)}>
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {!canManageUsers && <span className="text-sm text-muted-foreground">-</span>}
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
          <CardTitle>Role Descriptions</CardTitle>
          <CardDescription>Understanding user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="destructive">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
            <p className="text-sm text-muted-foreground">
              Full system access: manage all domains, users, settings, and configurations. Can delete critical resources.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="default">
              <Shield className="h-3 w-3 mr-1" />
              Moderator
            </Badge>
            <p className="text-sm text-muted-foreground">
              Can manage domains, SSL, ModSecurity rules, and view logs. Cannot manage users or delete critical resources.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="secondary">
              <Shield className="h-3 w-3 mr-1" />
              Viewer
            </Badge>
            <p className="text-sm text-muted-foreground">
              Read-only access: view all configurations, logs, and metrics. Cannot make any changes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, userId: '', username: '' })}
        title="Delete User"
        description={
          <div className="space-y-2">
            <p>Are you sure you want to delete user <strong>{deleteConfirm.username}</strong>?</p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All data associated with this user will be permanently removed.
            </p>
          </div>
        }
        confirmText="Delete User"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        isLoading={deleteUser.isPending}
        variant="destructive"
      />
    </>
  );
}

// Main Users component
const Users = () => {
  return (
    <div className="space-y-6">
      <Suspense fallback={<SkeletonTable rows={8} columns={6} title="Users" />}>
        <UsersTable />
      </Suspense>
    </div>
  );
};

export default Users;
