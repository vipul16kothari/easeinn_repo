import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", id: "dashboard" },
    { href: "/check-in", label: "Check-in", id: "checkin" },
    { href: "/guests", label: "Guests", id: "guests" },
    { href: "/reports", label: "Reports", id: "reports" },
  ];

  const isActive = (href: string) => {
    return location === href || (href === "/dashboard" && location === "/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" data-testid="logo-link">
                <h1 className="text-xl font-bold text-primary-700">
                  <i className="fas fa-hotel mr-2"></i>HotelFlow
                </h1>
              </Link>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-3 py-2 rounded-md font-medium transition-colors ${
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
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900" data-testid="user-name">
                Sarah Johnson
              </div>
              <div className="text-xs text-gray-500" data-testid="user-role">
                Front Desk Staff
              </div>
            </div>
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center" data-testid="user-avatar">
              <span className="text-white text-sm font-medium">SJ</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
