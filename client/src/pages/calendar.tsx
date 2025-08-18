import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, Users, Bed } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import type { Room, CheckIn, Guest } from "@shared/schema";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewRange, setViewRange] = useState(7); // 7 days by default

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const { data: activeCheckIns = [] } = useQuery<(CheckIn & { guest: Guest; room: Room })[]>({
    queryKey: ["/api/checkins/active"],
  });

  // Generate date range
  const dateRange = useMemo(() => {
    const dates = [];
    for (let i = 0; i < viewRange; i++) {
      dates.push(addDays(selectedDate, i));
    }
    return dates;
  }, [selectedDate, viewRange]);

  // Create a map of room bookings by date
  const bookingsByRoomAndDate = useMemo(() => {
    const bookings: Record<string, Record<string, { guest: Guest; checkIn: CheckIn & { guest: Guest; room: Room } }>> = {};
    
    activeCheckIns.forEach((checkIn: CheckIn & { guest: Guest; room: Room }) => {
      const checkInDate = new Date(checkIn.checkInDate);
      const roomId = checkIn.room.id;
      
      if (!bookings[roomId]) {
        bookings[roomId] = {};
      }
      
      // For active check-ins, show them for today and future dates until checkout
      dateRange.forEach(date => {
        if (date >= checkInDate || isSameDay(date, checkInDate)) {
          const dateKey = format(date, 'yyyy-MM-dd');
          bookings[roomId][dateKey] = {
            guest: checkIn.guest,
            checkIn
          };
        }
      });
    });
    
    return bookings;
  }, [activeCheckIns, dateRange]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -viewRange : viewRange;
    setSelectedDate(prev => addDays(prev, days));
  };

  const getRoomStatusColor = (room: Room, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const booking = bookingsByRoomAndDate[room.id]?.[dateKey];
    
    if (booking) {
      return "bg-red-100 border-red-300 text-red-800"; // Occupied
    }
    
    switch (room.status) {
      case "available":
        return "bg-green-100 border-green-300 text-green-800";
      case "cleaning":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "maintenance":
        return "bg-orange-100 border-orange-300 text-orange-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getRoomStatusText = (room: Room, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const booking = bookingsByRoomAndDate[room.id]?.[dateKey];
    
    if (booking) {
      return booking.guest.fullName;
    }
    
    return room.status.charAt(0).toUpperCase() + room.status.slice(1);
  };

  const getTotalOccupied = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return rooms.filter((room: Room) => bookingsByRoomAndDate[room.id]?.[dateKey]).length;
  };

  const getTotalAvailable = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return rooms.filter((room: Room) => 
      !bookingsByRoomAndDate[room.id]?.[dateKey] && room.status === 'available'
    ).length;
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isPast = (date: Date) => date < new Date() && !isToday(date);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Calendar</h1>
          <p className="text-gray-600 mt-1">View room availability and bookings across dates</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select
            value={viewRange.toString()}
            onValueChange={(value) => setViewRange(parseInt(value))}
          >
            <SelectTrigger className="w-32" data-testid="select-view-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
              data-testid="button-prev-dates"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date())}
              data-testid="button-today"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
              data-testid="button-next-dates"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Bed className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Rooms</p>
                <p className="text-2xl font-bold">{rooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Available Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {getTotalAvailable(new Date())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-red-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Occupied Today</p>
                <p className="text-2xl font-bold text-red-600">
                  {getTotalOccupied(new Date())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Occupancy Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {rooms.length > 0 ? Math.round((getTotalOccupied(new Date()) / rooms.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Room Availability Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <div className="text-center py-8">
              <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No rooms available</h3>
              <p className="text-gray-600">Add rooms in the Room Management page to see the calendar view.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white z-10 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r">
                      Room
                    </th>
                    {dateRange.map((date) => (
                      <th
                        key={format(date, 'yyyy-MM-dd')}
                        className={`px-3 py-3 text-center text-sm font-semibold min-w-32 ${
                          isToday(date) ? 'text-blue-600 bg-blue-50' : 
                          isPast(date) ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{format(date, 'EEE')}</span>
                          <span className="text-xs">{format(date, 'MMM dd')}</span>
                          {isToday(date) && (
                            <Badge variant="secondary" className="text-xs mt-1">Today</Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rooms.map((room: Room) => (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 bg-white z-10 px-4 py-3 text-sm font-medium text-gray-900 border-r">
                        <div>
                          <div className="font-semibold">Room {room.number}</div>
                          <div className="text-xs text-gray-500 capitalize">{room.type}</div>
                        </div>
                      </td>
                      {dateRange.map((date) => {
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const booking = bookingsByRoomAndDate[room.id]?.[dateKey];
                        const cellClass = getRoomStatusColor(room, date);
                        const statusText = getRoomStatusText(room, date);
                        
                        return (
                          <td
                            key={dateKey}
                            className="px-3 py-3 text-center"
                            data-testid={`cell-${room.number}-${dateKey}`}
                          >
                            <div
                              className={`px-2 py-2 rounded-lg border text-xs font-medium min-h-12 flex items-center justify-center ${cellClass} ${
                                isPast(date) ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="text-center">
                                {booking ? (
                                  <>
                                    <div className="font-semibold truncate max-w-20">{statusText}</div>
                                    <div className="text-xs opacity-75">
                                      Check-in: {format(new Date(booking.checkIn.checkInDate), 'MMM dd')}
                                    </div>
                                  </>
                                ) : (
                                  <span>{statusText}</span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="text-sm font-semibold text-gray-900">Legend:</h3>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
              <span className="text-sm text-gray-600">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
              <span className="text-sm text-gray-600">Cleaning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
              <span className="text-sm text-gray-600">Maintenance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}