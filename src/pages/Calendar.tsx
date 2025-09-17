import { useState } from "react";
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

// Base date for data arrays (original start date)
const BASE_DATA_DATE = new Date(2025, 8, 16); // Sept 16, 2025

// Sample data - in real app this would come from API
const roomTypes = [
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
  const [currentStartDate, setCurrentStartDate] = useState(new Date(2025, 8, 16)); // Sept 16, 2025
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState("superior");
  const [closedDates, setClosedDates] = useState<{[roomTypeId: string]: {[dateKey: string]: boolean}}>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [currentDragRoomType, setCurrentDragRoomType] = useState<string | null>(null);
  const [bulkEditData, setBulkEditData] = useState({
    fromDate: "2025-09-16",
    toDate: "2025-10-16",
    daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    roomsToSell: "",
    rateType: "Standard Rate 30% RB",
    price: "",
    roomStatus: "open",
    restrictions: ""
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
        // For drag selection, toggle all dates in the range
        const dateKeys: string[] = [];
        for (let i = startIndex; i <= endIndex; i++) {
          const date = calendarDates[i];
          if (date) {
            dateKeys.push(getDateKey(date));
          }
        }
        
        setClosedDates(prev => {
          const newClosedDates = { ...prev };
          if (!newClosedDates[currentDragRoomType]) {
            newClosedDates[currentDragRoomType] = {};
          }
          
          // Determine if we should close or open based on the first date in range
          const firstDateKey = dateKeys[0];
          const shouldClose = !newClosedDates[currentDragRoomType][firstDateKey];
          
          dateKeys.forEach(dateKey => {
            newClosedDates[currentDragRoomType][dateKey] = shouldClose;
          });
          
          return newClosedDates;
        });
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
        <div className="overflow-hidden">
          <div className="min-w-auto">
          {/* Month Headers */}
          <div className="grid grid-cols-[200px_1fr] mb-4">
            <div></div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-8">
                {calendarDates.slice(0, 15).some((date, index) => index === 0 || date.getMonth() !== calendarDates[index - 1]?.getMonth()) && (
                  <h2 className="text-xl font-semibold">
                    {calendarDates[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                )}
                {calendarDates.slice(15).some((date, index) => calendarDates[14 + index]?.getMonth() !== calendarDates[14 + index - 1]?.getMonth()) && (
                  <h2 className="text-xl font-semibold">
                    {calendarDates.find((date, index) => index > 14 && date.getMonth() !== calendarDates[index - 1]?.getMonth())?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Header - Days and Dates */}
          <div className="grid grid-cols-[200px_1fr] border border-calendar-grid-border rounded-t-lg overflow-hidden">
            <div className="bg-muted/50 border-r border-calendar-grid-border"></div>
            <div className="bg-muted/50">
              <div className="grid grid-cols-31 h-full">
                {calendarDates.map((date, index) => (
                  <div key={index} className="border-r border-calendar-grid-border last:border-r-0">
                    <div className="p-1 text-center">
                      <div className="text-xs text-muted-foreground">{getDayName(date)}</div>
                      <div className="text-xs font-medium">{getDateNumber(date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Room Types */}
          <div className="space-y-0">
            {roomTypes.map((roomType, roomIndex) => (
              <div key={roomType.id} className="border-x border-b border-calendar-grid-border">
                {/* Room Type Header */}
                <div className="grid grid-cols-[200px_1fr] bg-muted/30 border-b border-calendar-grid-border">
                  <div className="p-3 border-r border-calendar-grid-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{roomType.name}</h3>
                    </div>
                  </div>
                  <div className="p-3 flex justify-end">
                    <Sheet open={bulkEditOpen && selectedRoomType === roomType.id} onOpenChange={(open) => {
                      setBulkEditOpen(open);
                      if (open) setSelectedRoomType(roomType.id);
                    }}>
                      <SheetTrigger asChild>
                        <Button variant="default" size="sm">
                          Bulk edit
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[400px] sm:w-[400px]">
                        <SheetHeader>
                          <div className="flex items-center justify-between">
                            <SheetTitle>Bulk edit</SheetTitle>
                            <Button variant="ghost" size="sm" onClick={() => setBulkEditOpen(false)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </SheetHeader>
                        
                        <div className="mt-6 space-y-6">
                          {/* Date Range */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="from-date">From:</Label>
                              <Input
                                id="from-date"
                                type="date"
                                value={bulkEditData.fromDate}
                                onChange={(e) => setBulkEditData(prev => ({ ...prev, fromDate: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="to-date">Up to and including:</Label>
                              <Input
                                id="to-date"
                                type="date"
                                value={bulkEditData.toDate}
                                onChange={(e) => setBulkEditData(prev => ({ ...prev, toDate: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* Days of week */}
                          <div>
                            <Label className="text-sm font-medium mb-3 block">
                              Which days of the week do you want to apply changes to?
                            </Label>
                            <div className="grid grid-cols-4 gap-2">
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={day}
                                    checked={bulkEditData.daysOfWeek.includes(day)}
                                    onCheckedChange={() => handleDayOfWeekToggle(day)}
                                  />
                                  <Label htmlFor={day} className="text-sm">{day}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Room Type Tabs */}
                          <div className="border-b border-calendar-grid-border">
                            <div className="flex space-x-4">
                              <button className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary">
                                Superior
                              </button>
                              <button className="px-4 py-2 text-sm font-medium text-muted-foreground">
                                Multiple room types
                              </button>
                            </div>
                          </div>

                          {/* Collapsible sections */}
                          <Collapsible defaultOpen>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg">
                              <div>
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
                                />
                                <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                                  Room(s)
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Changes will be made to the date range: 16 Sept 2025 - 16 Oct 2025
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm">Save changes</Button>
                                <Button variant="outline" size="sm">Cancel</Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg">
                              <div>
                                <h4 className="text-lg font-semibold">Prices</h4>
                                <p className="text-sm text-muted-foreground">Edit the prices of any rate plans for this room</p>
                              </div>
                              <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-4 space-y-4">
                              <div className="flex gap-2">
                                <Select value={bulkEditData.rateType}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Standard Rate 30% RB">Standard Rate 30% RB</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                                  THB
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Changes will be made to the date range: 16 Sept 2025 - 16 Oct 2025
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm">Save changes</Button>
                                <Button variant="outline" size="sm">Cancel</Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg">
                              <div>
                                <h4 className="text-lg font-semibold">Room status</h4>
                                <p className="text-sm text-muted-foreground">Open or close this room</p>
                              </div>
                              <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-4 space-y-4">
                              <RadioGroup value={bulkEditData.roomStatus} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, roomStatus: value }))}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="open" id="open" />
                                  <Label htmlFor="open">Open room</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="close" id="close" />
                                  <Label htmlFor="close">Close room</Label>
                                </div>
                              </RadioGroup>
                              <p className="text-xs text-muted-foreground">
                                Changes will be made to the date range: 16 Sept 2025 - 16 Oct 2025
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm">Save changes</Button>
                                <Button variant="outline" size="sm">Cancel</Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg">
                              <div>
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
                                Changes will be made to the date range: 16 Sept 2025 - 16 Oct 2025
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm">Save changes</Button>
                                <Button variant="outline" size="sm">Cancel</Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                {/* Room Status Row */}
                <div className="grid grid-cols-[200px_1fr] border-b border-calendar-grid-border">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <span className="text-sm font-medium">Room status</span>
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
                            className="absolute top-3 bottom-3 bg-green-500 text-white rounded-full flex items-center justify-start pl-3"
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
                            className="absolute top-3 bottom-3 bg-red-500 text-white rounded-full flex items-center justify-start pl-3 z-20"
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
                    <div className="grid grid-cols-31 h-full relative z-10">
                      {calendarDates.map((date, index) => {
                        const inDragRange = isInDragRange(index, roomType.id);
                        return (
                          <div 
                            key={`${roomType.id}-status-${index}`} 
                            className={`border-r border-calendar-grid-border last:border-r-0 cursor-pointer flex items-center justify-center ${inDragRange ? 'bg-blue-200' : ''}`}
                            onMouseDown={() => handleMouseDown(roomType.id, index)}
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
                <div className="grid grid-cols-[200px_1fr] border-b border-calendar-grid-border">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <span className="text-sm font-medium">Rooms to sell</span>
                  </div>
                  <div className="h-12">
                    <div className="grid grid-cols-31 h-full">
                      {calendarDates.map((date, index) => {
                        const dataIndex = getDataIndexForDate(date);
                        const isClosed = isDateClosed(roomType.id, date);
                        return (
                          <div key={`${roomType.id}-rooms-${index}`} className={cn(
                            "border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center text-sm font-medium hover:bg-calendar-cell-hover cursor-pointer",
                            isClosed && "bg-red-200"
                          )}>
                            {roomType.data.roomsToSell[dataIndex]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Net Booked Row */}
                <div className="grid grid-cols-[200px_1fr] border-b border-calendar-grid-border">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <span className="text-sm font-medium">Net booked</span>
                  </div>
                  <div className="h-12">
                    <div className="grid grid-cols-31 h-full">
                      {calendarDates.map((date, index) => {
                        const dataIndex = getDataIndexForDate(date);
                        const bookedCount = roomType.data.netBooked[dataIndex];
                        const isClosed = isDateClosed(roomType.id, date);
                        return (
                          <div key={`${roomType.id}-booked-${index}`} className={cn(
                            "border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center",
                            isClosed && "bg-red-200"
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
                <div className="grid grid-cols-[200px_1fr] border-b border-calendar-grid-border last:border-b-0">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <span className="text-sm font-medium">Standard Rate</span>
                  </div>
                  <div className="h-12">
                    <div className="grid grid-cols-31 h-full">
                      {calendarDates.map((date, index) => {
                        const dataIndex = getDataIndexForDate(date);
                        const isClosed = isDateClosed(roomType.id, date);
                        return (
                          <div key={`${roomType.id}-rate-${index}`} className={cn(
                            "border-r border-calendar-grid-border last:border-r-0 flex flex-col items-center justify-center hover:bg-calendar-cell-hover cursor-pointer",
                            isClosed && "bg-red-200"
                          )}>
                            <span className="text-[10px] text-muted-foreground">THB</span>
                            <span className="text-xs font-medium">{roomType.data.rates[dataIndex]}</span>
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
    </div>
  );
};

export default Calendar;