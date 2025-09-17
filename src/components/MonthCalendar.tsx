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
}

export const MonthCalendar = ({ 
  year, 
  month, 
  closedDates, 
  selectedRoomType,
  roomTypes,
  baseDataDate,
  onDateClick 
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
    
    // If "all-rooms" is selected, check availability across all room types
    if (selectedRoomType === 'all-rooms') {
      let hasBookable = false;
      let hasSoldOut = false;
      
      roomTypes.forEach(roomType => {
        const dataIndex = getDataIndexForDate(date);
        const roomsToSell = roomType.data.roomsToSell[dataIndex] || 0;
        const netBooked = roomType.data.netBooked[dataIndex] || 0;
        const available = roomsToSell - netBooked;
        
        if (available > 0) hasBookable = true;
        if (available <= 0) hasSoldOut = true;
      });
      
      if (hasBookable && !hasSoldOut) return 'bookable';
      if (hasSoldOut && !hasBookable) return 'sold-out';
      return 'mixed'; // Some rooms available, some sold out
    } else {
      // Check specific room type
      const roomType = roomTypes.find(rt => rt.id === selectedRoomType);
      if (!roomType) return 'available';
      
      const dataIndex = getDataIndexForDate(date);
      const roomsToSell = roomType.data.roomsToSell[dataIndex] || 0;
      const netBooked = roomType.data.netBooked[dataIndex] || 0;
      const available = roomsToSell - netBooked;
      
      if (available > 0) return 'bookable';
      if (available <= 0) return 'sold-out';
    }
    
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
    <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Month Header */}
      <h3 className="text-sm font-bold text-primary mb-3 text-center bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        {monthNames[month]} {year}
      </h3>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-0 mb-1 overflow-hidden rounded-md">
        {dayNames.map((day, index) => (
          <div key={day} className={cn(
            "text-center text-[10px] font-semibold text-muted-foreground py-1.5 bg-gradient-to-b from-muted/60 to-muted/40 border-r border-border/30",
            index === 6 && "border-r-0"
          )}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden rounded-md border border-border/30">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-0">
            {week.map((date, dayIndex) => (
              <div
                key={dayIndex}
                className={cn(
                  "h-7 flex items-center justify-center text-[11px] font-medium border-r border-b border-border/20 cursor-pointer transition-all duration-150 relative group/cell",
                  date && "hover:bg-primary/10 hover:scale-110 hover:z-10 hover:shadow-sm hover:font-bold",
                  date && isToday(date) && "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground font-bold shadow-sm ring-1 ring-accent/30",
                  date && getDateAvailabilityStatus(date) === 'closed' && "bg-gradient-to-br from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300",
                  date && getDateAvailabilityStatus(date) === 'bookable' && "bg-gradient-to-br from-green-50 to-green-100 text-green-800 hover:from-green-100 hover:to-green-200",
                  date && getDateAvailabilityStatus(date) === 'sold-out' && "bg-gradient-to-br from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300",
                  date && getDateAvailabilityStatus(date) === 'mixed' && "bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-800 hover:from-yellow-100 hover:to-yellow-200",
                  !date && "cursor-default bg-muted/10",
                  dayIndex === 6 && "border-r-0",
                  weekIndex === weeks.length - 1 && "border-b-0"
                )}
                onClick={() => date && onDateClick?.(date)}
              >
                {date ? date.getDate() : ''}
                {date && isToday(date) && (
                  <div className="absolute inset-0 rounded-sm ring-2 ring-accent/40 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};