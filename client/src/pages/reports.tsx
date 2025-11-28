import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileText, Download, TrendingUp, Users, Building2, IndianRupee, Calendar, Loader2 } from "lucide-react";

interface AnalyticsData {
  occupancy: {
    total: number;
    occupied: number;
    available: number;
    maintenance: number;
    cleaning: number;
    rate: number;
  };
  revenue: {
    today: string;
    monthly: string;
    yearly: string;
    trend: Array<{ date: string; revenue: number }>;
  };
  roomTypes: Record<string, { count: number; occupied: number; revenue: number }>;
  bookings: {
    total: number;
    byStatus: {
      confirmed: number;
      pending: number;
      checked_in: number;
      completed: number;
      cancelled: number;
    };
    activeCheckIns: number;
  };
  gst: {
    totalBillings: number;
    totalAmount: number;
    cgstCollected: number;
    sgstCollected: number;
  };
}

interface OccupancyReport {
  summary: {
    totalRooms: number;
    averageOccupancy: number;
    peakOccupancy: number;
    lowestOccupancy: number;
  };
  dailyData: Array<{ date: string; occupied: number; available: number; rate: number }>;
  roomTypeBreakdown: Record<string, { total: number; occupied: number; rate: number }>;
}

interface RevenueReport {
  summary: {
    totalRevenue: string;
    avgDailyRevenue: string;
    totalBookings: number;
    peakRevenue: string;
  };
  dailyData: Array<{ date: string; revenue: number }>;
  paymentBreakdown: Record<string, number>;
  gst: {
    grossRevenue: number;
    cgst: number;
    sgst: number;
    netRevenue: number;
  };
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function Reports() {
  const [guestRegisterDateFrom, setGuestRegisterDateFrom] = useState("");
  const [guestRegisterDateTo, setGuestRegisterDateTo] = useState("");
  const [occupancyPeriod, setOccupancyPeriod] = useState("this-month");
  const [revenuePeriod, setRevenuePeriod] = useState("this-week");
  const [activeTab, setActiveTab] = useState("overview");
  
  const { toast } = useToast();

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/reports/analytics'],
  });

  const { data: occupancyReport, isLoading: occupancyLoading } = useQuery<OccupancyReport>({
    queryKey: ['/api/reports/occupancy', occupancyPeriod],
  });

  const { data: revenueReport, isLoading: revenueLoading } = useQuery<RevenueReport>({
    queryKey: ['/api/reports/revenue', revenuePeriod],
  });

  const handleExportReport = (reportType: string, format: string) => {
    const queryParams = new URLSearchParams();
    
    if (reportType === "Guest Register") {
      if (guestRegisterDateFrom) queryParams.set("from", guestRegisterDateFrom);
      if (guestRegisterDateTo) queryParams.set("to", guestRegisterDateTo);
    } else if (reportType === "Occupancy") {
      queryParams.set("period", occupancyPeriod);
    } else if (reportType === "Revenue") {
      queryParams.set("period", revenuePeriod);
    }

    toast({
      title: "Report Generated",
      description: `${reportType} report in ${format} format is being prepared`,
    });
  };

  const roomTypeData = analytics?.roomTypes 
    ? Object.entries(analytics.roomTypes).map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: data.count,
        occupied: data.occupied
      }))
    : [];

  const bookingStatusData = analytics?.bookings?.byStatus
    ? Object.entries(analytics.bookings.byStatus).map(([name, value]) => ({
        name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
        value
      }))
    : [];

  const paymentData = revenueReport?.paymentBreakdown
    ? Object.entries(revenueReport.paymentBreakdown)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name: name.toUpperCase(),
          value
        }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="reports-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="reports-title">
          Reports & Analytics
        </h1>
        <p className="text-gray-600 mt-1">Monitor your hotel performance and generate detailed reports</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="occupancy" data-testid="tab-occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
          <TabsTrigger value="export" data-testid="tab-export">Export Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card data-testid="card-occupancy-rate">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Occupancy Rate</p>
                        <p className="text-3xl font-bold text-purple-600">{analytics.occupancy.rate}%</p>
                        <p className="text-xs text-gray-400">{analytics.occupancy.occupied}/{analytics.occupancy.total} rooms</p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-today-revenue">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Today's Revenue</p>
                        <p className="text-3xl font-bold text-green-600">₹{analytics.revenue.today}</p>
                        <p className="text-xs text-gray-400">From check-ins</p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <IndianRupee className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-monthly-revenue">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Monthly Revenue</p>
                        <p className="text-3xl font-bold text-blue-600">₹{analytics.revenue.monthly}</p>
                        <p className="text-xs text-gray-400">This month</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-active-checkins">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Active Check-ins</p>
                        <p className="text-3xl font-bold text-amber-600">{analytics.bookings.activeCheckIns}</p>
                        <p className="text-xs text-gray-400">Currently staying</p>
                      </div>
                      <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-revenue-trend">
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue Trend (7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.revenue.trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                        <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card data-testid="card-room-type-distribution">
                  <CardHeader>
                    <CardTitle className="text-lg">Room Type Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={roomTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8b5cf6" name="Total" />
                        <Bar dataKey="occupied" fill="#06b6d4" name="Occupied" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-booking-status">
                  <CardHeader>
                    <CardTitle className="text-lg">Booking Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={bookingStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {bookingStatusData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card data-testid="card-gst-summary">
                  <CardHeader>
                    <CardTitle className="text-lg">GST Summary (This Month)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Total Billings</span>
                        <span className="font-semibold">{analytics.gst.totalBillings}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Gross Amount</span>
                        <span className="font-semibold">₹{analytics.gst.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-700">CGST Collected (6%)</span>
                        <span className="font-semibold text-blue-700">₹{analytics.gst.cgstCollected.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-green-700">SGST Collected (6%)</span>
                        <span className="font-semibold text-green-700">₹{analytics.gst.sgstCollected.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No analytics data available. Start by checking in guests to see reports.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Occupancy Analysis</h2>
            <Select value={occupancyPeriod} onValueChange={setOccupancyPeriod} data-testid="select-occupancy-period-tab">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {occupancyLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : occupancyReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500">Total Rooms</p>
                    <p className="text-3xl font-bold text-purple-600">{occupancyReport.summary.totalRooms}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500">Avg Occupancy</p>
                    <p className="text-3xl font-bold text-green-600">{occupancyReport.summary.averageOccupancy}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500">Peak Occupancy</p>
                    <p className="text-3xl font-bold text-blue-600">{occupancyReport.summary.peakOccupancy}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500">Lowest Occupancy</p>
                    <p className="text-3xl font-bold text-amber-600">{occupancyReport.summary.lowestOccupancy}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-daily-occupancy">
                <CardHeader>
                  <CardTitle>Daily Occupancy Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={occupancyReport.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={10} angle={-45} textAnchor="end" height={60} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(value, name) => [name === 'rate' ? `${value}%` : value, name === 'rate' ? 'Occupancy Rate' : name]} />
                      <Legend />
                      <Bar dataKey="occupied" fill="#8b5cf6" name="Occupied" />
                      <Bar dataKey="available" fill="#e5e7eb" name="Available" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card data-testid="card-room-type-occupancy">
                <CardHeader>
                  <CardTitle>Room Type Occupancy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(occupancyReport.roomTypeBreakdown).map(([type, data]) => (
                      <div key={type} className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold capitalize">{type}</h3>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>Total: {data.total} rooms</p>
                          <p>Occupied: {data.occupied} rooms</p>
                          <p className="text-purple-600 font-medium">Rate: {data.rate}%</p>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full" 
                            style={{ width: `${data.rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No occupancy data available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Revenue Analysis</h2>
            <Select value={revenuePeriod} onValueChange={setRevenuePeriod} data-testid="select-revenue-period-tab">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {revenueLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : revenueReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">₹{revenueReport.summary.totalRevenue}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500">Avg Daily Revenue</p>
                    <p className="text-2xl font-bold text-green-600">₹{revenueReport.summary.avgDailyRevenue}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500">Peak Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">₹{revenueReport.summary.peakRevenue}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold text-amber-600">{revenueReport.summary.totalBookings}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-daily-revenue">
                  <CardHeader>
                    <CardTitle>Daily Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={revenueReport.dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={10} angle={-45} textAnchor="end" height={60} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card data-testid="card-payment-methods">
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paymentData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ₹${value.toFixed(0)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {paymentData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-gray-500">
                        No payment data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-gst-breakdown">
                <CardHeader>
                  <CardTitle>GST Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-500">Gross Revenue</p>
                      <p className="text-xl font-bold">₹{revenueReport.gst.grossRevenue.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-blue-600">CGST (6%)</p>
                      <p className="text-xl font-bold text-blue-700">₹{revenueReport.gst.cgst.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-sm text-green-600">SGST (6%)</p>
                      <p className="text-xl font-bold text-green-700">₹{revenueReport.gst.sgst.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm text-purple-600">Net Revenue</p>
                      <p className="text-xl font-bold text-purple-700">₹{revenueReport.gst.netRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No revenue data available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow" data-testid="card-export-guest-register">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  Guest Register
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Complete list of all guest check-ins with detailed information
                </p>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={guestRegisterDateFrom}
                      onChange={(e) => setGuestRegisterDateFrom(e.target.value)}
                      className="flex-1"
                      data-testid="input-guest-register-date-from"
                    />
                    <Input
                      type="date"
                      value={guestRegisterDateTo}
                      onChange={(e) => setGuestRegisterDateTo(e.target.value)}
                      className="flex-1"
                      data-testid="input-guest-register-date-to"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleExportReport("Guest Register", "PDF")}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                      data-testid="button-export-guest-register-pdf"
                    >
                      <FileText className="h-4 w-4 mr-2" />PDF
                    </Button>
                    <Button
                      onClick={() => handleExportReport("Guest Register", "CSV")}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                      data-testid="button-export-guest-register-csv"
                    >
                      <Download className="h-4 w-4 mr-2" />CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-export-occupancy">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Building2 className="h-5 w-5 text-green-600" />
                  </div>
                  Occupancy Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Room occupancy rates and availability statistics
                </p>
                <div className="space-y-3">
                  <Select value={occupancyPeriod} onValueChange={setOccupancyPeriod} data-testid="select-export-occupancy-period">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleExportReport("Occupancy", "PDF")}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                      data-testid="button-export-occupancy-pdf"
                    >
                      <FileText className="h-4 w-4 mr-2" />PDF
                    </Button>
                    <Button
                      onClick={() => handleExportReport("Occupancy", "Excel")}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                      data-testid="button-export-occupancy-excel"
                    >
                      <Download className="h-4 w-4 mr-2" />Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-export-revenue">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <IndianRupee className="h-5 w-5 text-yellow-600" />
                  </div>
                  Revenue Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Revenue breakdown with GST details
                </p>
                <div className="space-y-3">
                  <Select value={revenuePeriod} onValueChange={setRevenuePeriod} data-testid="select-export-revenue-period">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleExportReport("Revenue", "PDF")}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                      data-testid="button-export-revenue-pdf"
                    >
                      <FileText className="h-4 w-4 mr-2" />PDF
                    </Button>
                    <Button
                      onClick={() => handleExportReport("Revenue", "Excel")}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                      data-testid="button-export-revenue-excel"
                    >
                      <Download className="h-4 w-4 mr-2" />Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-gst-report">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                GST Return Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Generate GST-compliant reports for filing returns. Includes CGST, SGST breakdowns as per Indian tax regulations.
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleExportReport("GST Return", "PDF")}
                  className="bg-purple-600 text-white hover:bg-purple-700"
                  data-testid="button-export-gst-pdf"
                >
                  <FileText className="h-4 w-4 mr-2" />Generate GST Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
