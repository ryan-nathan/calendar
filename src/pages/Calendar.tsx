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

        {/* Calendar Grid - Fixed Sidebar with Scrollable Content */}
        <div className="overflow-hidden">
          <div className="flex">
            {/* Fixed Left Sidebar */}
            <div className="w-[220px] flex-shrink-0">
              {/* Month Headers - Empty space for alignment */}
              <div className="h-[41px] mb-4"></div>
              
              {/* Date Headers - Empty space for alignment */}
              <div className="h-[65px] mb-2"></div>
              
              {/* Room Type Names and Bulk Edit Buttons */}
              {roomTypes.map((roomType) => (
                <div key={roomType.id} className="border-b border-border last:border-b-0">
                  <div className="flex items-center justify-between px-4 py-3 border-r border-border">
                    <div className="font-medium text-sm">{roomType.name}</div>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedRoomType(roomType.id)}
                          className="text-primary hover:text-primary-foreground hover:bg-primary"
                        >
                          Bulk edit
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[400px] sm:w-[500px]">
                        <SheetHeader>
                          <SheetTitle>Bulk Edit - {roomType.name}</SheetTitle>
                        </SheetHeader>
                        <div className="py-6 space-y-6">
                          <div className="space-y-2">
                            <Label>Date Range</Label>
                            <div className="flex gap-2">
                              <Input
                                type="date"
                                value={bulkEditData.fromDate}
                                onChange={(e) => setBulkEditData(prev => ({ ...prev, fromDate: e.target.value }))}
                              />
                              <Input
                                type="date"
                                value={bulkEditData.toDate}
                                onChange={(e) => setBulkEditData(prev => ({ ...prev, toDate: e.target.value }))}
                              />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Selected: {formatDateStringRange(bulkEditData.fromDate, bulkEditData.toDate)}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Days of Week</Label>
                            <div className="flex gap-2 flex-wrap">
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                                <Button
                                  key={day}
                                  type="button"
                                  variant={bulkEditData.daysOfWeek.includes(day) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleDayOfWeekToggle(day)}
                                  className="text-xs"
                                >
                                  {day}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Rooms to Sell</Label>
                              <Input
                                type="number"
                                placeholder="8"
                                value={bulkEditData.roomsToSell}
                                onChange={(e) => setBulkEditData(prev => ({ ...prev, roomsToSell: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Price (THB)</Label>
                              <Input
                                type="number"
                                placeholder="3500"
                                value={bulkEditData.price}
                                onChange={(e) => setBulkEditData(prev => ({ ...prev, price: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Room Status</Label>
                            <RadioGroup 
                              value={bulkEditData.roomStatus} 
                              onValueChange={(value) => setBulkEditData(prev => ({ ...prev, roomStatus: value }))}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="open" id="open" />
                                <Label htmlFor="open">Open</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="close" id="close" />
                                <Label htmlFor="close">Close</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <Button onClick={handleBulkEditSave} className="w-full">
                            Apply Changes
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[1240px]">
                {/* Month Headers */}
                <div className="flex mb-4">
                  {septemberDates.length > 0 && (
                    <div className="flex-1 text-center font-medium text-sm py-2 border-b border-border">
                      September 2025
                    </div>
                  )}
                  {octoberDates.length > 0 && (
                    <div className="flex-1 text-center font-medium text-sm py-2 border-b border-border">
                      October 2025
                    </div>
                  )}
                </div>

                {/* Date Headers */}
                <div className="grid grid-cols-31 gap-px mb-2">
                  {calendarDates.map((date, index) => (
                    <div key={index} className="text-center text-xs font-medium py-2 min-w-[40px]">
                      <div className="text-muted-foreground">{getDayName(date)}</div>
                      <div className="mt-1">{getDateNumber(date)}</div>
                    </div>
                  ))}
                </div>

                {/* Calendar Data Rows */}
                {roomTypes.map((roomType) => (
                  <div key={roomType.id} className="border-b border-border last:border-b-0">
                    <div className="grid grid-cols-31 gap-px">
                      {calendarDates.map((date, dateIndex) => {
                        const dataIndex = getDataIndexForDate(date);
                        const roomsToSell = roomType.data.roomsToSell[dataIndex] || 0;
                        const netBooked = roomType.data.netBooked[dataIndex] || 0;
                        const rates = roomType.data.rates[dataIndex] || 0;
                        const isClosed = isDateClosed(roomType.id, date);
                        const isInDrag = isInDragRange(dateIndex, roomType.id);
                        const isEditingRooms = editingCell?.roomTypeId === roomType.id && editingCell?.dateIndex === dateIndex && editingCell?.field === 'roomsToSell';
                        const isEditingRates = editingCell?.roomTypeId === roomType.id && editingCell?.dateIndex === dateIndex && editingCell?.field === 'rates';

                        return (
                          <div 
                            key={dateIndex} 
                            className={cn(
                              "min-w-[40px] border border-border cursor-pointer transition-colors",
                              isClosed ? "bg-red-50 border-red-200" : "bg-background hover:bg-muted/50",
                              isInDrag && "bg-primary/20 border-primary"
                            )}
                            onMouseDown={() => handleMouseDown(roomType.id, dateIndex)}
                            onMouseMove={() => handleMouseMove(dateIndex)}
                            onMouseUp={handleMouseUp}
                          >
                            {/* Rooms to Sell Row */}
                            <div 
                              className="px-2 py-1 text-xs text-center border-b border-border/50 min-h-[24px] flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellClick(roomType.id, dateIndex, 'roomsToSell');
                              }}
                            >
                              {isEditingRooms ? (
                                <Input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleSaveEdit}
                                  className="h-6 text-xs text-center p-0 border-0"
                                />
                              ) : (
                                <span className={cn(
                                  "font-medium",
                                  roomsToSell <= netBooked ? "text-red-600" : "text-foreground"
                                )}>
                                  {roomsToSell}
                                </span>
                              )}
                            </div>
                            
                            {/* Net Booked Row */}
                            <div className="px-2 py-1 text-xs text-center text-muted-foreground border-b border-border/50 min-h-[24px] flex items-center justify-center">
                              {netBooked}
                            </div>
                            
                            {/* Rate Row */}
                            <div 
                              className="px-2 py-1 text-xs text-center min-h-[24px] flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellClick(roomType.id, dateIndex, 'rates');
                              }}
                            >
                              {isEditingRates ? (
                                <Input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleSaveEdit}
                                  className="h-6 text-xs text-center p-0 border-0"
                                />
                              ) : (
                                <span className="font-medium">{rates}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Bulk Edit Dialog (for drag selections) */}
      <Sheet open={simpleBulkEditOpen} onOpenChange={setSimpleBulkEditOpen}>
        <SheetContent className="w-[400px] sm:w-[500px]">
          <SheetHeader>
            <SheetTitle>Bulk Edit - {getCurrentRoomType()?.name}</SheetTitle>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            {bulkEditSelection.startDate && bulkEditSelection.endDate && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Selected Date Range</h4>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(bulkEditSelection.startDate, bulkEditSelection.endDate)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rooms to Sell</Label>
                <Input
                  type="number"
                  placeholder="8"
                  value={bulkEditData.roomsToSell}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, roomsToSell: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Price (THB)</Label>
                <Input
                  type="number"
                  placeholder="3500"
                  value={bulkEditData.price}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Room Status</Label>
              <RadioGroup 
                value={bulkEditData.roomStatus} 
                onValueChange={(value) => setBulkEditData(prev => ({ ...prev, roomStatus: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="open" id="simple-open" />
                  <Label htmlFor="simple-open">Open</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="close" id="simple-close" />
                  <Label htmlFor="simple-close">Close</Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handleBulkEditSave} className="w-full">
              Apply Changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Calendar;