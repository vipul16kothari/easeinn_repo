import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AddChannelModal } from "@/components/add-channel-modal";
import { 
  Wifi, 
  Globe, 
  Settings, 
  Activity, 
  Users, 
  DollarSign, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  RefreshCw,
  BarChart3,
  ArrowRight,
  Hotel,
  TrendingUp
} from "lucide-react";

interface SupportedChannel {
  id: string;
  name: string;
  endpoint: string;
  commission: number;
}

interface Channel {
  id: string;
  channelName: string;
  displayName: string;
  status: "active" | "inactive" | "testing" | "error";
  settings: {
    autoSync: boolean;
    rateParity: boolean;
    inventoryBuffer: number;
    commissionRate: number;
  };
  lastSyncAt?: string;
  nextSyncAt?: string;
}

interface SyncLog {
  id: string;
  channelName: string;
  syncType: string;
  status: "success" | "failed" | "partial";
  recordsProcessed: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export default function ChannelManagerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, hotel } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showAddChannel, setShowAddChannel] = useState(false);

  // Add hotel ID header for API requests
  const apiOptions = hotel?.id ? { headers: { 'x-hotel-id': hotel.id } } : {};

  // Fetch supported channels
  const { data: supportedChannels, isLoading: loadingSupported } = useQuery({
    queryKey: ["/api/channel-manager/supported-channels"],
    retry: false,
    enabled: !!hotel?.id,
    meta: { headers: { 'x-hotel-id': hotel?.id } },
  });

  // Fetch connected channels
  const { data: channels = [], isLoading: loadingChannels } = useQuery({
    queryKey: ["/api/channel-manager/channels"],
    retry: false,
    enabled: !!hotel?.id,
    meta: { headers: { 'x-hotel-id': hotel?.id } },
  });

  // Fetch sync logs
  const { data: syncLogs = [], isLoading: loadingSyncLogs } = useQuery({
    queryKey: ["/api/channel-manager/sync-logs"],
    retry: false,
    enabled: !!hotel?.id,
    meta: { headers: { 'x-hotel-id': hotel?.id } },
  });

  // Fetch analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["/api/channel-manager/analytics"],
    retry: false,
    enabled: !!hotel?.id,
    meta: { headers: { 'x-hotel-id': hotel?.id } },
  });

  // Sync all channels mutation
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/channel-manager/sync-inventory", {}, apiOptions);
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Initiated",
        description: `Inventory sync started for ${data.syncedChannels} channels`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/channel-manager/sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channel-manager/analytics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync inventory",
        variant: "destructive",
      });
    },
  });

  // Sync specific channel mutation
  const syncChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      return apiRequest("POST", `/api/channel-manager/channels/${channelId}/sync`, {}, apiOptions);
    },
    onSuccess: (data) => {
      toast({
        title: "Channel Synced",
        description: `${data.channelName} inventory updated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/channel-manager/sync-logs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync channel",
        variant: "destructive",
      });
    },
  });

  const getChannelIcon = (channelName: string) => {
    switch (channelName.toLowerCase()) {
      case "booking_com":
        return <Globe className="h-5 w-5 text-blue-600" />;
      case "makemytrip":
        return <Hotel className="h-5 w-5 text-red-600" />;
      case "agoda":
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      case "expedia":
        return <Activity className="h-5 w-5 text-yellow-600" />;
      default:
        return <Globe className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "inactive":
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
      case "testing":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Testing</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Show loading or authentication prompt
  if (!hotel?.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-4">Please log in to access the Channel Manager</p>
              <Button onClick={() => window.location.href = '/login'}>
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingSupported || loadingChannels) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" data-testid="channel-manager-page">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Channel Manager</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sync your inventory and rates across all major OTAs
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending || channels.length === 0}
              data-testid="button-sync-all"
            >
              {syncAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync All Channels
            </Button>
            <Button onClick={() => setShowAddChannel(true)} data-testid="button-add-channel">
              <Plus className="h-4 w-4 mr-2" />
              Add Channel
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Channels</p>
                    <p className="text-2xl font-bold">{analytics.totalChannels}</p>
                  </div>
                  <Globe className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Channels</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.activeChannels}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Bookings</p>
                    <p className="text-2xl font-bold">{analytics.bookingsToday}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{analytics.revenue.total.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="channels" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="channels">Connected Channels</TabsTrigger>
            <TabsTrigger value="available">Available OTAs</TabsTrigger>
            <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Connected Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            {channels.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Channels Connected</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Connect your first OTA channel to start syncing inventory and rates
                  </p>
                  <Button onClick={() => setShowAddChannel(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Channel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels.map((channel: Channel) => (
                  <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getChannelIcon(channel.channelName)}
                          <div>
                            <CardTitle className="text-lg">{channel.displayName}</CardTitle>
                            <CardDescription>Commission: {channel.settings.commissionRate}%</CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(channel.status)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Auto Sync</span>
                          <Badge variant={channel.settings.autoSync ? "default" : "secondary"}>
                            {channel.settings.autoSync ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Rate Parity</span>
                          <Badge variant={channel.settings.rateParity ? "default" : "secondary"}>
                            {channel.settings.rateParity ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Buffer Rooms</span>
                          <span className="font-medium">{channel.settings.inventoryBuffer}</span>
                        </div>
                        
                        {channel.lastSyncAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
                            Last sync: {new Date(channel.lastSyncAt).toLocaleDateString()}
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncChannelMutation.mutate(channel.id)}
                            disabled={syncChannelMutation.isPending}
                            data-testid={`button-sync-${channel.channelName}`}
                          >
                            {syncChannelMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Available OTAs Tab */}
          <TabsContent value="available" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supportedChannels?.map((channel: SupportedChannel) => {
                const isConnected = channels.some((c: Channel) => c.channelName === channel.id);
                
                return (
                  <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getChannelIcon(channel.id)}
                          <div>
                            <CardTitle className="text-lg">{channel.name}</CardTitle>
                            <CardDescription>Commission: {channel.commission}%</CardDescription>
                          </div>
                        </div>
                        {isConnected && (
                          <Badge className="bg-green-100 text-green-800">Connected</Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Connect to {channel.name} to start receiving bookings and managing inventory
                        </p>
                        
                        <Button 
                          className="w-full" 
                          disabled={isConnected}
                          data-testid={`button-connect-${channel.id}`}
                        >
                          {isConnected ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Connected
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Connect Channel
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Sync Logs Tab */}
          <TabsContent value="sync-logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Activity</CardTitle>
                <CardDescription>Track the status of inventory and rate synchronization</CardDescription>
              </CardHeader>
              
              <CardContent>
                {syncLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No sync activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {syncLogs.map((log: SyncLog) => (
                      <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            log.status === 'success' ? 'bg-green-500' :
                            log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <div>
                            <p className="font-medium">{log.channelName} - {log.syncType}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {log.recordsProcessed} records processed
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(log.startedAt).toLocaleString()}
                          </p>
                          {log.status === 'failed' && log.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Channel Performance</CardTitle>
                  <CardDescription>Revenue and booking distribution by channel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics?.revenue?.byChannel || {}).map(([channel, revenue]: [string, any]) => (
                      <div key={channel} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getChannelIcon(channel)}
                          <span className="font-medium">{channel}</span>
                        </div>
                        <span className="font-bold">₹{revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sync Status Overview</CardTitle>
                  <CardDescription>Current synchronization status across all channels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Overall Sync Status</span>
                      <Badge className={analytics?.syncStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {analytics?.syncStatus || 'Pending'}
                      </Badge>
                    </div>
                    
                    {analytics?.lastSyncDate && (
                      <div className="flex items-center justify-between">
                        <span>Last Sync</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(analytics.lastSyncDate).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Coming Soon Notice */}
        <Card className="border-dashed border-2 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Channel Manager Setup Required
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              The channel manager feature requires database schema updates to be fully functional. 
              Connect with your system administrator to enable this powerful feature.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-yellow-600 dark:text-yellow-400">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                UI Ready
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                API Endpoints
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Database Schema
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Add Channel Modal */}
        <AddChannelModal
          isOpen={showAddChannel}
          onClose={() => setShowAddChannel(false)}
          supportedChannels={supportedChannels || []}
          hotelId={hotel?.id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/channel-manager/channels"] });
            queryClient.invalidateQueries({ queryKey: ["/api/channel-manager/analytics"] });
          }}
        />
      </div>
    </div>
  );
}