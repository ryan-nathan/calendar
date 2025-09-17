import { cn } from "@/lib/utils";

interface MonthCalendarProps {
  year: number;
  month: number; // 0-based (0 = January)
  closedDates: {[roomTypeId: string]: {[dateKey: string]: boolean}};
  selectedRoomType: string;
  roomTypes: Array<{
    id: string;
    name: string;
    data: {
      status: string;
      roomsToSell: number[];
      netBooked: number[];
      rates: number[];
    };
  }>;
  baseDataDate: Date;
  onDateClick?: (date: Date) => void;
  onMouseDown?: (month: number, year: number, day: number) => void;
  onMouseMove?: (month: number, year: number, day: number) => void;
  onMouseUp?: () => void;
  isInDragRange?: (month: number, year: number, day: number) => boolean;
  isDragging?: boolean;
}

export const MonthCalendar = ({ 
  year, 
  month, 
  closedDates, 
  selectedRoomType,
  roomTypes,
  baseDataDate,
  onDateClick,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  isInDragRange,
  isDragging
}: MonthCalendarProps) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDataIndexForDate = (date: Date): number => {
    const daysDiff = Math.floor((date.getTime() - baseDataDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(30, daysDiff)); // Clamp to valid array indices
  };

  const isDateClosed = (date: Date) => {
    const dateKey = getDateKey(date);
    return closedDates?.[selectedRoomType]?.[dateKey] || false;
  };

  const getDateAvailabilityStatus = (date: Date) => {
    if (isDateClosed(date)) return 'closed';
    
    // Add null check for roomTypes
    if (!roomTypes || !Array.isArray(roomTypes)) {
      return 'available';
    }
    
    // Check specific room type (yearly view always shows individual room types)
    const roomType = roomTypes.find(rt => rt.id === selectedRoomType);
    if (!roomType) return 'available';
    
    const dataIndex = getDataIndexForDate(date);
    const roomsToSell = roomType.data.roomsToSell[dataIndex] || 0;
    const netBooked = roomType.data.netBooked[dataIndex] || 0;
    const available = roomsToSell - netBooked;
    
    if (available > 0) return 'bookable';
    if (available <= 0) return 'sold-out';
    
    return 'available';
  };

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Generate calendar grid
  const weeks = [];
  let currentWeek = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    currentWeek.push(date);

    // If week is complete or it's the last day, add week to weeks array
    if (currentWeek.length === 7 || day === daysInMonth) {
      // Fill remaining cells in last week
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-lg p-2">
      {/* Month Header */}
      <h3 className="text-sm font-semibold mb-2 text-left">
        {monthNames[month]} {year}
      </h3>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-0 mb-0">
        {dayNames.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1 bg-muted/30 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-0">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-0">
            {week.map((date, dayIndex) => (
              <div
                key={dayIndex}
                className={cn(
                  "h-6 flex items-center justify-center text-[10px] cursor-pointer hover:bg-muted/50 transition-colors",
                  date && isToday(date) && "bg-accent text-accent-foreground font-bold",
                  date && getDateAvailabilityStatus(date) === 'closed' && "bg-red-200 text-red-900",
                  date && getDateAvailabilityStatus(date) === 'bookable' && "bg-green-200 text-green-900",
                  date && getDateAvailabilityStatus(date) === 'sold-out' && "bg-red-200 text-red-900",
                  date && isInDragRange && isInDragRange(month, year, date.getDate()) && "bg-blue-200",
                  !date && "cursor-default bg-muted/10"
                )}
                onMouseDown={() => date && onMouseDown && onMouseDown(month, year, date.getDate())}
                onMouseMove={() => date && onMouseMove && onMouseMove(month, year, date.getDate())}
                onMouseUp={() => onMouseUp && onMouseUp()}
                onMouseEnter={() => date && onMouseMove && onMouseMove(month, year, date.getDate())}
                onClick={() => {
                  if (date && onDateClick && !isDragging) {
                    console.log('MonthCalendar: Date clicked', date);
                    onDateClick(date);
                  }
                }}
              >
                {date ? date.getDate() : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};