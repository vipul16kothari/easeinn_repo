import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [guestRegisterDateFrom, setGuestRegisterDateFrom] = useState("");
  const [guestRegisterDateTo, setGuestRegisterDateTo] = useState("");
  const [occupancyPeriod, setOccupancyPeriod] = useState("this-month");
  const [revenuePeriod, setRevenuePeriod] = useState("this-week");
  
  const { toast } = useToast();

  const handleExportReport = (reportType: string, format: string) => {
    // Placeholder for report generation logic
    toast({
      title: "Report Generated",
      description: `${reportType} report in ${format} format is being prepared`,
    });
  };

  const recentReports = [
    {
      name: "Guest Register - January 2024",
      type: "pdf",
      date: "Jan 15, 2024",
      icon: "fas fa-file-pdf",
      color: "text-red-500",
    },
    {
      name: "Occupancy Report - December 2023",
      type: "csv",
      date: "Jan 1, 2024",
      icon: "fas fa-file-csv",
      color: "text-green-500",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="reports-container">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900" data-testid="reports-title">
            Reports & Analytics
          </h2>
          <p className="text-sm text-gray-600 mt-1">Generate and export hotel management reports</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Guest Register Report */}
            <Card className="hover:shadow-md transition-shadow" data-testid="card-guest-register">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-users text-blue-600"></i>
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
                      <i className="fas fa-file-pdf mr-2"></i>PDF
                    </Button>
                    <Button
                      onClick={() => handleExportReport("Guest Register", "CSV")}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                      data-testid="button-export-guest-register-csv"
                    >
                      <i className="fas fa-file-csv mr-2"></i>CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Occupancy Report */}
            <Card className="hover:shadow-md transition-shadow" data-testid="card-occupancy">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-chart-bar text-green-600"></i>
                  </div>
                  Occupancy Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Room occupancy rates and availability statistics
                </p>
                <div className="space-y-3">
                  <Select value={occupancyPeriod} onValueChange={setOccupancyPeriod} data-testid="select-occupancy-period">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleExportReport("Occupancy", "PDF")}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                      data-testid="button-export-occupancy-pdf"
                    >
                      <i className="fas fa-file-pdf mr-2"></i>PDF
                    </Button>
                    <Button
                      onClick={() => handleExportReport("Occupancy", "View")}
                      className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                      data-testid="button-view-occupancy"
                    >
                      <i className="fas fa-eye mr-2"></i>View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Report */}
            <Card className="hover:shadow-md transition-shadow" data-testid="card-revenue">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-dollar-sign text-yellow-600"></i>
                  </div>
                  Revenue Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Revenue breakdown by room type and period
                </p>
                <div className="space-y-3">
                  <Select value={revenuePeriod} onValueChange={setRevenuePeriod} data-testid="select-revenue-period">
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
                      <i className="fas fa-file-pdf mr-2"></i>PDF
                    </Button>
                    <Button
                      onClick={() => handleExportReport("Revenue", "Excel")}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                      data-testid="button-export-revenue-excel"
                    >
                      <i className="fas fa-file-excel mr-2"></i>Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4" data-testid="recent-reports-title">
              Recent Reports
            </h3>
            <div className="bg-gray-50 rounded-lg p-4" data-testid="recent-reports-container">
              <div className="space-y-3">
                {recentReports.map((report, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded border"
                    data-testid={`recent-report-${index}`}
                  >
                    <div className="flex items-center">
                      <i className={`${report.icon} ${report.color} mr-3`}></i>
                      <div>
                        <div className="font-medium text-gray-900" data-testid={`recent-report-name-${index}`}>
                          {report.name}
                        </div>
                        <div className="text-sm text-gray-500" data-testid={`recent-report-date-${index}`}>
                          Generated on {report.date}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-600 hover:text-primary-800"
                      data-testid={`button-download-recent-${index}`}
                    >
                      <i className="fas fa-download"></i>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
