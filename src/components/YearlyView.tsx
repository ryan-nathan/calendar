import { useState } from "react";
import { MonthCalendar } from "./MonthCalendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface YearlyViewProps {
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
  closedDates: {[roomTypeId: string]: {[dateKey: string]: boolean}};
  selectedRoomTypeFilter: string;
  baseDataDate: Date;
  onDateClick?: (date: Date) => void;
  onToggleDateStatus?: (roomTypeId: string, date: Date) => void;
  onOpenBulkEdit?: (startDate: Date, endDate: Date, roomTypeId: string) => void;
}

export const YearlyView = ({ 
  roomTypes, 
  closedDates, 
  selectedRoomTypeFilter,
  baseDataDate,
  onDateClick,
  onToggleDateStatus,
  onOpenBulkEdit
}: YearlyViewProps) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dateFilter, setDateFilter] = useState("all-dates");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{month: number, year: number, day: number} | null>(null);
  const [dragEnd, setDragEnd] = useState<{month: number, year: number, day: number} | null>(null);

  const handlePreviousYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const toggleDateStatus = (roomTypeId: string, date: Date) => {
    if (onToggleDateStatus) {
      onToggleDateStatus(roomTypeId, date);
    }
  };

  const handleMouseDown = (month: number, year: number, day: number) => {
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    setIsDragging(true);
    setDragStart({ month, year, day });
    setDragEnd({ month, year, day });
  };

  const handleTouchStart = (month: number, year: number, day: number) => {
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    setIsDragging(true);
    setDragStart({ month, year, day });
    setDragEnd({ month, year, day });
  };

  const handleMouseMove = (month: number, year: number, day: number) => {
    if (isDragging && dragStart !== null) {
      setDragEnd({ month, year, day });
    }
  };

  const handleTouchMove = (e: React.TouchEvent, month: number, year: number, day: number) => {
    if (isDragging && dragStart !== null) {
      e.preventDefault(); // Prevent scrolling during drag
      setDragEnd({ month, year, day });
      
      // Handle touch move across different cells
      const touch = e.touches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elementBelow) {
        const cellElement = elementBelow.closest('[data-month-day]');
        if (cellElement) {
          const monthDay = cellElement.getAttribute('data-month-day');
          if (monthDay) {
            const [cellMonth, cellYear, cellDay] = monthDay.split('-').map(Number);
            setDragEnd({ month: cellMonth, year: cellYear, day: cellDay });
          }
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      // Convert drag coordinates to actual dates
      const startDate = new Date(dragStart.year, dragStart.month, dragStart.day);
      const endDate = new Date(dragEnd.year, dragEnd.month, dragEnd.day);
      
      // Ensure start is before end
      const actualStart = startDate <= endDate ? startDate : endDate;
      const actualEnd = startDate <= endDate ? endDate : startDate;
      
      // Both single click and drag selection open bulk edit sidebar
      if (onOpenBulkEdit) {
        onOpenBulkEdit(actualStart, actualEnd, selectedRoomTypeFilter);
      }
    }
    
    // Restore text selection and reset drag state
    document.body.style.userSelect = '';
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleTouchEnd = () => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      // Convert drag coordinates to actual dates
      const startDate = new Date(dragStart.year, dragStart.month, dragStart.day);
      const endDate = new Date(dragEnd.year, dragEnd.month, dragEnd.day);
      
      // Ensure start is before end
      const actualStart = startDate <= endDate ? startDate : endDate;
      const actualEnd = startDate <= endDate ? endDate : startDate;
      
      // Both single click and drag selection open bulk edit sidebar
      if (onOpenBulkEdit) {
        onOpenBulkEdit(actualStart, actualEnd, selectedRoomTypeFilter);
      }
    }
    
    // Restore text selection and reset drag state
    document.body.style.userSelect = '';
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const isInDragRange = (month: number, year: number, day: number) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    
    const currentDate = new Date(year, month, day).getTime();
    const startDate = new Date(dragStart.year, dragStart.month, dragStart.day).getTime();
    const endDate = new Date(dragEnd.year, dragEnd.month, dragEnd.day).getTime();
    
    const actualStart = Math.min(startDate, endDate);
    const actualEnd = Math.max(startDate, endDate);
    
    return currentDate >= actualStart && currentDate <= actualEnd;
  };

  // Generate 12 months for the current year
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index,
    year: currentYear
  }));

  return (
    <div className="space-y-4">
      {/* Year Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handlePreviousYear}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[80px] text-center">
              {currentYear}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleNextYear}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-dates">All dates</SelectItem>
              <SelectItem value="bookable-dates">Bookable dates</SelectItem>
              <SelectItem value="sold-out-dates">Sold out dates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Room type: {roomTypes.find(rt => rt.id === selectedRoomTypeFilter)?.name || "Superior Room"}
        </div>
      </div>

      {/* Calendar Grid - 4 months per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {months.map(({ month, year }) => (
          <MonthCalendar
            key={`${year}-${month}`}
            year={year}
            month={month}
            closedDates={closedDates}
            selectedRoomType={selectedRoomTypeFilter}
            roomTypes={roomTypes}
            baseDataDate={baseDataDate}
            onDateClick={onDateClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            isInDragRange={isInDragRange}
            isDragging={isDragging}
            dateFilter={dateFilter}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
          <span>Bookable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
          <span>Sold out / Rate Closed</span>
        </div>
      </div>
    </div>
  );
};