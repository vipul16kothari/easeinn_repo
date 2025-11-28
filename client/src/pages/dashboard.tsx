import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import StatsCard from "@/components/stats-card";
import RoomCard from "@/components/room-card";
import TrialStatus from "@/components/trial-status";
import ProfileCompleteness from "@/components/profile-completeness";
import { Room } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function Dashboard() {
  useEffect(() => {
    document.title = "Hotel Dashboard - EaseInn Management Platform";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Manage your hotel operations efficiently with EaseInn dashboard. Monitor room availability, track occupancy, manage bookings, and view real-time statistics from your comprehensive hotel management interface.');
    }
  }, []);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const { toast } = useToast();

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
  }>({
    queryKey: ["/api/statistics/rooms"],
  });

  const updateRoomStatusMutation = useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/rooms/${roomId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/rooms"] });
      toast({
        title: "Success",
        description: "Room status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive",
      });
    },
  });

  const filteredRooms = rooms.filter(room => {
    if (roomTypeFilter === "all") return true;
    return room.type === roomTypeFilter;
  });

  const handleRoomClick = (room: Room) => {
    const nextStatus = {
      available: "cleaning",
      occupied: "cleaning", 
      cleaning: "available",
      maintenance: "available"
    }[room.status];

    if (nextStatus) {
      updateRoomStatusMutation.mutate({ roomId: room.id, status: nextStatus });
    }
  };

  if (roomsLoading || statsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="dashboard-container">
      {/* Trial Status Banner */}
      <TrialStatus />
      
      {/* Profile Completeness */}
      <ProfileCompleteness />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Available Rooms"
          value={stats?.available || 0}
          icon="fas fa-bed"
          color="success"
        />
        <StatsCard
          title="Occupied"
          value={stats?.occupied || 0}
          icon="fas fa-user-check"
          color="red"
        />
        <StatsCard
          title="Cleaning"
          value={stats?.cleaning || 0}
          icon="fas fa-broom"
          color="warning"
        />
        <StatsCard
          title="Maintenance"
          value={stats?.maintenance || 0}
          icon="fas fa-tools"
          color="purple"
        />
      </div>

      {/* Room Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900" data-testid="room-availability-title">
              Room Availability
            </h2>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10"
                  data-testid="input-date-filter"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-calendar text-gray-400"></i>
                </div>
              </div>
              <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter} data-testid="select-room-type-filter">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Room Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Room Types</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deluxe">Deluxe</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid="room-grid">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={handleRoomClick}
              />
            ))}
          </div>
          
          {filteredRooms.length === 0 && (
            <div className="text-center py-8" data-testid="no-rooms-message">
              <i className="fas fa-bed text-gray-400 text-4xl mb-4"></i>
              <p className="text-gray-500">No rooms found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
