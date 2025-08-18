interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: "success" | "red" | "warning" | "purple";
}

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const colorClasses = {
    success: "bg-success-100 text-success-600",
    red: "bg-red-100 text-red-600",
    warning: "bg-warning-100 text-warning-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-testid={`stats-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <i className={`${icon}`}></i>
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600" data-testid={`stats-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900" data-testid={`stats-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
