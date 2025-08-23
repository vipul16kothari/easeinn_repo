import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Settings2, 
  Hotel,
  TrendingUp,
  Activity
} from "lucide-react";

interface SupportedChannel {
  id: string;
  name: string;
  endpoint: string;
  commission: number;
}

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  supportedChannels: SupportedChannel[];
  onSuccess: () => void;
  hotelId?: string;
}

export function AddChannelModal({ isOpen, onClose, supportedChannels, onSuccess, hotelId }: AddChannelModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedChannel, setSelectedChannel] = useState<SupportedChannel | null>(null);
  
  // Channel configuration form state
  const [formData, setFormData] = useState({
    propertyId: "",
    displayName: "",
    apiCredentials: {
      username: "",
      password: "",
      apiKey: "",
    },
    settings: {
      autoSync: true,
      rateParity: true,
      inventoryBuffer: 5,
    },
    description: "",
  });

  const addChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      const headers = hotelId ? { 'x-hotel-id': hotelId } : {};
      return apiRequest("POST", "/api/channel-manager/channels", data, { headers });
    },
    onSuccess: () => {
      toast({
        title: "Channel Connected!",
        description: `${selectedChannel?.name} has been successfully connected`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/channel-manager/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channel-manager/analytics"] });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect channel",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("select");
    setSelectedChannel(null);
    setFormData({
      propertyId: "",
      displayName: "",
      apiCredentials: {
        username: "",
        password: "",
        apiKey: "",
      },
      settings: {
        autoSync: true,
        rateParity: true,
        inventoryBuffer: 5,
      },
      description: "",
    });
    onClose();
  };

  const handleChannelSelect = (channel: SupportedChannel) => {
    setSelectedChannel(channel);
    setFormData(prev => ({
      ...prev,
      displayName: channel.name,
    }));
    setStep("configure");
  };

  const handleSubmit = () => {
    if (!selectedChannel) return;
    
    const channelData = {
      channelName: selectedChannel.id,
      displayName: formData.displayName,
      propertyId: formData.propertyId,
      apiEndpoint: selectedChannel.endpoint,
      apiCredentials: formData.apiCredentials,
      settings: formData.settings,
      status: "testing", // Start in testing mode
      description: formData.description,
      commissionRate: selectedChannel.commission,
    };
    
    addChannelMutation.mutate(channelData);
  };

  const getChannelIcon = (channelId: string) => {
    switch (channelId.toLowerCase()) {
      case "booking_com":
        return <Globe className="h-8 w-8 text-blue-600" />;
      case "makemytrip":
        return <Hotel className="h-8 w-8 text-red-600" />;
      case "agoda":
        return <TrendingUp className="h-8 w-8 text-purple-600" />;
      case "expedia":
        return <Activity className="h-8 w-8 text-yellow-600" />;
      default:
        return <Globe className="h-8 w-8 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {step === "select" ? "Connect OTA Channel" : `Configure ${selectedChannel?.name}`}
          </DialogTitle>
          <DialogDescription>
            {step === "select" 
              ? "Select an OTA channel to connect to your hotel"
              : "Enter your channel credentials and configure sync settings"
            }
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportedChannels.map((channel) => (
                <Card 
                  key={channel.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleChannelSelect(channel)}
                  data-testid={`select-channel-${channel.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(channel.id)}
                        <div>
                          <CardTitle className="text-lg">{channel.name}</CardTitle>
                          <CardDescription>Commission: {channel.commission}%</CardDescription>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Connect to {channel.name} to start receiving bookings and managing inventory in real-time.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === "configure" && selectedChannel && (
          <div className="space-y-6">
            {/* Channel Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {getChannelIcon(selectedChannel.id)}
                  <div>
                    <h3 className="font-semibold">{selectedChannel.name}</h3>
                    <p className="text-sm text-gray-600">Commission Rate: {selectedChannel.commission}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="How this channel will appear in your dashboard"
                  data-testid="input-display-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property ID</Label>
                <Input
                  id="propertyId"
                  value={formData.propertyId}
                  onChange={(e) => setFormData(prev => ({ ...prev, propertyId: e.target.value }))}
                  placeholder="Your property ID from the OTA"
                  data-testid="input-property-id"
                />
                <p className="text-xs text-gray-500">
                  Find this in your {selectedChannel.name} extranet/partner dashboard
                </p>
              </div>
            </div>

            <Separator />

            {/* API Credentials */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                API Credentials
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.apiCredentials.username}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      apiCredentials: { ...prev.apiCredentials, username: e.target.value }
                    }))}
                    placeholder="API username"
                    data-testid="input-username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.apiCredentials.password}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      apiCredentials: { ...prev.apiCredentials, password: e.target.value }
                    }))}
                    placeholder="API password"
                    data-testid="input-password"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="apiKey">API Key (if required)</Label>
                  <Input
                    id="apiKey"
                    value={formData.apiCredentials.apiKey}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      apiCredentials: { ...prev.apiCredentials, apiKey: e.target.value }
                    }))}
                    placeholder="API key or token"
                    data-testid="input-api-key"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Sync Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold">Sync Settings</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Sync</Label>
                    <p className="text-sm text-gray-500">Automatically sync inventory and rates</p>
                  </div>
                  <Switch
                    checked={formData.settings.autoSync}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, autoSync: checked }
                    }))}
                    data-testid="switch-auto-sync"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rate Parity</Label>
                    <p className="text-sm text-gray-500">Maintain consistent rates across channels</p>
                  </div>
                  <Switch
                    checked={formData.settings.rateParity}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, rateParity: checked }
                    }))}
                    data-testid="switch-rate-parity"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inventoryBuffer">Inventory Buffer</Label>
                  <Input
                    id="inventoryBuffer"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.settings.inventoryBuffer}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, inventoryBuffer: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="Number of rooms to hold back"
                    data-testid="input-inventory-buffer"
                  />
                  <p className="text-xs text-gray-500">
                    Keep this many rooms available for direct bookings
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Notes (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Any additional notes about this channel connection..."
                rows={3}
                data-testid="textarea-description"
              />
            </div>

            {/* Warning */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-yellow-800">Testing Mode</p>
                    <p className="text-sm text-yellow-700">
                      The channel will be connected in testing mode initially. You can activate it after verifying the connection works correctly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between pt-4">
          <div>
            {step === "configure" && (
              <Button
                variant="outline"
                onClick={() => setStep("select")}
                data-testid="button-back"
              >
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
              Cancel
            </Button>
            
            {step === "configure" && (
              <Button
                onClick={handleSubmit}
                disabled={addChannelMutation.isPending || !formData.propertyId || !formData.displayName}
                data-testid="button-connect"
              >
                {addChannelMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  "Connect Channel"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}