import { cn } from "@/lib/utils";

interface MonthCalendarProps {
  year: number;
  month: number; // 0-based (0 = January)
  closedDates: {[roomTypeId: string]: {[dateKey: string]: boolean}};
  selectedRoomType: string;
  onDateClick?: (date: Date) => void;
}

export const MonthCalendar = ({ 
  year, 
  month, 
  closedDates, 
  selectedRoomType,
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

  const isDateClosed = (date: Date) => {
    const dateKey = getDateKey(date);
    return closedDates[selectedRoomType]?.[dateKey] || false;
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
    <div className="bg-white border border-border rounded-lg p-2">
      {/* Month Header */}
      <h3 className="text-sm font-semibold text-primary mb-2 text-center">
        {monthNames[month]} {year}
      </h3>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-px">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-px">
            {week.map((date, dayIndex) => (
              <div
                key={dayIndex}
                className={cn(
                  "w-6 h-6 flex items-center justify-center text-[10px] border border-transparent cursor-pointer hover:border-border transition-colors",
                  date && "hover:bg-muted/50",
                  date && isToday(date) && "bg-accent text-accent-foreground font-semibold",
                  date && isDateClosed(date) && "bg-red-100 text-red-800",
                  !date && "cursor-default"
                )}
                onClick={() => date && onDateClick?.(date)}
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