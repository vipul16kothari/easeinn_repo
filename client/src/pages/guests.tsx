import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Guest, Room } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface GuestWithRoom extends Guest {
  room?: Room;
  checkInDate?: Date;
}

export default function Guests() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const { toast } = useToast();

  const { data: guestsData, isLoading } = useQuery<{ guests: GuestWithRoom[]; total: number }>({
    queryKey: ["/api/guests", { search, limit: 50, offset: 0 }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("limit", "50");
      params.append("offset", "0");
      
      const response = await fetch(`/api/guests?${params}`);
      if (!response.ok) throw new Error("Failed to fetch guests");
      return response.json();
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const response = await apiRequest("POST", `/api/checkins/checkout/${guestId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/rooms"] });
      toast({
        title: "Success",
        description: "Guest checked out successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check out guest",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = (guestId: string) => {
    if (window.confirm("Are you sure you want to check out this guest?")) {
      checkoutMutation.mutate(guestId);
    }
  };

  const getGuestInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (hasRoom: boolean) => {
    if (hasRoom) {
      return <Badge className="bg-green-100 text-green-800">Checked In</Badge>;
    }
    return <Badge variant="secondary">Checked Out</Badge>;
  };

  const filteredGuests = guestsData?.guests.filter((guest) => {
    if (filter === "checkedin") return guest.room;
    if (filter === "checkedout") return !guest.room;
    if (filter === "vip") return false; // VIP logic can be added later
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="guests-container">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900" data-testid="guests-title">
                Guest Records
              </h2>
              <p className="text-sm text-gray-600 mt-1">Search and manage guest information</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Link href="/check-in">
                <Button className="bg-primary-600 text-white hover:bg-primary-700" data-testid="button-new-checkin">
                  <i className="fas fa-plus mr-2"></i>New Check-in
                </Button>
              </Link>
              <Button variant="outline" data-testid="button-export">
                <i className="fas fa-download mr-2"></i>Export
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search by name, phone, or room number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-guests"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter} data-testid="select-guest-filter">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Guests</SelectItem>
                <SelectItem value="checkedin">Checked In</SelectItem>
                <SelectItem value="checkedout">Checked Out</SelectItem>
                <SelectItem value="vip">VIP Guests</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[160px]"
              data-testid="input-date-filter"
            />
          </div>
        </div>

        {/* Guest Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" data-testid="guests-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50" data-testid={`guest-row-${guest.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-800" data-testid={`guest-initials-${guest.id}`}>
                            {getGuestInitials(guest.fullName)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900" data-testid={`guest-name-${guest.id}`}>
                          {guest.fullName}
                        </div>
                        <div className="text-sm text-gray-500" data-testid={`guest-nationality-${guest.id}`}>
                          {guest.nationality}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900" data-testid={`guest-phone-${guest.id}`}>
                      {guest.phone}
                    </div>
                    <div className="text-sm text-gray-500" data-testid={`guest-coming-from-${guest.id}`}>
                      From: {guest.comingFrom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {guest.room ? (
                      <Badge className="bg-blue-100 text-blue-800" data-testid={`guest-room-${guest.id}`}>
                        {guest.room.number}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`guest-checkin-date-${guest.id}`}>
                    {guest.checkInDate 
                      ? new Date(guest.checkInDate).toLocaleDateString()
                      : new Date(guest.createdAt!).toLocaleDateString()
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`guest-status-${guest.id}`}>
                    {getStatusBadge(!!guest.room)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-primary-600 hover:text-primary-900"
                        data-testid={`button-view-guest-${guest.id}`}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        data-testid={`button-edit-guest-${guest.id}`}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {guest.room && (
                        <button
                          className="text-red-400 hover:text-red-600"
                          onClick={() => handleCheckout(guest.id)}
                          disabled={checkoutMutation.isPending}
                          data-testid={`button-checkout-guest-${guest.id}`}
                        >
                          <i className="fas fa-sign-out-alt"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredGuests.length === 0 && (
            <div className="text-center py-8" data-testid="no-guests-message">
              <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
              <p className="text-gray-500">No guests found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button variant="outline" disabled>Previous</Button>
            <Button variant="outline" disabled>Next</Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700" data-testid="pagination-info">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{filteredGuests.length}</span> of{" "}
                <span className="font-medium">{guestsData?.total || 0}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button variant="outline" size="sm" disabled data-testid="button-prev-page">
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <Button variant="outline" size="sm" className="bg-primary-50 border-primary-500 text-primary-600" data-testid="button-page-1">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled data-testid="button-next-page">
                  <i className="fas fa-chevron-right"></i>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
