import { useState, useRef, useEffect, useCallback } from "react";
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
  const [monthsToShow, setMonthsToShow] = useState(2); // Start with 2 months
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

  // Generate calendar dates from current start date (based on monthsToShow)
  const generateCalendarDates = () => {
    const dates = [];
    let currentDate = new Date(currentStartDate);
    
    // Calculate approximately 31 days per month
    const totalDays = monthsToShow * 31;
    
    for (let i = 0; i < totalDays; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const calendarDates = generateCalendarDates();
  
  // Generate date range string for display
  const generateDateRangeString = () => {
    const endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + (monthsToShow * 31) - 1);
    
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
  const groupDatesByMonth = () => {
    const monthGroups: { [key: string]: Date[] } = {};
    
    calendarDates.forEach(date => {
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(date);
    });
    
    return monthGroups;
  };
  
  const monthGroups = groupDatesByMonth();
  
  // For compatibility with existing code
  const septemberDates = calendarDates.filter(date => date.getMonth() === 8);
  const octoberDates = calendarDates.filter(date => date.getMonth() === 9);
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

  // Lazy loading scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
    
    // Load more months when 80% scrolled
    if (scrollPercentage > 0.8) {
      setMonthsToShow(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

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
        <div className="overflow-hidden border border-calendar-grid-border rounded-lg">
          <div className="flex">
            {/* Fixed left sidebar */}
            <div className="w-[220px] flex-shrink-0 border-r border-calendar-grid-border">
              {/* Month Headers - Left side empty */}
              <div className="h-8 bg-muted/50 border-b border-calendar-grid-border"></div>
              
              {/* Date Headers - Empty space for alignment */}
              <div className="h-12 bg-muted/50 border-b border-calendar-grid-border flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handlePreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Room type labels */}
              {roomTypes.map((roomType) => (
                <div key={roomType.id}>
                  {/* Room Type Label */}
                  <div className="p-3 bg-gray-50 border-b border-gray-200 font-medium text-sm h-12 flex items-center">
                    {roomType.name}
                    {hasClosedDatesForRoom(roomType.id) && (
                      <div className="text-xs text-red-600 ml-2">
                        ({Object.values(closedDates[roomType.id] || {}).filter(Boolean).length} closed)
                      </div>
                    )}
                  </div>
                  
                  {/* Rooms to Sell Label */}
                  <div className="p-3 bg-gray-50 border-b border-gray-200 text-sm font-medium h-10 flex items-center">
                    Rooms to Sell
                  </div>
                  
                  {/* Standard Rate Label */}
                  <div className="p-3 bg-gray-50 border-b border-gray-200 text-sm font-medium h-10 flex items-center">
                    Standard Rate
                  </div>
                </div>
              ))}
            </div>

            {/* Horizontally scrollable calendar grid */}
            <div className="overflow-x-auto flex-1" ref={scrollContainerRef}>
              <div style={{ width: `${calendarDates.length * 64}px` }}>
                {/* Month Headers */}
                <div className="h-8 flex bg-muted/50 border-b border-calendar-grid-border">
                  {Object.entries(monthGroups).map(([monthKey, dates], monthIndex) => {
                    const monthDate = dates[0];
                    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    const bgColor = monthIndex % 2 === 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-green-50 border-green-200 text-green-800';
                    
                    return (
                      <div 
                        key={monthKey}
                        className={`${bgColor} border-r font-semibold text-sm px-2 py-1 text-center flex items-center justify-center`}
                        style={{ width: `${dates.length * 64}px` }}
                      >
                        {monthName}
                      </div>
                    );
                  })}
                </div>

                {/* Date Headers */}
                <div className="h-12 flex bg-muted/50 border-b border-calendar-grid-border">
                  {calendarDates.map((date, index) => (
                    <div key={index} className="w-16 p-1 text-center text-xs text-muted-foreground border-r border-calendar-grid-border flex flex-col items-center justify-center">
                      <div className="font-medium">{getDayName(date)}</div>
                      <div className="mt-1">{getDateNumber(date)}</div>
                    </div>
                  ))}
                </div>

                {/* Room Type Data Rows */}
                {roomTypes.map((roomType) => {
                  const segments = createDateSegments(roomType.id, calendarDates);
                  
                  return (
                    <div key={roomType.id}>
                      {/* Room Status Row */}
                      <div className="h-12 flex border-b border-gray-200">
                        {segments.map((segment, segmentIndex) => (
                          <div 
                            key={`status-${segmentIndex}`}
                            className={`border-r border-gray-300 px-2 py-1 text-xs text-center cursor-pointer select-none flex items-center justify-center ${
                              segment.type === 'closed' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            } ${
                              segment.dates.some((_, dateIndex) => 
                                isInDragRange(segment.startIndex + dateIndex, roomType.id)
                              ) ? 'ring-2 ring-blue-500' : ''
                            }`}
                            style={{ width: `${segment.dates.length * 64}px` }}
                            onMouseDown={() => handleMouseDown(roomType.id, segment.startIndex)}
                            onMouseMove={() => handleMouseMove(segment.startIndex)}
                            onMouseUp={handleMouseUp}
                          >
                            {segment.type === 'closed' ? 'CLOSED' : 'OPEN'}
                          </div>
                        ))}
                      </div>

                      {/* Rooms to Sell Row */}
                      <div className="h-10 flex border-b border-gray-200">
                        {calendarDates.map((date, index) => {
                          const dataIndex = getDataIndexForDate(date);
                          const roomsToSell = roomType.data.roomsToSell[dataIndex] || 0;
                          const isEditing = editingCell?.roomTypeId === roomType.id && 
                                           editingCell?.dateIndex === index && 
                                           editingCell?.field === 'roomsToSell';
                          
                          return (
                            <div 
                              key={index} 
                              className={`w-16 border-r border-gray-300 px-2 py-1 text-sm text-center cursor-pointer hover:bg-gray-50 flex items-center justify-center ${
                                isDateClosed(roomType.id, date) ? 'bg-red-50 text-red-400' : ''
                              } ${
                                isInDragRange(index, roomType.id) ? 'ring-2 ring-blue-500' : ''
                              }`}
                              onClick={() => handleCellClick(roomType.id, index, 'roomsToSell')}
                            >
                              {isEditing ? (
                                <Input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleSaveEdit}
                                  className="h-6 text-center p-0 border-none text-xs"
                                  type="number"
                                  min="0"
                                />
                              ) : (
                                roomsToSell
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Rates Row */}
                      <div className="h-10 flex border-b border-gray-200">
                        {calendarDates.map((date, index) => {
                          const dataIndex = getDataIndexForDate(date);
                          const rate = roomType.data.rates[dataIndex] || 0;
                          const isEditing = editingCell?.roomTypeId === roomType.id && 
                                           editingCell?.dateIndex === index && 
                                           editingCell?.field === 'rates';
                          
                          return (
                            <div 
                              key={index} 
                              className={`w-16 border-r border-gray-300 px-2 py-1 text-sm text-center cursor-pointer hover:bg-gray-50 flex items-center justify-center ${
                                isDateClosed(roomType.id, date) ? 'bg-red-50 text-red-400' : ''
                              } ${
                                isInDragRange(index, roomType.id) ? 'ring-2 ring-blue-500' : ''
                              }`}
                              onClick={() => handleCellClick(roomType.id, index, 'rates')}
                            >
                              {isEditing ? (
                                <Input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleSaveEdit}
                                  className="h-6 text-center p-0 border-none text-xs"
                                  type="number"
                                  min="0"
                                />
                              ) : (
                                `₹${rate}`
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Edit Panel - Fixed to the right */}
        <Sheet open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="fixed bottom-6 right-6 shadow-lg z-50">
              Bulk Edit
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
                    <Button
                      key={day}
                      type="button"
                      variant={bulkEditData.daysOfWeek.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDayOfWeekToggle(day)}
                      className="text-xs px-3 py-1"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Room Type */}
              <div>
                <Label className="text-sm font-medium">Room Type</Label>
                <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map(roomType => (
                      <SelectItem key={roomType.id} value={roomType.id}>
                        {roomType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rooms to Sell */}
              <div>
                <Label htmlFor="rooms-to-sell" className="text-sm font-medium">Rooms to sell</Label>
                <Input
                  id="rooms-to-sell"
                  type="number"
                  placeholder="Enter number of rooms"
                  value={bulkEditData.roomsToSell}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, roomsToSell: e.target.value }))}
                  className="mt-1"
                  min="0"
                />
              </div>

              {/* Rate Type */}
              <div>
                <Label className="text-sm font-medium">Rate Type</Label>
                <Select value={bulkEditData.rateType} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, rateType: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard Rate">Standard Rate</SelectItem>
                    <SelectItem value="Weekend Rate">Weekend Rate</SelectItem>
                    <SelectItem value="Holiday Rate">Holiday Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div>
                <Label htmlFor="price" className="text-sm font-medium">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter price"
                  value={bulkEditData.price}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1"
                  min="0"
                />
              </div>

              {/* Room Status */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Room Status</Label>
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleBulkEditSave} className="flex-1">
                  Save changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBulkEditOpen(false);
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