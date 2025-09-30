import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-internationalization";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2, Users, Shield, Eye, EyeOff, Key, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UsersPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  // Fetch Users
  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch Warehouses for scope selection
  const { data: warehouses } = useQuery<any[]>({
    queryKey: ['/api/warehouses'],
  });

  // Fetch Suppliers for scope selection
  const { data: suppliers } = useQuery<any[]>({
    queryKey: ['/api/suppliers'],
  });

  // Create User mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/users', userData);
      const result = await response.json();
      return result.data;
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/users'], 
        exact: false 
      });
      
      setShowCreateForm(false);
      setPassword("");
      setShowPassword(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Update User mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: any }) => {
      const response = await apiRequest('PUT', `/api/users/${id}`, userData);
      const result = await response.json();
      return result.data;
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/users'], 
        exact: false 
      });
      
      setEditingUser(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Delete User mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/users/${id}`);
      const result = await response.json();
      return result.data;
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/users'], 
        exact: false 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Reset Password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const response = await apiRequest('PUT', `/api/users/${id}`, { password });
      const result = await response.json();
      return result.data;
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/users'], 
        exact: false 
      });
      
      setResetPasswordUser(null);
      setNewPassword("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateSecurePassword = () => {
    const length = 12;
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%^&*";
    
    // Ensure at least one character from each class
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    let chars = [];
    chars.push(lowercase[array[0] % lowercase.length]);
    chars.push(uppercase[array[1] % uppercase.length]);
    chars.push(numbers[array[2] % numbers.length]);
    chars.push(special[array[3] % special.length]);
    
    // Fill the rest with random chars from all classes
    const allChars = lowercase + uppercase + numbers + special;
    for (let i = 4; i < length; i++) {
      chars.push(allChars[array[i] % allChars.length]);
    }
    
    // Fisher-Yates shuffle using crypto-safe random values
    const shuffleArray = new Uint8Array(length);
    crypto.getRandomValues(shuffleArray);
    for (let i = length - 1; i > 0; i--) {
      const j = shuffleArray[i] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    
    return chars.join('');
  };

  const generatePassword = () => {
    setPassword(generateSecurePassword());
    setShowPassword(true);
  };

  const handleResetPassword = (user: any) => {
    const newPass = generateSecurePassword();
    setNewPassword(newPass);
    setResetPasswordUser(user);
  };

  const confirmPasswordReset = () => {
    if (resetPasswordUser && newPassword) {
      resetPasswordMutation.mutate({ 
        id: resetPasswordUser.id, 
        password: newPassword 
      });
    }
  };

  const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const warehouseScope = formData.getAll('warehouseScope').filter(val => val !== '__none__');
    const departmentScope = formData.getAll('departmentScope').filter(val => val !== '__none__');
    const supplierScope = formData.getAll('supplierScope').filter(val => val !== '__none__');
    
    const userData = {
      email: formData.get('email'),
      password: password,
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      role: formData.get('role'),
      warehouseScope: warehouseScope.length > 0 ? warehouseScope : null,
      departmentScope: departmentScope.length > 0 ? departmentScope : null,
      supplierScope: supplierScope.length > 0 ? supplierScope : null,
    };
    
    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const warehouseScope = formData.getAll('warehouseScope').filter(val => val !== '__none__');
    const departmentScope = formData.getAll('departmentScope').filter(val => val !== '__none__');
    const supplierScope = formData.getAll('supplierScope').filter(val => val !== '__none__');
    
    const userData = {
      email: formData.get('email'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      role: formData.get('role'),
      warehouseScope: warehouseScope.length > 0 ? warehouseScope : null,
      departmentScope: departmentScope.length > 0 ? departmentScope : null,
      supplierScope: supplierScope.length > 0 ? supplierScope : null,
    };
    
    updateUserMutation.mutate({ id: editingUser.id, userData });
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((user: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'secondary';
      case 'operator': return 'default';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="users-title">
            {t('users.title', 'User Management')}
          </h2>
          <p className="text-muted-foreground" data-testid="users-subtitle">
            {t('users.subtitle', 'Manage user accounts and permissions')}
          </p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) {
            setPassword("");
            setShowPassword(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="create-user-button">
              <Plus className="h-4 w-4 mr-2" />
              {t('users.createUser', 'Create User')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('users.createUserTitle', 'Create New User')}</DialogTitle>
              <DialogDescription>
                {t('users.createUserDescription', 'Add a new user to the system')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('users.firstName', 'First Name')}</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    data-testid="input-firstName"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('users.lastName', 'Last Name')}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    data-testid="input-lastName"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">{t('users.email', 'Email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="password">{t('users.password', 'Password')}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (min 6 characters)"
                      minLength={6}
                      required
                      className="pr-10"
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="toggle-password-visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                    data-testid="generate-password-button"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="role">{t('users.role', 'Role')}</Label>
                <Select name="role" required>
                  <SelectTrigger data-testid="select-role">
                    <SelectValue placeholder={t('users.selectRole', 'Select Role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setPassword("");
                    setShowPassword(false);
                  }}
                  data-testid="button-cancel"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                  data-testid="button-submit"
                >
                  {createUserMutation.isPending ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredUsers.filter((user: any) => user.role === 'admin').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewer Users</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredUsers.filter((user: any) => user.role === 'viewer').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('users.searchPlaceholder', 'Search users...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-users"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('users.usersList', 'Users')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-users-found">
              {t('users.noUsersFound', 'No users found')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Created</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50" data-testid={`user-row-${user.id}`}>
                      <td className="p-4">
                        <div className="font-medium" data-testid={`user-name-${user.id}`}>
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-muted-foreground" data-testid={`user-email-${user.id}`}>
                          {user.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getRoleBadgeVariant(user.role)} data-testid={`user-role-${user.id}`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-muted-foreground" data-testid={`user-created-${user.id}`}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingUser(user)}
                                data-testid={`edit-user-${user.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>{t('users.editUser', 'Edit User')}</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="editFirstName">{t('users.firstName', 'First Name')}</Label>
                                    <Input
                                      id="editFirstName"
                                      name="firstName"
                                      defaultValue={user.firstName}
                                      required
                                      data-testid="edit-input-firstName"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editLastName">{t('users.lastName', 'Last Name')}</Label>
                                    <Input
                                      id="editLastName"
                                      name="lastName"
                                      defaultValue={user.lastName}
                                      required
                                      data-testid="edit-input-lastName"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor="editEmail">{t('users.email', 'Email')}</Label>
                                  <Input
                                    id="editEmail"
                                    name="email"
                                    type="email"
                                    defaultValue={user.email}
                                    required
                                    data-testid="edit-input-email"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="editRole">{t('users.role', 'Role')}</Label>
                                  <Select name="role" defaultValue={user.role} required>
                                    <SelectTrigger data-testid="edit-select-role">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="manager">Manager</SelectItem>
                                      <SelectItem value="operator">Operator</SelectItem>
                                      <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setEditingUser(null)}
                                    data-testid="edit-button-cancel"
                                  >
                                    {t('common.cancel', 'Cancel')}
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    disabled={updateUserMutation.isPending}
                                    data-testid="edit-button-submit"
                                  >
                                    {updateUserMutation.isPending ? t('common.updating', 'Updating...') : t('common.update', 'Update')}
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                            data-testid={`reset-password-${user.id}`}
                          >
                            <Key className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`delete-user-${user.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('users.deleteUser', 'Delete User')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('users.deleteUserConfirmation', 'Are you sure you want to delete this user? This action cannot be undone.')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid="delete-cancel">
                                  {t('common.cancel', 'Cancel')}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  disabled={deleteUserMutation.isPending}
                                  data-testid="delete-confirm"
                                >
                                  {deleteUserMutation.isPending ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <AlertDialog open={!!resetPasswordUser} onOpenChange={(open) => {
        if (!open) {
          setResetPasswordUser(null);
          setNewPassword("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.resetPassword', 'Reset Password')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.resetPasswordDescription', 'A new password has been generated for')} {resetPasswordUser?.firstName} {resetPasswordUser?.lastName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('users.newPassword', 'New Password')}</Label>
              <div className="flex gap-2">
                <Input
                  value={newPassword}
                  readOnly
                  className="font-mono"
                  data-testid="reset-password-value"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(newPassword);
                    toast({
                      title: "Copied",
                      description: "Password copied to clipboard",
                    });
                  }}
                  data-testid="copy-password-button"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('users.copyPasswordWarning', 'Copy this password now. It will not be shown again.')}
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={resetPasswordMutation.isPending}
              data-testid="reset-password-cancel"
            >
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPasswordReset}
              disabled={resetPasswordMutation.isPending}
              data-testid="reset-password-confirm"
            >
              {resetPasswordMutation.isPending ? t('common.resetting', 'Resetting...') : t('users.confirmReset', 'Confirm Reset')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}