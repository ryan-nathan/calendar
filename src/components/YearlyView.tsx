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
}

export const YearlyView = ({ 
  roomTypes, 
  closedDates, 
  selectedRoomTypeFilter,
  baseDataDate,
  onDateClick 
}: YearlyViewProps) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dateFilter, setDateFilter] = useState("all-dates");

  const handlePreviousYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
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
          <span>Sold out / Closed</span>
        </div>
      </div>
    </div>
  );
};