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
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";

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

  // Generate calendar dates from current start date (31 days total)
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
  
  // Get the month headers with their positions
  const getMonthHeaders = () => {
    const headers: Array<{month: string, year: string, position: number}> = [];
    let currentMonth = -1;
    
    calendarDates.forEach((date, index) => {
      if (date.getMonth() !== currentMonth) {
        currentMonth = date.getMonth();
        headers.push({
          month: date.toLocaleDateString('en-US', { month: 'long' }),
          year: date.toLocaleDateString('en-US', { year: 'numeric' }),
          position: (index / 31) * 100
        });
      }
    });
    
    return headers;
  };

  const monthHeaders = getMonthHeaders();

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
      
      if (startIndex === endIndex) {
        const date = calendarDates[startIndex];
        if (date) {
          toggleDateStatus(currentDragRoomType, date);
        }
      } else {
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
    let fromDate: Date, toDate: Date;
    
    if (bulkEditSelection.startDate && bulkEditSelection.endDate) {
      fromDate = bulkEditSelection.startDate;
      toDate = bulkEditSelection.endDate;
    } else {
      fromDate = new Date(bulkEditData.fromDate);
      toDate = new Date(bulkEditData.toDate);
    }
    
    const affectedDates = calendarDates.filter(date => {
      return date >= fromDate && date <= toDate;
    });
    
    if (affectedDates.length === 0) return;
    
    const roomTypeId = bulkEditSelection.roomTypeId || selectedRoomType;
    if (!roomTypeId) return;
    
    setRoomTypes(prev => prev.map(roomType => {
      if (roomType.id === roomTypeId) {
        const newData = { ...roomType.data };
        
        affectedDates.forEach(date => {
          const dataIndex = getDataIndexForDate(date);
          
          if (bulkEditData.roomsToSell) {
            const roomsToSell = parseInt(bulkEditData.roomsToSell);
            if (!isNaN(roomsToSell) && roomsToSell >= 0) {
              newData.roomsToSell = [...newData.roomsToSell];
              newData.roomsToSell[dataIndex] = roomsToSell;
            }
          }
          
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
    
    setBulkEditOpen(false);
    setSimpleBulkEditOpen(false);
    setBulkEditSelection({ startDate: null, endDate: null, roomTypeId: null });
    setBulkEditData(prev => ({ ...prev, roomsToSell: "", price: "" }));
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-GB', formatOptions)} - ${endDate.toLocaleDateString('en-GB', formatOptions)}`;
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
            <DateRangePicker 
              date={dateRangeSelection}
              onDateChange={handleDateRangeChange}
            />
            
            <div className="flex items-center gap-2">
              <Checkbox id="restrictions" />
              <Label htmlFor="restrictions" className="text-sm">Show restrictions</Label>
            </div>
            
            <div className="px-3 py-1 bg-calendar-selected-bg text-calendar-selected-text rounded text-sm">
              {selectedDateRange}
            </div>
          </div>
        </div>

        {/* Calendar Grid - Horizontal Scroll Container */}
        <div className="overflow-hidden">
          <div className="min-w-auto">
            {/* Month Headers */}
            <div className="grid grid-cols-[220px_1fr] mb-4">
              <div></div>
              <div className="relative">
                {monthHeaders.map((header, index) => (
                  <h2 
                    key={index} 
                    className="absolute text-sm font-medium" 
                    style={{ left: `${header.position}%` }}
                  >
                    {header.month} {header.year}
                  </h2>
                ))}
                
                <div className="absolute right-0 flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
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
              {roomTypes.map((roomType, roomIndex) => (
                <div key={roomType.id} className={cn(
                  "border-x border-b border-calendar-grid-border",
                  roomIndex === roomTypes.length - 1 && "rounded-b-lg"
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
                          if (!bulkEditSelection.startDate || !bulkEditSelection.endDate) {
                            setBulkEditSelection({
                              startDate: calendarDates[0],
                              endDate: calendarDates[calendarDates.length - 1],
                              roomTypeId: roomType.id,
                            });
                          }
                        }
                      }}>
                        <SheetTrigger asChild>
                          <Button variant="default" size="sm">
                            Bulk edit
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[450px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Bulk edit</SheetTitle>
                          </SheetHeader>
                          
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>

                  {/* Room Type Data Rows */}
                  <div className="grid grid-cols-[220px_1fr]">
                    <div className="border-r border-calendar-grid-border bg-calendar-row-header">
                      <div className="p-2 text-xs text-muted-foreground">
                        <div>Rooms to sell</div>
                        <div>Net booked</div>
                        <div>Rate (THB)</div>
                      </div>
                    </div>
                    <div className="bg-calendar-row-bg">
                      <div className="grid grid-cols-31" onMouseUp={handleMouseUp}>
                        {calendarDates.map((date, index) => {
                          const dataIndex = getDataIndexForDate(date);
                          const roomsToSell = roomType.data.roomsToSell[dataIndex];
                          const netBooked = roomType.data.netBooked[dataIndex];
                          const rate = roomType.data.rates[dataIndex];
                          const isClosed = isDateClosed(roomType.id, date);
                          const isInDrag = isInDragRange(index, roomType.id);
                          const dayName = getDayName(date);
                          const isSaturday = dayName === 'Sat';
                          
                          return (
                            <div
                              key={index}
                              className={cn(
                                "border-r border-calendar-grid-border last:border-r-0 relative cursor-pointer select-none",
                                isClosed && "bg-calendar-closed-bg",
                                isInDrag && "bg-calendar-drag-bg",
                                isSaturday && "after:absolute after:inset-y-0 after:-right-px after:w-0.5 after:bg-blue-500 after:z-10"
                              )}
                              onMouseDown={() => handleMouseDown(roomType.id, index)}
                              onMouseMove={() => handleMouseMove(index)}
                            >
                              {/* Rooms to sell */}
                              <div 
                                className="text-center border-b border-calendar-grid-border/50 p-1 h-8 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-calendar-cell-hover"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCellClick(roomType.id, index, 'roomsToSell');
                                }}
                              >
                                {editingCell?.roomTypeId === roomType.id && editingCell?.dateIndex === index && editingCell?.field === 'roomsToSell' ? (
                                  <Input
                                    ref={inputRef}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleSaveEdit}
                                    className="h-6 text-xs text-center border-0 bg-transparent p-0 focus:ring-0"
                                  />
                                ) : (
                                  roomsToSell
                                )}
                              </div>
                              
                              {/* Net booked */}
                              <div className="text-center border-b border-calendar-grid-border/50 p-1 h-8 flex items-center justify-center text-xs">
                                {netBooked}
                              </div>
                              
                              {/* Rate */}
                              <div 
                                className="text-center flex flex-col items-center justify-center h-8 cursor-pointer hover:bg-calendar-cell-hover p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCellClick(roomType.id, index, 'rates');
                                }}
                              >
                                {editingCell?.roomTypeId === roomType.id && editingCell?.dateIndex === index && editingCell?.field === 'rates' ? (
                                  <Input
                                    ref={inputRef}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleSaveEdit}
                                    className="h-6 text-xs text-center border-0 bg-transparent p-0 focus:ring-0"
                                  />
                                ) : (
                                  <>
                                    <span className="text-[10px] text-muted-foreground -mb-px">THB</span>
                                    <span className="text-xs font-medium">{rate}</span>
                                  </>
                                )}
                              </div>
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
      </div>

      {/* Simple Bulk Edit Dialog */}
      <Sheet open={simpleBulkEditOpen} onOpenChange={setSimpleBulkEditOpen}>
        <SheetContent className="w-[400px]">
          <SheetHeader>
            <SheetTitle>Bulk Edit</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{getCurrentRoomType()?.name}</h2>
              <p className="text-sm text-muted-foreground">Standard Rate</p>
              {bulkEditSelection.startDate && bulkEditSelection.endDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDateRange(bulkEditSelection.startDate, bulkEditSelection.endDate)}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <RadioGroup 
                value={bulkEditData.roomStatus} 
                onValueChange={(value) => setBulkEditData(prev => ({ ...prev, roomStatus: value }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="open" id="bulk-open" />
                  <Label htmlFor="bulk-open">Open</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="close" id="bulk-close" />
                  <Label htmlFor="bulk-close">Close</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Price</Label>
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

            <div className="space-y-2">
              <Label>Rooms to sell</Label>
              <Input
                type="number"
                placeholder="Number of rooms"
                value={bulkEditData.roomsToSell}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, roomsToSell: e.target.value }))}
              />
            </div>

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
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Calendar;
