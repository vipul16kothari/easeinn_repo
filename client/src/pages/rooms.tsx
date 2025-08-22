import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Bed, AlertTriangle } from "lucide-react";
import { useHotelConfig } from "@/hooks/useHotelConfig";
import type { Room, InsertRoom } from "@shared/schema";

export default function RoomsPage() {
  useEffect(() => {
    document.title = "Room Management - EaseInn Hotel Platform";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Manage your hotel rooms efficiently with EaseInn. Add new rooms, edit room details, set pricing, and track room status from available to occupied with real-time updates.');
    }
  }, []);

  const { toast } = useToast();
  const { hotel, config } = useHotelConfig();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState<InsertRoom>({
    number: "",
    type: "standard",
    status: "available",
    basePrice: "0",
    hotelId: ""
  });

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Check if hotel has reached room capacity
  const currentRoomCount = rooms.length;
  const enabledRoomsLimit = config.enabledRooms;
  const isAtCapacity = currentRoomCount >= enabledRoomsLimit;

  const createRoomMutation = useMutation({
    mutationFn: async (roomData: InsertRoom) => {
      return await apiRequest("POST", "/api/rooms", roomData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/available"] });
      setIsAddDialogOpen(false);
      setNewRoom({ number: "", type: "standard", status: "available", basePrice: "0", hotelId: "" });
      toast({
        title: "Room created",
        description: "Room has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateRoomStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/rooms/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/rooms"] });
      toast({
        title: "Room updated",
        description: "Room status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update room status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = () => {
    if (!newRoom.number.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room number.",
        variant: "destructive",
      });
      return;
    }
    if (!newRoom.basePrice || parseFloat(newRoom.basePrice) < 0) {
      toast({
        title: "Error",
        description: "Base price is required and must be positive.",
        variant: "destructive",
      });
      return;
    }
    // Hotel ID will be auto-assigned by the server
    createRoomMutation.mutate(newRoom);
  };

  const handleStatusChange = (room: Room, newStatus: string) => {
    updateRoomStatusMutation.mutate({ id: room.id, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "text-green-600 bg-green-50 border-green-200";
      case "occupied": return "text-red-600 bg-red-50 border-red-200";
      case "cleaning": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "maintenance": return "text-orange-600 bg-orange-50 border-orange-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRoomTypeIcon = (type: string) => {
    return <Bed className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600 mt-1">Manage your hotel rooms and their status</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-room">
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>
                Add a new room to your hotel inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-number" className="text-right">
                  Room Number
                </Label>
                <Input
                  id="room-number"
                  value={newRoom.number}
                  onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., 101"
                  data-testid="input-room-number"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-type" className="text-right">
                  Type
                </Label>
                <Select
                  value={newRoom.type}
                  onValueChange={(value: any) => setNewRoom({ ...newRoom, type: value })}
                >
                  <SelectTrigger className="col-span-3" data-testid="select-room-type">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-status" className="text-right">
                  Initial Status
                </Label>
                <Select
                  value={newRoom.status}
                  onValueChange={(value: any) => setNewRoom({ ...newRoom, status: value })}
                >
                  <SelectTrigger className="col-span-3" data-testid="select-room-status">
                    <SelectValue placeholder="Select initial status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="base-price" className="text-right">
                  Base Price (₹)
                </Label>
                <Input
                  id="base-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newRoom.basePrice}
                  onChange={(e) => setNewRoom({ ...newRoom, basePrice: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., 2000.00"
                  data-testid="input-base-price"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateRoom}
                disabled={createRoomMutation.isPending}
                data-testid="button-create-room"
              >
                {createRoomMutation.isPending ? "Creating..." : "Create Room"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bed className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600 text-center mb-4">
              Get started by adding your first room to the system.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-room">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room: Room) => (
            <Card key={room.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getRoomTypeIcon(room.type)}
                    <CardTitle className="text-lg">Room {room.number}</CardTitle>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(room.status)}`}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{room.type}</span>
                  </div>
                  <div className="pt-2">
                    <Label className="text-xs text-gray-600 mb-2 block">Change Status:</Label>
                    <Select
                      value={room.status}
                      onValueChange={(value) => handleStatusChange(room, value)}
                      disabled={updateRoomStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-full" data-testid={`select-status-${room.number}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}