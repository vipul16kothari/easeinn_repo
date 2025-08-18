import { Room } from "@shared/schema";

interface RoomCardProps {
  room: Room;
  onClick?: (room: Room) => void;
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const statusConfig = {
    available: {
      bgColor: "bg-success-50",
      borderColor: "border-success-200",
      textColor: "text-success-800",
      statusTextColor: "text-success-600",
      statusBg: "bg-success-100",
      statusText: "Available",
    },
    occupied: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      statusTextColor: "text-red-600",
      statusBg: "bg-red-100",
      statusText: "Occupied",
    },
    cleaning: {
      bgColor: "bg-warning-50",
      borderColor: "border-warning-200",
      textColor: "text-warning-800",
      statusTextColor: "text-warning-600",
      statusBg: "bg-warning-100",
      statusText: "Cleaning",
    },
    maintenance: {
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-800",
      statusTextColor: "text-purple-600",
      statusBg: "bg-purple-100",
      statusText: "Maintenance",
    },
  };

  const config = statusConfig[room.status];

  return (
    <div
      className={`room-card ${config.bgColor} border-2 ${config.borderColor} rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
      onClick={() => onClick?.(room)}
      data-testid={`room-card-${room.number}`}
    >
      <div className="text-center">
        <div className={`text-lg font-bold ${config.textColor} mb-1`} data-testid={`room-number-${room.number}`}>
          {room.number}
        </div>
        <div className={`text-xs ${config.statusTextColor} mb-2 capitalize`} data-testid={`room-type-${room.number}`}>
          {room.type}
        </div>
        <span
          className={`${config.statusBg} ${config.statusTextColor} px-2 py-1 rounded-full text-xs font-medium`}
          data-testid={`room-status-${room.number}`}
        >
          {config.statusText}
        </span>
      </div>
    </div>
  );
}
