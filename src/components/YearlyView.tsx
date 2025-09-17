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
    <div className="space-y-6">
      {/* Year Controls */}
      <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePreviousYear} className="h-8 w-8 rounded-full hover:bg-primary/10">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold min-w-[80px] text-center bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {currentYear}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleNextYear} className="h-8 w-8 rounded-full hover:bg-primary/10">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px] h-9 border-border/50 bg-white/80 hover:bg-white focus:ring-1 focus:ring-primary/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-dates">All dates</SelectItem>
              <SelectItem value="bookable-dates">Bookable dates</SelectItem>
              <SelectItem value="sold-out-dates">Sold out dates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full">
          Room type: <span className="text-foreground">{roomTypes.find(rt => rt.id === selectedRoomTypeFilter)?.name || "All rooms"}</span>
        </div>
      </div>

      {/* Calendar Grid - 4 months per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-sm border border-accent-foreground/20 shadow-sm"></div>
            <span className="font-medium">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded-sm shadow-sm"></div>
            <span className="font-medium">Bookable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded-sm shadow-sm"></div>
            <span className="font-medium">Sold out / Closed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border border-border rounded-sm shadow-sm"></div>
            <span className="font-medium">Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};