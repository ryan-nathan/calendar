import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [simpleBulkEditOpen, setSimpleBulkEditOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState("superior");
  const [closedDates, setClosedDates] = useState<{[roomTypeId: string]: {[dateKey: string]: boolean}}>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [currentDragRoomType, setCurrentDragRoomType] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{roomTypeId: string, dateIndex: number, field: 'roomsToSell' | 'rates'} | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [totalMonths, setTotalMonths] = useState(2); // Start with 2 months
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

  // Generate calendar dates from current start date (based on totalMonths)
  const generateCalendarDates = () => {
    const dates = [];
    let currentDate = new Date(currentStartDate);
    
    // Generate dates for totalMonths worth of data
    const daysToGenerate = totalMonths * 31; // Roughly 31 days per month
    for (let i = 0; i < daysToGenerate; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const calendarDates = generateCalendarDates();
  
  // Lazy loading scroll handler  
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
    
    // Load more months when user scrolls to 80% of current content
    if (scrollPercentage > 0.8) {
      setTotalMonths(prev => prev + 1);
    }
  };

  // Generate date range string for display
  const generateDateRangeString = () => {
    const endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + (totalMonths * 31) - 1);
    
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
  
  // Group dates by month for display
  const datesByMonth = calendarDates.reduce((acc, date) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(date);
    return acc;
  }, {} as Record<string, Date[]>);

  // Get month names for headers
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

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

  const handleMouseDown = (roomTypeId: string, dateIndex: number) => {
    setIsDragging(true);
    setDragStart(dateIndex);
    setDragEnd(dateIndex);
    setCurrentDragRoomType(roomTypeId);
  };

  const handleMouseMove = (dateIndex: number) => {
    if (isDragging && dragStart !== null) {
      setDragEnd(dateIndex);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart !== null && dragEnd !== null && currentDragRoomType) {
      const startIndex = Math.min(dragStart, dragEnd);
      const endIndex = Math.max(dragStart, dragEnd);
      
      // If it's a single click (start and end are the same), toggle that single date
      if (startIndex === endIndex) {
        const date = calendarDates[startIndex];
        if (date) {
          toggleDateStatus(currentDragRoomType, date);
        }
      } else {
        // For drag selection of multiple dates, open simple bulk edit dialog
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
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setCurrentDragRoomType(null);
  };

  const isInDragRange = (dateIndex: number, roomTypeId: string) => {
    if (!isDragging || dragStart === null || dragEnd === null || currentDragRoomType !== roomTypeId) {
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
              <Select defaultValue="all-rooms">
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
                <span>Last sync: 16 Sept 2025, 14:26</span>
                <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                  Learn more
                </Button>
              </div>
            </div>
            
            <Select defaultValue="list-view">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list-view">List view</SelectItem>
                <SelectItem value="calendar-view">Calendar view</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range and Restrictions */}
          <div className="flex items-center gap-4 mb-6">
            <div className="px-4 py-2 border border-primary rounded-md text-sm font-medium text-primary bg-primary/5">
              {selectedDateRange}
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox id="restrictions" />
              <Label htmlFor="restrictions" className="text-sm">Restrictions</Label>
            </div>
          </div>
        </div>

        {/* Calendar Grid - Horizontal Scroll Container */}
        <div className="flex">
          {/* Fixed Left Sidebar */}
          <div className="w-[220px] flex-shrink-0 bg-background z-10">
            {/* Header spacer */}
            <div className="h-[72px] border-b"></div>
            
            {/* Room Type Labels */}
            {roomTypes.map((roomType) => (
              <div key={roomType.id} className="space-y-0">
                <div className="h-12 flex items-center px-4 text-sm font-medium border-b border-border bg-muted/50">
                  {roomType.name}
                </div>
                <div className="h-8 flex items-center px-4 text-xs text-muted-foreground border-b border-border">
                  Rooms to Sell
                </div>
                <div className="h-8 flex items-center px-4 text-xs text-muted-foreground border-b border-border">
                  Net Booked
                </div>
                <div className="h-8 flex items-center px-4 text-xs text-muted-foreground border-b border-border">
                  Rate (INR)
                </div>
              </div>
            ))}
          </div>

          {/* Scrollable Calendar Grid */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-hidden"
            onScroll={handleScroll}
          >
            <div className="min-w-max">
              {/* Month Headers */}
              <div className="flex h-[72px] border-b">
                {Object.entries(datesByMonth).map(([monthKey, dates]) => (
                  <div key={monthKey} className="flex flex-col">
                    <div className="h-8 flex items-center justify-center text-sm font-semibold bg-muted px-2 border-r border-border" style={{width: `${(dates as Date[]).length * 64}px`}}>
                      {getMonthName((dates as Date[])[0])}
                    </div>
                    <div className="flex h-8">
                      {(dates as Date[]).map((date, index) => (
                        <div
                          key={index}
                          className="w-16 h-8 flex items-center justify-center text-xs font-medium text-foreground border-r border-border"
                        >
                          {getDateNumber(date)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Calendar Rows */}
              <div className="space-y-0">
                {roomTypes.map((roomType) => (
                  <div key={roomType.id} className="space-y-0">
                    {/* Room Type Header */}
                    <div className="h-12 flex border-b border-border bg-muted/50">
                      <div className="flex">
                        {calendarDates.map((date, dateIndex) => {
                          const isClosed = isDateClosed(roomType.id, date);
                          const isInRange = isInDragRange(dateIndex, roomType.id);
                          
                          return (
                            <div
                              key={dateIndex}
                              className={cn(
                                "w-16 h-12 border-r border-border flex items-center justify-center cursor-pointer",
                                isClosed ? "bg-red-100" : "bg-background hover:bg-muted/30",
                                isInRange && "bg-primary/20"
                              )}
                              onMouseDown={() => handleMouseDown(roomType.id, dateIndex)}
                              onMouseMove={() => handleMouseMove(dateIndex)}
                              onMouseUp={handleMouseUp}
                            >
                              {isClosed && (
                                <X className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Rooms to Sell Row */}
                    <div className="h-8 border-b border-border">
                      <div className="flex">
                        {calendarDates.map((date, dateIndex) => {
                          const dataIndex = getDataIndexForDate(date);
                          const roomsToSell = roomType.data.roomsToSell[dataIndex];
                          const isClosed = isDateClosed(roomType.id, date);
                          const isEditing = editingCell?.roomTypeId === roomType.id && 
                                          editingCell?.dateIndex === dateIndex && 
                                          editingCell?.field === 'roomsToSell';
                          const isInRange = isInDragRange(dateIndex, roomType.id);
                          
                          return (
                            <div
                              key={dateIndex}
                              className={cn(
                                "w-16 h-8 border-r border-border flex items-center justify-center text-xs cursor-pointer relative",
                                isClosed ? "bg-red-100 text-red-800" : "bg-background hover:bg-muted/50",
                                isInRange && "bg-primary/20"
                              )}
                              onClick={() => !isDragging && handleCellClick(roomType.id, dateIndex, 'roomsToSell')}
                            >
                              {isEditing ? (
                                <Input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleSaveEdit}
                                  className="h-6 w-12 text-xs p-1 text-center border-0 bg-transparent"
                                />
                              ) : (
                                <span className={cn(isClosed && "line-through")}>
                                  {roomsToSell}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Net Booked Row */}
                    <div className="h-8 border-b border-border">
                      <div className="flex">
                        {calendarDates.map((date, dateIndex) => {
                          const dataIndex = getDataIndexForDate(date);
                          const netBooked = roomType.data.netBooked[dataIndex];
                          const isClosed = isDateClosed(roomType.id, date);
                          
                          return (
                            <div
                              key={dateIndex}
                              className={cn(
                                "w-16 h-8 border-r border-border flex items-center justify-center text-xs",
                                isClosed ? "bg-red-100 text-red-800" : "bg-background"
                              )}
                            >
                              <span className={cn(isClosed && "line-through")}>
                                {netBooked}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Rates Row */}
                    <div className="h-8 border-b border-border">
                      <div className="flex">
                        {calendarDates.map((date, dateIndex) => {
                          const dataIndex = getDataIndexForDate(date);
                          const rate = roomType.data.rates[dataIndex];
                          const isClosed = isDateClosed(roomType.id, date);
                          const isEditing = editingCell?.roomTypeId === roomType.id && 
                                          editingCell?.dateIndex === dateIndex && 
                                          editingCell?.field === 'rates';
                          
                          return (
                            <div
                              key={dateIndex}
                              className={cn(
                                "w-16 h-8 border-r border-border flex items-center justify-center text-xs cursor-pointer",
                                isClosed ? "bg-red-100 text-red-800" : "bg-background hover:bg-muted/50"
                              )}
                              onClick={() => handleCellClick(roomType.id, dateIndex, 'rates')}
                            >
                              {isEditing ? (
                                <Input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleSaveEdit}
                                  className="h-6 w-12 text-xs p-1 text-center border-0 bg-transparent"
                                />
                              ) : (
                                <span className={cn(isClosed && "line-through")}>
                                  {rate}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Bulk Edit Dialog */}
        <Sheet open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
          <SheetContent className="w-[500px] sm:w-[500px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Bulk edit</SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* Room Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Room Type</Label>
                <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((roomType) => (
                      <SelectItem key={roomType.id} value={roomType.id}>
                        {roomType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">From Date</Label>
                  <Input
                    type="date"
                    value={bulkEditData.fromDate}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, fromDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">To Date</Label>
                  <Input
                    type="date"
                    value={bulkEditData.toDate}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, toDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Days of Week */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Days of the Week</Label>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
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

              {/* Room Status */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Room Status</Label>
                <RadioGroup 
                  value={bulkEditData.roomStatus} 
                  onValueChange={(value) => setBulkEditData(prev => ({ ...prev, roomStatus: value }))}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="open" id="open" />
                    <Label htmlFor="open" className="text-sm">Open</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="close" id="close" />
                    <Label htmlFor="close" className="text-sm">Close</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Rooms to Sell */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rooms to sell</Label>
                <Input
                  type="number"
                  placeholder="Number of rooms"
                  value={bulkEditData.roomsToSell}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, roomsToSell: e.target.value }))}
                />
              </div>

              {/* Rate Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rate Type</Label>
                <Select value={bulkEditData.rateType} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, rateType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard Rate">Standard Rate</SelectItem>
                    <SelectItem value="Promo Rate">Promo Rate</SelectItem>
                    <SelectItem value="Weekend Rate">Weekend Rate</SelectItem>
                  </SelectContent>
                </Select>
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
                    placeholder="3750"
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
                  onClick={() => setBulkEditOpen(false)}
                  className="flex-1 text-primary border-primary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

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

              {/* Price */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Price</Label>
                <div className="flex gap-2">
                  <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground border">
                    THB
                  </div>
                  <Input
                    type="number"
                    placeholder="3750"
                    value={bulkEditData.price}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, price: e.target.value }))}
                    className="flex-1"
                  />
                </div>
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
      </div>
    </div>
  );
};

export default Calendar;