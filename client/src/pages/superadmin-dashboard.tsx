import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Users, TrendingUp, FileText, AlertCircle, Check, X, Clock, Phone, Mail, MapPin, Star, Calendar, ChevronRight, Shield, Activity, History, Key, Eye, EyeOff, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface PlatformStats {
  totalHotels: number;
  activeHotels: number;
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    rejected: number;
  };
}

interface Lead {
  id: string;
  hotelName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  hotelAddress: string | null;
  city: string | null;
  state: string | null;
  numberOfRooms: number | null;
  status: string;
  source: string | null;
  notes: string | null;
  createdAt: string;
}

interface Hotel {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  subscriptionPlan: string | null;
  subscriptionEndDate: string | null;
  isActive: boolean;
  maxRooms: number;
  enabledRooms: number;
  city: string | null;
  state: string | null;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  description: string | null;
  createdAt: string;
}

function StatCard({ title, value, icon: Icon, description, trend }: { title: string; value: number | string; icon: any; description?: string; trend?: "up" | "down" | "neutral" }) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-purple-100 text-purple-800",
    demo_scheduled: "bg-indigo-100 text-indigo-800",
    trial_started: "bg-cyan-100 text-cyan-800",
    converted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    churned: "bg-gray-100 text-gray-800",
  };

  return (
    <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"} data-testid={`lead-status-${status}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function LeadsTable({ leads, onStatusUpdate, onConvert }: { leads: Lead[]; onStatusUpdate: (id: string, status: string) => void; onConvert: (lead: Lead) => void }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return apiRequest("PATCH", `/api/superadmin/leads/${id}`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stats"] });
      toast({ title: "Lead updated successfully" });
      setSelectedLead(null);
    },
    onError: () => {
      toast({ title: "Failed to update lead", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Hotel</th>
              <th className="p-3 text-left font-medium">Contact</th>
              <th className="p-3 text-left font-medium">Location</th>
              <th className="p-3 text-left font-medium">Rooms</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Date</th>
              <th className="p-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b hover:bg-muted/25" data-testid={`lead-row-${lead.id}`}>
                <td className="p-3">
                  <div className="font-medium">{lead.hotelName}</div>
                  <div className="text-xs text-muted-foreground">{lead.source}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="text-xs">{lead.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="text-xs">{lead.contactPhone}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-xs">
                    {lead.city && lead.state ? `${lead.city}, ${lead.state}` : "-"}
                  </div>
                </td>
                <td className="p-3">{lead.numberOfRooms || "-"}</td>
                <td className="p-3">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="p-3 text-xs">
                  {format(new Date(lead.createdAt), "MMM d, yyyy")}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLead(lead);
                            setNewStatus(lead.status);
                            setNotes(lead.notes || "");
                          }}
                          data-testid={`btn-update-lead-${lead.id}`}
                        >
                          Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Lead Status</DialogTitle>
                          <DialogDescription>
                            Update the status and notes for {lead.hotelName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                              <SelectTrigger data-testid="select-lead-status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                                <SelectItem value="trial_started">Trial Started</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add notes about this lead..."
                              data-testid="input-lead-notes"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              if (selectedLead) {
                                updateMutation.mutate({ id: selectedLead.id, status: newStatus, notes });
                              }
                            }}
                            disabled={updateMutation.isPending}
                            data-testid="btn-save-lead-status"
                          >
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {lead.status !== "converted" && lead.status !== "rejected" && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onConvert(lead)}
                        data-testid={`btn-convert-lead-${lead.id}`}
                      >
                        Convert
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leads.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No leads found
        </div>
      )}
    </div>
  );
}

function ConvertLeadDialog({ lead, open, onClose }: { lead: Lead | null; open: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("changeme123");
  const [subscriptionPlan, setSubscriptionPlan] = useState("trial");
  const [maxRooms, setMaxRooms] = useState(lead?.numberOfRooms?.toString() || "50");
  const { toast } = useToast();

  const convertMutation = useMutation({
    mutationFn: async ({ leadId, password, subscriptionPlan, maxRooms }: any) => {
      return apiRequest("POST", `/api/superadmin/leads/${leadId}/convert`, {
        password,
        subscriptionPlan,
        maxRooms: parseInt(maxRooms),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/hotels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stats"] });
      toast({
        title: "Lead converted successfully",
        description: `Hotel created with email: ${lead?.contactEmail}`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to convert lead",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Lead to Hotel</DialogTitle>
          <DialogDescription>
            This will create a hotel account and user for {lead.hotelName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-md bg-muted p-3 space-y-1">
            <div className="font-medium">{lead.hotelName}</div>
            <div className="text-sm text-muted-foreground">{lead.contactName}</div>
            <div className="text-sm text-muted-foreground">{lead.contactEmail}</div>
          </div>
          <div className="space-y-2">
            <Label>Temporary Password</Label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set initial password"
              data-testid="input-convert-password"
            />
            <p className="text-xs text-muted-foreground">
              Share this password with the hotel owner. They should change it on first login.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Subscription Plan</Label>
            <Select value={subscriptionPlan} onValueChange={setSubscriptionPlan}>
              <SelectTrigger data-testid="select-subscription-plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial (14 days)</SelectItem>
                <SelectItem value="hotelier">Hotelier (₹1,999/month)</SelectItem>
                <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Maximum Rooms</Label>
            <Input
              type="number"
              value={maxRooms}
              onChange={(e) => setMaxRooms(e.target.value)}
              data-testid="input-max-rooms"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="btn-cancel-convert">
            Cancel
          </Button>
          <Button
            onClick={() => {
              convertMutation.mutate({
                leadId: lead.id,
                password,
                subscriptionPlan,
                maxRooms,
              });
            }}
            disabled={convertMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
            data-testid="btn-confirm-convert"
          >
            {convertMutation.isPending ? "Converting..." : "Convert Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HotelsTable({ hotels }: { hotels: Hotel[] }) {
  const { toast } = useToast();

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">Hotel</th>
            <th className="p-3 text-left font-medium">Location</th>
            <th className="p-3 text-left font-medium">Subscription</th>
            <th className="p-3 text-left font-medium">Rooms</th>
            <th className="p-3 text-left font-medium">Status</th>
            <th className="p-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {hotels.map((hotel) => (
            <tr key={hotel.id} className="border-b hover:bg-muted/25" data-testid={`hotel-row-${hotel.id}`}>
              <td className="p-3">
                <div className="font-medium">{hotel.name}</div>
                <div className="text-xs text-muted-foreground">{hotel.email}</div>
              </td>
              <td className="p-3">
                <div className="text-xs">
                  {hotel.city && hotel.state ? `${hotel.city}, ${hotel.state}` : hotel.address?.slice(0, 30)}
                </div>
              </td>
              <td className="p-3">
                <Badge variant={hotel.subscriptionPlan === "trial" ? "secondary" : "default"}>
                  {hotel.subscriptionPlan || "None"}
                </Badge>
                {hotel.subscriptionEndDate && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Expires: {format(new Date(hotel.subscriptionEndDate), "MMM d, yyyy")}
                  </div>
                )}
              </td>
              <td className="p-3">
                <span>{hotel.enabledRooms}</span>
                <span className="text-muted-foreground">/{hotel.maxRooms}</span>
              </td>
              <td className="p-3">
                <Badge variant={hotel.isActive ? "default" : "destructive"}>
                  {hotel.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="p-3">
                <Button variant="outline" size="sm" data-testid={`btn-manage-hotel-${hotel.id}`}>
                  Manage
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hotels.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hotels found
        </div>
      )}
    </div>
  );
}

function UsersTable({ users }: { users: User[] }) {
  const { toast } = useToast();
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const response = await apiRequest("POST", `/api/superadmin/users/${userId}/reset-password`, { newPassword: password });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset",
        description: `Password for ${data.email} has been reset successfully.`,
      });
      setResetPasswordUser(null);
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = () => {
    if (!resetPasswordUser) return;
    if (newPassword.length < 8) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate({ userId: resetPasswordUser.id, password: newPassword });
  };

  return (
    <>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">User</th>
              <th className="p-3 text-left font-medium">Role</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Joined</th>
              <th className="p-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-muted/25" data-testid={`user-row-${user.id}`}>
                <td className="p-3">
                  <div className="font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </td>
                <td className="p-3">
                  <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant={user.isActive ? "outline" : "destructive"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-3 text-xs">
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setResetPasswordUser(user);
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      data-testid={`btn-reset-password-${user.id}`}
                    >
                      <Key className="h-3 w-3 mr-1" />
                      Reset Password
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        )}
      </div>

      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetPasswordUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
              />
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending || !newPassword || newPassword !== confirmPassword}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="btn-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">Time</th>
            <th className="p-3 text-left font-medium">User</th>
            <th className="p-3 text-left font-medium">Action</th>
            <th className="p-3 text-left font-medium">Entity</th>
            <th className="p-3 text-left font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b hover:bg-muted/25" data-testid={`audit-row-${log.id}`}>
              <td className="p-3 text-xs">
                {format(new Date(log.createdAt), "MMM d, HH:mm")}
              </td>
              <td className="p-3 text-xs">{log.userEmail || "-"}</td>
              <td className="p-3">
                <Badge variant="outline">{log.action}</Badge>
              </td>
              <td className="p-3 text-xs">
                <span className="text-muted-foreground">{log.entityType}</span>
                {log.entityId && <span className="ml-1">#{log.entityId.slice(0, 8)}</span>}
              </td>
              <td className="p-3 text-xs text-muted-foreground">
                {log.description || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No audit logs found
        </div>
      )}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [convertLead, setConvertLead] = useState<Lead | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/superadmin/stats"],
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ leads: Lead[]; total: number }>({
    queryKey: ["/api/superadmin/leads"],
  });

  const { data: hotelsData, isLoading: hotelsLoading } = useQuery<{ hotels: Hotel[]; total: number }>({
    queryKey: ["/api/superadmin/hotels"],
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: User[]; total: number }>({
    queryKey: ["/api/superadmin/users"],
  });

  const { data: auditData, isLoading: auditLoading } = useQuery<{ logs: AuditLog[]; total: number }>({
    queryKey: ["/api/superadmin/audit-logs"],
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">SuperAdmin Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">EaseInn Platform Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" data-testid="btn-refresh-data">
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Hotels"
            value={stats?.totalHotels || 0}
            icon={Building2}
            description={`${stats?.activeHotels || 0} active`}
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            description={`${stats?.activeUsers || 0} active`}
          />
          <StatCard
            title="New Leads"
            value={stats?.leadsByStatus?.new || 0}
            icon={TrendingUp}
            description={`${stats?.totalLeads || 0} total leads`}
          />
          <StatCard
            title="Conversions"
            value={stats?.leadsByStatus?.converted || 0}
            icon={Check}
            description="Leads converted to hotels"
          />
        </div>

        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList className="bg-white dark:bg-gray-800">
            <TabsTrigger value="leads" className="gap-2" data-testid="tab-leads">
              <TrendingUp className="h-4 w-4" />
              Leads ({leadsData?.leads?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="hotels" className="gap-2" data-testid="tab-hotels">
              <Building2 className="h-4 w-4" />
              Hotels ({hotelsData?.hotels?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" />
              Users ({usersData?.users?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2" data-testid="tab-audit">
              <History className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Management</CardTitle>
                <CardDescription>
                  Review and convert leads to hotel accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="text-center py-8">Loading leads...</div>
                ) : (
                  <LeadsTable
                    leads={leadsData?.leads || []}
                    onStatusUpdate={() => {}}
                    onConvert={(lead) => setConvertLead(lead)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hotels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hotel Management</CardTitle>
                <CardDescription>
                  Manage all registered hotels on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hotelsLoading ? (
                  <div className="text-center py-8">Loading hotels...</div>
                ) : (
                  <HotelsTable hotels={hotelsData?.hotels || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage platform users and their access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
                  <UsersTable users={usersData?.users || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Track all platform activities and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="text-center py-8">Loading audit logs...</div>
                ) : (
                  <AuditLogsTable logs={auditData?.logs || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <ConvertLeadDialog
        lead={convertLead}
        open={!!convertLead}
        onClose={() => setConvertLead(null)}
      />
    </div>
  );
}
