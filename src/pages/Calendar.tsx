import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { YearlyView } from "@/components/YearlyView";

// Base date for data arrays (today's date)
const BASE_DATA_DATE = new Date();

// Sample data - in real app this would come from API
const initialRoomTypes = [
  {
    id: "superior",
    name: "Superior Room",
    data: {
      status: "bookable",
      roomsToSell: [8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,7,7,5,4,4,5,6,7,7,7,7,7,7,7,7],
      netBooked: [0,0,0,0,0,1,1,1,2,2,2,2,1,1,1,1,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3],
      rates: [3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500,3500]
    }
  },
  {
    id: "deluxe-balcony",
    name: "Deluxe Room with Balcony",
    data: {
      status: "bookable",
      roomsToSell: [7,7,6,7,7,7,7,7,7,7,7,7,7,7,7,7,5,3,4,1,3,3,4,4,4,4,4,4,4,4,4],
      netBooked: [0,0,0,0,0,1,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3],
      rates: [3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750,3750]
    }
  },
  {
    id: "deluxe-oasis",
    name: "Deluxe Oasis Ground Floor",
    data: {
      status: "bookable",
      roomsToSell: [9,9,8,8,8,8,8,8,8,8,10,9,9,6,6,6,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
      netBooked: [1,1,1,4,4,4,4,4,6,6,6,6,6,3,3,6,4,4,1,1,2,2,2,2,2,2,2,2,2,2,2],
      rates: [4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100,4100]
    }
  }
];

// Function to get data index for a specific date
const getDataIndexForDate = (date: Date): number => {
  const daysDiff = Math.floor((date.getTime() - BASE_DATA_DATE.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(30, daysDiff)); // Clamp to valid array indices
};

const Calendar = () => {
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes);
  const [currentStartDate, setCurrentStartDate] = useState(new Date()); // Today
  const [dateRangeSelection, setDateRangeSelection] = useState<DateRange | undefined>();
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [simpleBulkEditOpen, setSimpleBulkEditOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState("superior");
  const [closedDates, setClosedDates] = useState<{[roomTypeId: string]: {[dateKey: string]: boolean}}>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [currentDragRoomType, setCurrentDragRoomType] = useState<string | null>(null);
  const [currentDragCellType, setCurrentDragCellType] = useState<'status' | 'roomsToSell' | 'rates' | null>(null);
  const [editingCell, setEditingCell] = useState<{roomTypeId: string, dateIndex: number, field: 'roomsToSell' | 'rates'} | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [bulkEditData, setBulkEditData] = useState({
    fromDate: new Date().toISOString().split('T')[0], // Today
    toDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    roomsToSell: "",
    rateType: "Standard Rate",
    price: "",
    roomStatus: "open",
    restrictions: ""
  });
  const [bulkEditSelection, setBulkEditSelection] = useState<{startDate: Date | null, endDate: Date | null, roomTypeId: string | null}>({
    startDate: null,
    endDate: null,
    roomTypeId: null
  });
  const [currentView, setCurrentView] = useState<"list-view" | "yearly-view">("list-view");
  const [selectedRoomTypeFilter, setSelectedRoomTypeFilter] = useState("all-rooms");
  const [syncInfoDialogOpen, setSyncInfoDialogOpen] = useState(false);

  const getCurrentSyncTime = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString('en-GB', { month: 'short' });
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const generateCalendarDates = () => {
    const dates = [];
    let currentDate = new Date(currentStartDate);
    
    for (let i = 0; i < 31; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const calendarDates = generateCalendarDates();
  
  // Generate date range string for display
  const generateDateRangeString = () => {
    const endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + 30);
    
    const startStr = currentStartDate.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
    const endStr = endDate.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
    
    return `${startStr} - ${endStr}`;
  };

  const selectedDateRange = generateDateRangeString();

  // Navigation functions
  const handlePreviousWeek = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentStartDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentStartDate(newDate);
  };

  // Handle date range picker changes
  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setDateRangeSelection(dateRange);
    if (dateRange?.from) {
      setCurrentStartDate(new Date(dateRange.from));
    }
  };
  
  // Group dates by month for display
  const septemberDates = calendarDates.filter(date => date.getMonth() === 8);
  const octoberDates = calendarDates.filter(date => date.getMonth() === 9);
  // Aliases to maintain compatibility with older references
  const septemberDays = septemberDates;
  const octoberDays = octoberDates;

  const handleDayOfWeekToggle = (day: string) => {
    setBulkEditData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDateNumber = (date: Date) => {
    return date.getDate();
  };

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const toggleDateStatus = (roomTypeId: string, date: Date) => {
    const dateKey = getDateKey(date);
    setClosedDates(prev => ({
      ...prev,
      [roomTypeId]: {
        ...prev[roomTypeId],
        [dateKey]: !prev[roomTypeId]?.[dateKey]
      }
    }));
  };

  const isDateClosed = (roomTypeId: string, date: Date) => {
    const dateKey = getDateKey(date);
    return closedDates[roomTypeId]?.[dateKey] || false;
  };

  const hasClosedDatesForRoom = (roomTypeId: string) => {
    return Object.values(closedDates[roomTypeId] || {}).some(isClosed => isClosed);
  };

  // Create segments of consecutive open/closed dates
  const createDateSegments = (roomTypeId: string, dates: Date[]) => {
    const segments: Array<{type: 'open' | 'closed', startIndex: number, endIndex: number, dates: Date[]}> = [];
    let currentSegment: {type: 'open' | 'closed', startIndex: number, endIndex: number, dates: Date[]} | null = null;

    dates.forEach((date, index) => {
      const isClosed = isDateClosed(roomTypeId, date);
      const segmentType = isClosed ? 'closed' : 'open';

      if (!currentSegment || currentSegment.type !== segmentType) {
        if (currentSegment) {
          currentSegment.endIndex = index - 1;
          segments.push(currentSegment);
        }
        currentSegment = {
          type: segmentType,
          startIndex: index,
          endIndex: index,
          dates: [date]
        };
      } else {
        currentSegment.dates.push(date);
        currentSegment.endIndex = index;
      }
    });

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  };

  const handleMouseDown = (roomTypeId: string, dateIndex: number, cellType: 'status' | 'roomsToSell' | 'rates' = 'status') => {
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    setIsDragging(true);
    setDragStart(dateIndex);
    setDragEnd(dateIndex);
    setCurrentDragRoomType(roomTypeId);
    setCurrentDragCellType(cellType);
  };

  const handleMouseMove = (dateIndex: number) => {
    if (isDragging && dragStart !== null) {
      setDragEnd(dateIndex);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart !== null && dragEnd !== null && currentDragRoomType && currentDragCellType) {
      const startIndex = Math.min(dragStart, dragEnd);
      const endIndex = Math.max(dragStart, dragEnd);
      
      // If it's a single click (start and end are the same)
      if (startIndex === endIndex) {
        const date = calendarDates[startIndex];
        if (date) {
          if (currentDragCellType === 'status') {
            // Toggle date status for status cells
            toggleDateStatus(currentDragRoomType, date);
          } else if (currentDragCellType === 'roomsToSell' || currentDragCellType === 'rates') {
            // Open inline edit for rates/rooms cells
            handleCellClick(currentDragRoomType, startIndex, currentDragCellType);
          }
        }
      } else {
        // For status cells, immediately toggle all dates in the range without opening sidebar
        if (currentDragCellType === 'status') {
          const startDate = calendarDates[startIndex];
          const endDate = calendarDates[endIndex];
          
          if (startDate && endDate) {
            // Toggle all dates in range
            for (let i = startIndex; i <= endIndex; i++) {
              const date = calendarDates[i];
              if (date) {
                toggleDateStatus(currentDragRoomType, date);
              }
            }
          }
        } else {
          // For drag selection of rates/rooms cells, open simple bulk edit dialog
          const startDate = calendarDates[startIndex];
          const endDate = calendarDates[endIndex];
          
          if (startDate && endDate) {
            setBulkEditSelection({
              startDate,
              endDate,
              roomTypeId: currentDragRoomType
            });
            setSelectedRoomType(currentDragRoomType);
            setSimpleBulkEditOpen(true);
          }
        }
      }
    }
    
    // Restore text selection
    document.body.style.userSelect = '';
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setCurrentDragRoomType(null);
    setCurrentDragCellType(null);
  };

  const isInDragRange = (dateIndex: number, roomTypeId: string) => {
    if (!isDragging || dragStart === null || dragEnd === null || currentDragRoomType !== roomTypeId) {
      return false;
    }
    const startIndex = Math.min(dragStart, dragEnd);
    const endIndex = Math.max(dragStart, dragEnd);
    return dateIndex >= startIndex && dateIndex <= endIndex;
  };

  // Only highlight during multi-cell drag operations, not single cell clicks
  const isInMultiCellDragRange = (dateIndex: number, roomTypeId: string, cellType: 'status' | 'roomsToSell' | 'rates') => {
    if (!isDragging || dragStart === null || dragEnd === null || currentDragRoomType !== roomTypeId || currentDragCellType !== cellType) {
      return false;
    }
    // Only highlight if we're dragging across multiple cells
    if (dragStart === dragEnd) {
      return false;
    }
    const startIndex = Math.min(dragStart, dragEnd);
    const endIndex = Math.max(dragStart, dragEnd);
    return dateIndex >= startIndex && dateIndex <= endIndex;
  };

  const handleCellClick = (roomTypeId: string, dateIndex: number, field: 'roomsToSell' | 'rates') => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    if (!roomType) return;
    
    const dataIndex = getDataIndexForDate(calendarDates[dateIndex]);
    const currentValue = roomType.data[field][dataIndex];
    
    setEditingCell({ roomTypeId, dateIndex, field });
    setEditValue(currentValue.toString());
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    
    const { roomTypeId, dateIndex, field } = editingCell;
    const dataIndex = getDataIndexForDate(calendarDates[dateIndex]);
    const numValue = parseInt(editValue);
    
    if (isNaN(numValue) || numValue < 0) return;
    
    setRoomTypes(prev => prev.map(roomType => {
      if (roomType.id === roomTypeId) {
        const newData = { ...roomType.data };
        newData[field] = [...newData[field]];
        newData[field][dataIndex] = numValue;
        return { ...roomType, data: newData };
      }
      return roomType;
    }));
    
    setEditingCell(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleBulkEditSave = () => {
    // For comprehensive bulk edit (with form inputs), use form dates
    // For simple bulk edit (drag selection), use selection dates
    let fromDate: Date, toDate: Date;
    
    if (bulkEditSelection.startDate && bulkEditSelection.endDate) {
      // Simple bulk edit from drag selection
      fromDate = bulkEditSelection.startDate;
      toDate = bulkEditSelection.endDate;
    } else {
      // Comprehensive bulk edit with form inputs
      fromDate = new Date(bulkEditData.fromDate);
      toDate = new Date(bulkEditData.toDate);
    }
    
    // Find all calendar dates within the specified range
    const affectedDates = calendarDates.filter(date => {
      return date >= fromDate && date <= toDate;
    });
    
    if (affectedDates.length === 0) return;
    
    // Get the room type to modify
    const roomTypeId = bulkEditSelection.roomTypeId || selectedRoomType;
    if (!roomTypeId) return;
    
    // Apply bulk changes to rooms and rates
    setRoomTypes(prev => prev.map(roomType => {
      if (roomType.id === roomTypeId) {
        const newData = { ...roomType.data };
        
        affectedDates.forEach(date => {
          const dataIndex = getDataIndexForDate(date);
          
          // Update rooms to sell if specified
          if (bulkEditData.roomsToSell) {
            const roomsToSell = parseInt(bulkEditData.roomsToSell);
            if (!isNaN(roomsToSell) && roomsToSell >= 0) {
              newData.roomsToSell = [...newData.roomsToSell];
              newData.roomsToSell[dataIndex] = roomsToSell;
            }
          }
          
          // Update price if specified
          if (bulkEditData.price) {
            const price = parseInt(bulkEditData.price);
            if (!isNaN(price) && price >= 0) {
              newData.rates = [...newData.rates];
              newData.rates[dataIndex] = price;
            }
          }
        });
        
        return { ...roomType, data: newData };
      }
      return roomType;
    }));
    
    // Apply room status changes to dates within range
    const shouldClose = bulkEditData.roomStatus === 'close';
    setClosedDates(prev => {
      const newClosedDates = { ...prev };
      if (!newClosedDates[roomTypeId]) {
        newClosedDates[roomTypeId] = {};
      }
      
      affectedDates.forEach(date => {
        const dateKey = getDateKey(date);
        newClosedDates[roomTypeId][dateKey] = shouldClose;
      });
      
      return newClosedDates;
    });
    
    // Close dialogs and reset
    setBulkEditOpen(false);
    setSimpleBulkEditOpen(false);
    setBulkEditSelection({ startDate: null, endDate: null, roomTypeId: null });
    setBulkEditData(prev => ({ ...prev, roomsToSell: "", price: "" }));
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-GB', formatOptions)} - ${endDate.toLocaleDateString('en-GB', formatOptions)}`;
  };

  const formatDateStringRange = (fromDateStr: string, toDateStr: string) => {
    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    return `${fromDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${toDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  };

  const getCurrentRoomType = () => {
    return roomTypes.find(rt => rt.id === bulkEditSelection.roomTypeId);
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Calendar</h1>
          
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select value={selectedRoomTypeFilter} onValueChange={setSelectedRoomTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-rooms">All rooms</SelectItem>
                  <SelectItem value="superior">Superior Room</SelectItem>
                  <SelectItem value="deluxe-balcony">Deluxe Room with Balcony</SelectItem>
                  <SelectItem value="deluxe-oasis">Deluxe Oasis Ground Floor</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                XML (edits overwritten)
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Last sync: {getCurrentSyncTime()}</span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-primary"
                  onClick={() => setSyncInfoDialogOpen(true)}
                >
                  Learn more
                </Button>
              </div>
            </div>
            
            <Select value={currentView} onValueChange={(value: "list-view" | "yearly-view") => setCurrentView(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list-view">List view</SelectItem>
                <SelectItem value="yearly-view">Yearly view</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range and Restrictions - Only show in list view */}
          {currentView === "list-view" && (
            <div className="flex items-center gap-4 mb-6">
              <DateRangePicker 
                date={dateRangeSelection}
                onDateChange={handleDateRangeChange}
              />
              
              <div className="flex items-center gap-2">
                <Checkbox id="restrictions" />
                <Label htmlFor="restrictions" className="text-sm">Restrictions</Label>
              </div>
            </div>
          )}
        </div>

        {/* Calendar Content */}
        {currentView === "yearly-view" ? (
          <YearlyView 
            roomTypes={roomTypes}
            closedDates={closedDates}
            selectedRoomTypeFilter={selectedRoomTypeFilter}
            baseDataDate={BASE_DATA_DATE}
            onDateClick={(date) => {
              // Handle date click in yearly view - could open bulk edit or navigate
              console.log('Date clicked:', date);
            }}
          />
        ) : (
          <React.Fragment>
        {/* Calendar Grid - Horizontal Scroll Container */}
        <div className="overflow-hidden">
          <div className="min-w-auto">
          {/* Month Headers */}
          <div className="grid grid-cols-[220px_1fr] mb-4 relative">
            <div></div>
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Positioned month headers aligned with first date of each month */}
            <div className="absolute top-[7px] left-[220px] right-0 pointer-events-none">
              {/* Use the same 31-column grid to align headers with borders */}
              <div className="grid grid-cols-31 h-6">
                {(() => {
                  const monthHeaders: JSX.Element[] = [];
                  let currentMonth = -1;

                  calendarDates.forEach((date, index) => {
                    if (date.getMonth() !== currentMonth) {
                      currentMonth = date.getMonth();
                      const colStart = index + 1; // grid columns are 1-indexed
                      monthHeaders.push(
                        <h2
                          key={`month-${currentMonth}-${date.getFullYear()}`}
                          className="text-sm font-medium justify-self-start whitespace-nowrap"
                          style={{ gridColumnStart: colStart }}
                        >
                          {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                      );
                    }
                  });

                  return monthHeaders;
                })()}
              </div>
            </div>
          </div>

          {/* Calendar Header - Days and Dates */}
          <div className="grid grid-cols-[220px_1fr] border border-calendar-grid-border rounded-t-lg overflow-hidden">
            <div className="bg-muted/50 border-r border-calendar-grid-border"></div>
            <div className="bg-muted/50">
              <div className="grid grid-cols-31 h-full">
                {calendarDates.map((date, index) => {
                  const dayName = getDayName(date);
                  const isSaturday = dayName === 'Sat';
                  return (
                    <div key={index} className={cn(
                      "border-r border-calendar-grid-border last:border-r-0 relative",
                      isSaturday && "after:absolute after:inset-y-0 after:-right-px after:w-0.5 after:bg-blue-500 after:z-10"
                    )}>
                      <div className="p-1 text-center">
                        <div className="text-xs text-muted-foreground">{dayName}</div>
                        <div className="text-xs font-medium">{getDateNumber(date)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Room Types */}
          <div className="space-y-0">
            {roomTypes
              .filter(roomType => selectedRoomTypeFilter === "all-rooms" || roomType.id === selectedRoomTypeFilter)
              .map((roomType, roomIndex, filteredArray) => (
              <div key={roomType.id} className={cn(
                "border-x border-b border-calendar-grid-border",
                roomIndex === filteredArray.length - 1 && "rounded-b-lg"
              )}>
                {/* Room Type Header */}
                <div className="grid grid-cols-[220px_1fr] bg-muted/30 border-b border-calendar-grid-border">
                  <div className="p-3 border-r border-calendar-grid-border flex items-center">
                    <h3 className="text-sm font-semibold truncate">{roomType.name}</h3>
                  </div>
                  <div className="p-3 flex justify-end">
                    <Sheet open={bulkEditOpen && selectedRoomType === roomType.id} onOpenChange={(open) => {
                      setBulkEditOpen(open);
                      if (open) {
                        setSelectedRoomType(roomType.id);
                        // If no selection yet, default to the visible range
                        if (!bulkEditSelection.startDate || !bulkEditSelection.endDate) {
                          setBulkEditSelection({
                            startDate: calendarDates[0],
                            endDate: calendarDates[calendarDates.length - 1],
                            roomTypeId: roomType.id,
                          });
                        }
                      } else {
                        // Reset when closing via UI controls
                        setBulkEditSelection({ startDate: null, endDate: null, roomTypeId: null });
                        setBulkEditData((prev) => ({ ...prev, roomsToSell: "", price: "" }));
                      }
                    }}>
                      <SheetTrigger asChild>
                        <Button variant="default" size="sm">
                          Bulk edit
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[450px] sm:w-[450px] max-w-none sm:max-w-none overflow-y-auto" style={{width: '450px'}}>
                        <SheetHeader>
                          <SheetTitle className="text-xl font-semibold">Bulk edit</SheetTitle>
                        </SheetHeader>
                        
                        <div className="mt-6 space-y-6">
                          {/* Date Range */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="from-date" className="text-sm font-medium">From:</Label>
                              <Input
                                id="from-date"
                                type="date"
                                value={bulkEditData.fromDate}
                                onChange={(e) => setBulkEditData(prev => ({ ...prev, fromDate: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="to-date" className="text-sm font-medium">Up to and including:</Label>
                              <Input
                                id="to-date"
                                type="date"
                                value={bulkEditData.toDate}
                                onChange={(e) => setBulkEditData(prev => ({ ...prev, toDate: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          {/* Days of week */}
                          <div>
                            <Label className="text-sm font-medium mb-3 block">
                              Which days of the week do you want to apply changes to?
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`day-${day}`}
                                    checked={bulkEditData.daysOfWeek.includes(day)}
                                    onCheckedChange={() => handleDayOfWeekToggle(day)}
                                  />
                                  <Label htmlFor={`day-${day}`} className="text-sm">{day}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Room Type Tabs */}
                          <div className="border-b border-border">
                            <div className="flex space-x-6">
                              <button className="pb-2 text-sm font-medium text-primary border-b-2 border-primary">
                                {getCurrentRoomType()?.name || "Superior"}
                              </button>
                              <button className="pb-2 text-sm font-medium text-muted-foreground">
                                Multiple room types
                              </button>
                            </div>
                          </div>

                          {/* Collapsible sections */}
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg">
                              <div className="text-left">
                                <h4 className="text-lg font-semibold">Rooms to sell</h4>
                                <p className="text-sm text-muted-foreground">Update the number of rooms to sell for this room type</p>
                              </div>
                              <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-4 space-y-4">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Number of rooms"
                                  value={bulkEditData.roomsToSell}
                                  onChange={(e) => setBulkEditData(prev => ({ ...prev, roomsToSell: e.target.value }))}
                                  className="flex-1"
                                />
                                <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground border">
                                  Room(s)
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Changes will be made to the date range: {formatDateStringRange(bulkEditData.fromDate, bulkEditData.toDate)}
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleBulkEditSave}>Save changes</Button>
                                <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg">
                              <div className="text-left">
                                <h4 className="text-lg font-semibold">Prices</h4>
                                <p className="text-sm text-muted-foreground">Edit the prices of any rate plans for this room</p>
                              </div>
                              <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-4 space-y-4">
                              <div className="flex gap-2">
                                <Select value={bulkEditData.rateType} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, rateType: value }))}>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Standard Rate">Standard Rate</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground border">
                                  THB
                                </div>
                              </div>
                              <Input
                                type="number"
                                placeholder="Price"
                                value={bulkEditData.price}
                                onChange={(e) => setBulkEditData(prev => ({ ...prev, price: e.target.value }))}
                              />
                              <p className="text-xs text-muted-foreground">
                                Changes will be made to the date range: {formatDateStringRange(bulkEditData.fromDate, bulkEditData.toDate)}
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleBulkEditSave}>Save changes</Button>
                                <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg">
                              <div className="text-left">
                                <h4 className="text-lg font-semibold">Room status</h4>
                                <p className="text-sm text-muted-foreground">Open or close this room</p>
                              </div>
                              <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-4 space-y-4">
                              <RadioGroup value={bulkEditData.roomStatus} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, roomStatus: value }))}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="open" id="open-room" />
                                  <Label htmlFor="open-room">Open room</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="close" id="close-room" />
                                  <Label htmlFor="close-room">Close room</Label>
                                </div>
                              </RadioGroup>
                              <p className="text-xs text-muted-foreground">
                                Changes will be made to the date range: {formatDateStringRange(bulkEditData.fromDate, bulkEditData.toDate)}
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleBulkEditSave}>Save changes</Button>
                                <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg">
                              <div className="text-left">
                                <h4 className="text-lg font-semibold">Restrictions</h4>
                                <p className="text-sm text-muted-foreground">Edit, add or remove restrictions for any rate plan for this room</p>
                              </div>
                              <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-4 space-y-4">
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a rate plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Standard Rate</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button variant="link" size="sm" className="text-primary p-0">
                                <span className="mr-1">+</span> Add more
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                Changes will be made to the date range: {formatDateStringRange(bulkEditData.fromDate, bulkEditData.toDate)}
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleBulkEditSave}>Save changes</Button>
                                <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                {/* Room Status Row */}
                <div className="grid grid-cols-[220px_1fr] border-b border-calendar-grid-border">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <span className="text-xs font-medium">Room status</span>
                  </div>
                  <div className="h-12 relative">
                    {/* Render segments */}
                    {createDateSegments(roomType.id, calendarDates).map((segment, segmentIndex) => {
                      const cellWidth = 100 / 31; // Each cell is 1/31 of the width
                      const leftPercent = (segment.startIndex / 31) * 100;
                      const widthPercent = ((segment.endIndex - segment.startIndex + 1) / 31) * 100;
                      
                       if (segment.type === 'open') {
                        return (
                          <div 
                            key={`segment-${segmentIndex}`}
                            className="absolute top-3 bottom-3 bg-green-500 text-white rounded-full flex items-center justify-start pl-3 z-30 pointer-events-none"
                            style={{
                              left: `calc(${leftPercent}% + 8px)`,
                              width: `calc(${widthPercent}% - 16px)`,
                            }}
                          >
                            <span className="text-xs font-medium truncate pr-2">Bookable</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                    
                    {/* Closed date segment bubbles */}
                    {createDateSegments(roomType.id, calendarDates).map((segment, segmentIndex) => {
                      const leftPercent = (segment.startIndex / 31) * 100;
                      const widthPercent = ((segment.endIndex - segment.startIndex + 1) / 31) * 100;
                      
                      if (segment.type === 'closed') {
                        return (
                          <div 
                            key={`closed-segment-${segmentIndex}`}
                            className="absolute top-3 bottom-3 bg-red-500 text-white rounded-full flex items-center justify-start pl-3 z-30 pointer-events-none"
                            style={{
                              left: `calc(${leftPercent}% + 8px)`,
                              width: `calc(${widthPercent}% - 16px)`,
                            }}
                          >
                            <span className="text-xs font-medium truncate pr-2">Rate Closed</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                    
                    {/* Clickable overlay cells */}
                    <div className="grid grid-cols-31 h-full relative z-20">
                      {calendarDates.map((date, index) => {
                        const inDragRange = isInMultiCellDragRange(index, roomType.id, 'status');
                        const dayName = getDayName(date);
                        const isSaturday = dayName === 'Sat';
                        return (
                          <div 
                            key={`${roomType.id}-status-${index}`} 
                            className={cn(
                              "border-r border-calendar-grid-border last:border-r-0 cursor-pointer flex items-center justify-center relative",
                              inDragRange && "bg-blue-200",
                              isSaturday && "after:absolute after:inset-y-0 after:-right-px after:w-0.5 after:bg-blue-500 after:z-10"
                            )}
                            onMouseDown={() => handleMouseDown(roomType.id, index, 'status')}
                            onMouseMove={() => handleMouseMove(index)}
                            onMouseUp={handleMouseUp}
                            onMouseEnter={() => handleMouseMove(index)}
                          >
                            {/* Interaction area only - bubbles are rendered as segments above */}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Rooms to Sell Row */}
                <div className="grid grid-cols-[220px_1fr] border-b border-calendar-grid-border">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <span className="text-xs font-medium">Rooms to sell</span>
                  </div>
                  <div className="h-12">
                    <div className="grid grid-cols-31 h-full">
                      {calendarDates.map((date, index) => {
                        const dataIndex = getDataIndexForDate(date);
                        const isClosed = isDateClosed(roomType.id, date);
                        const isEditing = editingCell?.roomTypeId === roomType.id && editingCell?.dateIndex === index && editingCell?.field === 'roomsToSell';
                        const dayName = getDayName(date);
                        const isSaturday = dayName === 'Sat';
                        
                        return (
                           <div key={`${roomType.id}-rooms-${index}`} className={cn(
                             "border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center text-sm font-medium cursor-pointer relative",
                             !isDragging && "hover:bg-calendar-cell-hover",
                             isClosed && "bg-red-200",
                              isInMultiCellDragRange(index, roomType.id, 'roomsToSell') && "bg-blue-200",
                              isSaturday && "after:absolute after:inset-y-0 after:-right-px after:w-0.5 after:bg-blue-500 after:z-10"
                           )}
                             onMouseDown={(e) => {
                               e.stopPropagation();
                               handleMouseDown(roomType.id, index, 'roomsToSell');
                             }}
                             onMouseMove={() => handleMouseMove(index)}
                             onMouseUp={handleMouseUp}
                             onMouseEnter={() => handleMouseMove(index)}
                            >
                             {isEditing ? (
                              <Input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="w-full h-8 text-center text-sm p-1 border-0 bg-white shadow-sm"
                                type="number"
                                min="0"
                              />
                             ) : (
                               <span>
                                 {roomType.data.roomsToSell[dataIndex]}
                               </span>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Net Booked Row */}
                <div className="grid grid-cols-[220px_1fr] border-b border-calendar-grid-border">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <span className="text-xs font-medium">Net booked</span>
                  </div>
                  <div className="h-12">
                    <div className="grid grid-cols-31 h-full">
                      {calendarDates.map((date, index) => {
                        const dataIndex = getDataIndexForDate(date);
                        const bookedCount = roomType.data.netBooked[dataIndex];
                        const isClosed = isDateClosed(roomType.id, date);
                        const dayName = getDayName(date);
                        const isSaturday = dayName === 'Sat';
                        return (
                          <div key={`${roomType.id}-booked-${index}`} className={cn(
                            "border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center relative",
                            isClosed && "bg-red-200",
                            isInMultiCellDragRange(index, roomType.id, 'status') && "bg-blue-200",
                             isSaturday && "after:absolute after:inset-y-0 after:-right-px after:w-0.5 after:bg-blue-500 after:z-10"
                          )}>
                            {bookedCount > 0 && (
                              <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                {bookedCount}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Standard Rate Row */}
                <div className="grid grid-cols-[220px_1fr] border-b border-calendar-grid-border last:border-b-0">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <span className="text-xs font-medium">Standard Rate</span>
                  </div>
                  <div className="h-12">
                    <div className="grid grid-cols-31 h-full">
                      {calendarDates.map((date, index) => {
                        const dataIndex = getDataIndexForDate(date);
                        const isClosed = isDateClosed(roomType.id, date);
                        const isEditing = editingCell?.roomTypeId === roomType.id && editingCell?.dateIndex === index && editingCell?.field === 'rates';
                        const dayName = getDayName(date);
                        const isSaturday = dayName === 'Sat';
                        
                        return (
                           <div key={`${roomType.id}-rate-${index}`} className={cn(
                             "border-r border-calendar-grid-border last:border-r-0 flex flex-col items-center justify-center cursor-pointer relative",
                             !isDragging && "hover:bg-calendar-cell-hover",
                             isClosed && "bg-red-200",
                             isInMultiCellDragRange(index, roomType.id, 'rates') && "bg-blue-200",
                             isSaturday && "after:absolute after:inset-y-0 after:-right-px after:w-0.5 after:bg-blue-500 after:z-10"
                           )}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleMouseDown(roomType.id, index, 'rates');
                              }}
                              onMouseMove={() => handleMouseMove(index)}
                              onMouseUp={handleMouseUp}
                              onMouseEnter={() => handleMouseMove(index)}
                            >
                            {isEditing ? (
                              <Input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="w-full h-8 text-center text-xs p-1 border-0 bg-white shadow-sm"
                                type="number"
                                min="0"
                              />
                             ) : (
                               <div className="text-center flex flex-col items-center justify-center h-full">
                                 <span className="text-[10px] text-muted-foreground -mb-px">THB</span>
                                 <span className="text-xs font-medium">{roomType.data.rates[dataIndex]}</span>
                               </div>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
        </React.Fragment>
        )}

      {/* Simple Bulk Edit Dialog for Drag Selections */}
      <Sheet open={simpleBulkEditOpen} onOpenChange={setSimpleBulkEditOpen}>
        <SheetContent className="w-[400px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="sr-only">Bulk Edit</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Room Type Header */}
            <div>
              <h2 className="text-xl font-semibold">{getCurrentRoomType()?.name}</h2>
              <p className="text-sm text-muted-foreground">Standard Rate</p>
              {bulkEditSelection.startDate && bulkEditSelection.endDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDateRange(bulkEditSelection.startDate, bulkEditSelection.endDate)}
                </p>
              )}
              <Button variant="link" className="text-primary p-0 mt-2 text-sm">
                Bulk edit
              </Button>
            </div>

            {/* Room Status */}
            <div className="space-y-3">
              <RadioGroup 
                value={bulkEditData.roomStatus} 
                onValueChange={(value) => setBulkEditData(prev => ({ ...prev, roomStatus: value }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="open" id="bulk-open" />
                  <Label htmlFor="bulk-open" className="text-sm font-medium">Open</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="close" id="bulk-close" />
                  <Label htmlFor="bulk-close" className="text-sm font-medium">Close</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Rooms to sell */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rooms to sell</Label>
              <Input
                type="number"
                placeholder="Number of rooms"
                value={bulkEditData.roomsToSell}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, roomsToSell: e.target.value }))}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price</Label>
              <div className="flex gap-2">
                <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground border">
                  THB
                </div>
                <Input
                  type="number"
                  placeholder={(() => {
                    const roomType = getCurrentRoomType();
                    if (roomType && bulkEditSelection.startDate) {
                      const dataIndex = getDataIndexForDate(bulkEditSelection.startDate);
                      return roomType.data.rates[dataIndex].toString();
                    }
                    return "3750";
                  })()}
                  value={bulkEditData.price}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, price: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleBulkEditSave} className="flex-1">
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSimpleBulkEditOpen(false);
                  setBulkEditSelection({ startDate: null, endDate: null, roomTypeId: null });
                  setBulkEditData(prev => ({ ...prev, roomsToSell: "", price: "" }));
                }}
                className="flex-1 text-primary border-primary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sync Info Dialog */}
      <Dialog open={syncInfoDialogOpen} onOpenChange={setSyncInfoDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sync Information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Last sync with your connectivity provider: {getCurrentSyncTime()}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">
                Depending on the response time between your provider (SiteMinder) and Viridianphuket.com, updates may take a while to sync.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSyncInfoDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
};

export default Calendar;