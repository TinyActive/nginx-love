import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Mail, Key, Trash2, Edit, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import userService, { User } from "@/services/user.service";
import { useStore } from "@/store/useStore";

const Users = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const currentUser = useStore(state => state.currentUser);
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, admins: 0, recentLogins: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "viewer" as "admin" | "moderator" | "viewer",
    status: "active" as "active" | "inactive"
  });

  // Check permissions
  const canManageUsers = currentUser?.role === 'admin';
  const canViewUsers = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  // Load users on mount
  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.response?.data?.message || "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await userService.getStats();
      if (response.success) {
        setStats({
          total: response.data.total,
          active: response.data.active,
          admins: response.data.byRole.admin,
          recentLogins: response.data.recentLogins
        });
      }
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleAddUser = async () => {
    try {
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

      if (editingUser) {
        // Update existing user
        const response = await userService.update(editingUser.id, {
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          status: formData.status
        });

        if (response.success) {
          toast({ title: "User updated successfully" });
          loadUsers();
          loadStats();
        }
      } else {
        // Create new user
        const response = await userService.create({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
          status: formData.status
        });

        if (response.success) {
          toast({ 
            title: "User created successfully",
            description: "User has been invited to the system"
          });
          loadUsers();
          loadStats();
        }
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

  const handleEdit = (user: User) => {
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
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await userService.delete(id);
      if (response.success) {
        toast({ title: "User deleted successfully" });
        loadUsers();
        loadStats();
      }
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    try {
      const response = await userService.updateStatus(id, newStatus);
      if (response.success) {
        toast({ title: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully` });
        loadUsers();
        loadStats();
      }
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's password?")) return;

    try {
      const response = await userService.resetPassword(userId);
      if (response.success) {
        toast({ 
          title: "Password reset successfully",
          description: response.data?.temporaryPassword 
            ? `Temporary password: ${response.data.temporaryPassword}` 
            : "Password reset email sent to user"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error resetting password",
        description: error.response?.data?.message || "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
      case 'moderator': return 'warning';
      case 'viewer': return 'default';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    return <Shield className="h-3 w-3 mr-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users and role-based access control</p>
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
              <Button onClick={handleAddUser}>{editingUser ? "Update" : "Invite"} User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
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
            <div className="text-2xl font-bold">{stats.recentLogins}</div>
            <p className="text-xs text-muted-foreground">
              In the last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
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
                {users.map((user) => (
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
                          <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user.id)}>
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
            <Badge variant="warning">
              <Shield className="h-3 w-3 mr-1" />
              Moderator
            </Badge>
            <p className="text-sm text-muted-foreground">
              Can manage domains, SSL, ModSecurity rules, and view logs. Cannot manage users or delete critical resources.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="default">
              <Shield className="h-3 w-3 mr-1" />
              Viewer
            </Badge>
            <p className="text-sm text-muted-foreground">
              Read-only access: view all configurations, logs, and metrics. Cannot make any changes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
