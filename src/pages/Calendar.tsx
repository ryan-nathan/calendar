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

const Calendar = () => {
  const [currentStartDate, setCurrentStartDate] = useState(new Date(2025, 8, 16)); // Sept 16, 2025
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState("superior");
  const [stickyMonths, setStickyMonths] = useState<{[key: string]: { isSticky: boolean, offset: number }}>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const monthHeadersRef = useRef<{[key: string]: HTMLDivElement | null}>({});
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

  // Get unique months from calendar dates
  const getMonthsInView = () => {
    const months = new Map();
    calendarDates.forEach((date, index) => {
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!months.has(monthKey)) {
        months.set(monthKey, {
          name: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          firstDayIndex: index,
          date: date
        });
      }
    });
    return Array.from(months.values());
  };

  const monthsInView = getMonthsInView();

  // Calculate sticky positions based on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const sidebarWidth = 200; // Width of the sidebar
      const cellWidth = 48; // Width of each date cell
      
      const newStickyMonths: {[key: string]: { isSticky: boolean, offset: number }} = {};
      
      monthsInView.forEach((month) => {
        const monthStartPosition = month.firstDayIndex * cellWidth;
        const monthKey = `${month.date.getFullYear()}-${month.date.getMonth()}`;
        
        // Check if month should be sticky
        const shouldBeSticky = scrollLeft >= monthStartPosition - sidebarWidth;
        
        // Calculate offset for pushing effect
        let offset = 0;
        if (shouldBeSticky) {
          // Find next month
          const nextMonthIndex = monthsInView.findIndex(m => 
            `${m.date.getFullYear()}-${m.date.getMonth()}` === monthKey
          ) + 1;
          
          if (nextMonthIndex < monthsInView.length) {
            const nextMonth = monthsInView[nextMonthIndex];
            const nextMonthStartPosition = nextMonth.firstDayIndex * cellWidth;
            const currentHeaderRight = scrollLeft + sidebarWidth + 200; // Header width
            
            if (currentHeaderRight > nextMonthStartPosition) {
              offset = nextMonthStartPosition - (scrollLeft + sidebarWidth + 200);
            }
          }
        }
        
        newStickyMonths[monthKey] = {
          isSticky: shouldBeSticky,
          offset: offset
        };
      });
      
      setStickyMonths(newStickyMonths);
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial calculation
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [monthsInView]);
  
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
        <div ref={scrollContainerRef} className="overflow-x-auto relative">
          <div className="min-w-auto">
          
          {/* Sticky Month Headers */}
          <div className="relative">
            {monthsInView.map((month) => {
              const monthKey = `${month.date.getFullYear()}-${month.date.getMonth()}`;
              const stickyData = stickyMonths[monthKey];
              
              if (!stickyData?.isSticky) return null;
              
              return (
                <div
                  key={monthKey}
                  ref={(el) => monthHeadersRef.current[monthKey] = el}
                  className="absolute top-0 left-0 z-10 bg-background border border-calendar-grid-border rounded-md px-4 py-2 shadow-sm"
                  style={{
                    left: `200px`, // After sidebar
                    transform: `translateX(${stickyData.offset}px)`,
                    transition: 'transform 0.1s ease-out'
                  }}
                >
                  <h2 className="text-lg font-semibold whitespace-nowrap">
                    {month.name}
                  </h2>
                </div>
              );
            })}
          </div>

          {/* Month Headers */}
          <div className="grid grid-cols-[200px_1fr] mb-4">
            <div></div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-8">
                {monthsInView.map((month) => (
                  <h2 key={`${month.date.getFullYear()}-${month.date.getMonth()}`} className="text-xl font-semibold opacity-20">
                    {month.name}
                  </h2>
                ))}
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
                    <div className="mt-1">
                      <span className="inline-block px-2 py-1 bg-calendar-bookable text-calendar-bookable-foreground text-xs rounded">
                        Bookable
                      </span>
                    </div>
                  </div>
                  <div className="h-12">
                    <div className="grid grid-cols-31 h-full">
                      {calendarDates.map((date, index) => (
                        <div key={`${roomType.id}-status-${index}`} className="border-r border-calendar-grid-border last:border-r-0 bg-calendar-bookable hover:bg-calendar-bookable/80 cursor-pointer"></div>
                      ))}
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
                      {calendarDates.map((date, index) => (
                        <div key={`${roomType.id}-rooms-${index}`} className="border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center text-sm font-medium hover:bg-calendar-cell-hover cursor-pointer">
                          {roomType.data.roomsToSell[index]}
                        </div>
                      ))}
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
                      {calendarDates.map((date, index) => (
                        <div key={`${roomType.id}-booked-${index}`} className="border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center">
                          {roomType.data.netBooked[index] > 0 && (
                            <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {roomType.data.netBooked[index]}
                            </div>
                          )}
                        </div>
                      ))}
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
                      {calendarDates.map((date, index) => (
                        <div key={`${roomType.id}-rate-${index}`} className="border-r border-calendar-grid-border last:border-r-0 flex flex-col items-center justify-center hover:bg-calendar-cell-hover cursor-pointer">
                          <span className="text-[10px] text-muted-foreground">THB</span>
                          <span className="text-xs font-medium">{roomType.data.rates[index]}</span>
                        </div>
                      ))}
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