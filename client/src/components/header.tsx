import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [location] = useLocation();
  const { user, hotel } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", id: "dashboard" },
    { href: "/check-in", label: "Check-in", id: "checkin" },
    { href: "/checkout", label: "Checkout", id: "checkout" },
    { href: "/guests", label: "Guests", id: "guests" },
    { href: "/rooms", label: "Rooms", id: "rooms" },
    { href: "/bookings", label: "Bookings", id: "bookings" },
    { href: "/calendar", label: "Calendar", id: "calendar" },
    { href: "/payments", label: "Payments", id: "payments" },
    { href: "/reports", label: "Reports", id: "reports" },
  ];

  const isActive = (href: string) => {
    return location === href || (href === "/dashboard" && location === "/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">
              <Link href="/" data-testid="logo-link">
                <h1 className="text-xl font-bold text-primary-700">
                  <i className="fas fa-hotel mr-2"></i>
                  {hotel?.name || 'EaseInn'}
                </h1>
              </Link>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-6 overflow-hidden">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-3 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                    isActive(item.href)
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-3 relative z-50 min-w-0 flex-shrink">
            <div className="text-right min-w-0 max-w-[160px] hidden sm:block">
              <div className="text-sm font-medium text-gray-900 truncate" data-testid="user-name">
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'User'}
              </div>
              <div className="text-xs text-gray-500 truncate" data-testid="user-role">
                {user?.role === 'hotelier' ? 'Hotel Manager' : 'Staff'}
              </div>
            </div>
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0" data-testid="user-avatar">
              <span className="text-white text-sm font-medium">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName[0]}${user.lastName[0]}` 
                  : user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
