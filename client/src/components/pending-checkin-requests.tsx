import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Room } from "@shared/schema";
import { useState } from "react";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  Check, 
  X, 
  Clock,
  BedDouble,
  Loader2,
  QrCode,
  ArrowRight,
  FileText,
  Eye
} from "lucide-react";

interface SelfCheckInRequest {
  id: string;
  hotelId: string;
  fullName: string;
  phone: string;
  email: string | null;
  numberOfGuests: number;
  numberOfMales: number;
  numberOfFemales: number;
  numberOfChildren: number;
  checkInDate: string;
  checkOutDate: string | null;
  preferredRoomType: string | null;
  documentType: string | null;
  documentNumber: string | null;
  documentImage: string | null;
  comingFrom: string | null;
  nationality: string | null;
  purposeOfVisit: string | null;
  specialRequests: string | null;
  status: "pending" | "approved" | "rejected" | "converted";
  assignedRoomId: string | null;
  createdAt: string;
}

export default function PendingCheckInRequests() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<SelfCheckInRequest | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  const { data: pendingRequests = [], isLoading } = useQuery<SelfCheckInRequest[]>({
    queryKey: ["/api/self-checkin-requests", "pending"],
    queryFn: async () => {
      const response = await fetch("/api/self-checkin-requests?status=pending");
      if (!response.ok) throw new Error("Failed to fetch requests");
      return response.json();
    }
  });

  const { data: availableRooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms/available"]
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, assignedRoomId }: { id: string; status: string; assignedRoomId?: string }) => {
      const response = await apiRequest("PATCH", `/api/self-checkin-requests/${id}`, { status, assignedRoomId });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/self-checkin-requests"] });
      toast({
        title: variables.status === "approved" ? "Request Approved" : "Request Rejected",
        description: variables.status === "approved" 
          ? "The guest's check-in request has been approved." 
          : "The check-in request has been rejected."
      });
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setSelectedRoomId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive"
      });
    }
  });

  const convertRequestMutation = useMutation({
    mutationFn: async ({ id, roomId }: { id: string; roomId: string }) => {
      const response = await apiRequest("POST", `/api/self-checkin-requests/${id}/convert`, { roomId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/self-checkin-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/rooms"] });
      toast({
        title: "Check-in Created",
        description: "The guest has been checked in successfully."
      });
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setSelectedRoomId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create check-in",
        variant: "destructive"
      });
    }
  });

  const handleApprove = (request: SelfCheckInRequest) => {
    setSelectedRequest(request);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (request: SelfCheckInRequest) => {
    updateRequestMutation.mutate({ id: request.id, status: "rejected" });
  };

  const handleConvertToCheckIn = () => {
    if (!selectedRequest || !selectedRoomId) {
      toast({
        title: "Error",
        description: "Please select a room to assign",
        variant: "destructive"
      });
      return;
    }
    convertRequestMutation.mutate({ 
      id: selectedRequest.id, 
      roomId: selectedRoomId 
    });
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pending Check-in Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="mb-6 border-purple-200 bg-purple-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-600" />
                Pending Check-in Requests
                <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">
                  {pendingRequests.length} new
                </Badge>
              </CardTitle>
              <CardDescription>
                Guests who submitted check-in requests via QR code
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div 
                key={request.id} 
                className="bg-white rounded-lg border border-gray-200 p-4"
                data-testid={`pending-request-${request.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{request.fullName}</span>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(request.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="h-3 w-3" />
                        {request.phone}
                      </div>
                      {request.email && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="h-3 w-3" />
                          {request.email}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-3 w-3" />
                        {request.numberOfGuests} guest{request.numberOfGuests > 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(request.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {request.checkOutDate && (
                          <> - {new Date(request.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>
                        )}
                      </div>
                    </div>
                    
                    {(request.preferredRoomType || request.specialRequests) && (
                      <div className="mt-2 text-sm">
                        {request.preferredRoomType && (
                          <Badge variant="outline" className="mr-2">
                            <BedDouble className="h-3 w-3 mr-1" />
                            {request.preferredRoomType}
                          </Badge>
                        )}
                        {request.specialRequests && (
                          <span className="text-gray-500 italic">"{request.specialRequests}"</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(request)}
                      disabled={updateRequestMutation.isPending}
                      data-testid={`reject-request-${request.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request)}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid={`approve-request-${request.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve Check-in Request</DialogTitle>
            <DialogDescription>
              Select a room to assign to {selectedRequest?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Guest:</span>
                    <p className="font-medium">{selectedRequest.fullName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium">{selectedRequest.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Guests:</span>
                    <p className="font-medium">
                      {selectedRequest.numberOfGuests} ({selectedRequest.numberOfMales}M, {selectedRequest.numberOfFemales}F, {selectedRequest.numberOfChildren}C)
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Check-in Date:</span>
                    <p className="font-medium">
                      {new Date(selectedRequest.checkInDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  {selectedRequest.comingFrom && (
                    <div>
                      <span className="text-gray-500">Coming From:</span>
                      <p className="font-medium">{selectedRequest.comingFrom}</p>
                    </div>
                  )}
                  {selectedRequest.nationality && (
                    <div>
                      <span className="text-gray-500">Nationality:</span>
                      <p className="font-medium">{selectedRequest.nationality}</p>
                    </div>
                  )}
                  {selectedRequest.documentType && (
                    <div>
                      <span className="text-gray-500">Document:</span>
                      <p className="font-medium capitalize">{selectedRequest.documentType.replace('_', ' ')}</p>
                    </div>
                  )}
                  {selectedRequest.purposeOfVisit && (
                    <div>
                      <span className="text-gray-500">Purpose:</span>
                      <p className="font-medium capitalize">{selectedRequest.purposeOfVisit}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.documentImage && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Uploaded Document
                  </p>
                  {selectedRequest.documentImage.startsWith('data:image') ? (
                    <img 
                      src={selectedRequest.documentImage} 
                      alt="ID Document" 
                      className="max-w-full h-auto rounded border max-h-48 object-contain"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <FileText className="h-5 w-5" />
                      <a href={selectedRequest.documentImage} target="_blank" rel="noopener noreferrer" className="underline">
                        View PDF Document
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium mb-2 block">Select Room *</label>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger data-testid="select-room-for-checkin">
                    <SelectValue placeholder="Choose a room to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.length === 0 ? (
                      <SelectItem value="none" disabled>No rooms available</SelectItem>
                    ) : (
                      availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          Room {room.number} - {room.type} (₹{room.basePrice}/night)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvertToCheckIn}
              disabled={!selectedRoomId || convertRequestMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-approve-and-checkin"
            >
              {convertRequestMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve & Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
