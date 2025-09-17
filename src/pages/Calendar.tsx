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

// Sample data - in real app this would come from API
const roomTypes = [
  {
    id: "superior",
    name: "Superior Room",
    rooms: Array.from({ length: 31 }, (_, i) => ({
      date: new Date(2025, 8, 16 + i), // Sept 16 onwards
      roomsToSell: i < 15 ? 8 : (i < 20 ? 7 : (i < 25 ? 5 : 4)),
      netBooked: i < 5 ? 0 : (i < 10 ? 1 : (i < 15 ? 2 : (i < 20 ? 1 : 3))),
      rate: 3500,
      status: "bookable" as const,
      currency: "THB"
    }))
  },
  {
    id: "deluxe-balcony",
    name: "Deluxe Room with Balcony",
    rooms: Array.from({ length: 31 }, (_, i) => ({
      date: new Date(2025, 8, 16 + i),
      roomsToSell: i < 15 ? 7 : (i < 20 ? 6 : (i < 25 ? 3 : 1)),
      netBooked: i < 5 ? 0 : (i < 10 ? 1 : (i < 15 ? 2 : (i < 20 ? 2 : 2))),
      rate: 3750,
      status: "bookable" as const,
      currency: "THB"
    }))
  },
  {
    id: "deluxe-oasis",
    name: "Deluxe Oasis Ground Floor",
    rooms: Array.from({ length: 31 }, (_, i) => ({
      date: new Date(2025, 8, 16 + i),
      roomsToSell: i < 15 ? 9 : (i < 20 ? 8 : (i < 25 ? 6 : 9)),
      netBooked: i < 5 ? 1 : (i < 10 ? 4 : (i < 15 ? 4 : (i < 20 ? 6 : 1))),
      rate: 4100,
      status: "bookable" as const,
      currency: "THB"
    }))
  }
];

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Calendar = () => {
  const [selectedDateRange, setSelectedDateRange] = useState("2025-09-16 — 2025-10-16");
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState("superior");
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

  // Generate calendar data for September and October 2025
  const generateCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Make Monday = 0
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const septemberDays = generateCalendarDays(2025, 8); // September 2025
  const octoberDays = generateCalendarDays(2025, 9); // October 2025

  const handleDayOfWeekToggle = (day: string) => {
    setBulkEditData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
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

        {/* Calendar Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-8">
              <h2 className="text-xl font-semibold">September 2025</h2>
              <h2 className="text-xl font-semibold">October 2025</h2>
            </div>
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Header */}
          <div className="grid grid-cols-14 gap-0 border border-calendar-grid-border rounded-lg overflow-hidden">
            {/* Month headers */}
            <div className="col-span-7 grid grid-cols-7 bg-muted/50">
              {dayNames.map(day => (
                <div key={`sept-${day}`} className="p-2 text-xs font-medium text-center border-r border-calendar-grid-border last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="col-span-7 grid grid-cols-7 bg-muted/50">
              {dayNames.map(day => (
                <div key={`oct-${day}`} className="p-2 text-xs font-medium text-center border-r border-calendar-grid-border last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Date numbers row */}
          <div className="grid grid-cols-14 gap-0 border-x border-b border-calendar-grid-border">
            <div className="col-span-7 grid grid-cols-7">
              {septemberDays.map((day, index) => (
                <div key={`sept-day-${index}`} className="h-8 border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center text-xs">
                  {day ? day.getDate() : ''}
                </div>
              ))}
            </div>
            <div className="col-span-7 grid grid-cols-7">
              {octoberDays.map((day, index) => (
                <div key={`oct-day-${index}`} className="h-8 border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center text-xs">
                  {day ? day.getDate() : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Room Types */}
        <div className="space-y-6">
          {roomTypes.map((roomType) => (
            <div key={roomType.id} className="border border-calendar-grid-border rounded-lg overflow-hidden">
              {/* Room Type Header */}
              <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-calendar-grid-border">
                <h3 className="text-lg font-semibold">{roomType.name}</h3>
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

              {/* Room Data Rows */}
              <div className="space-y-0">
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
                  <div className="p-0">
                    <div className="grid grid-cols-14 h-full">
                      <div className="col-span-7 grid grid-cols-7">
                        {septemberDays.map((day, index) => (
                          <div key={`${roomType.id}-status-sept-${index}`} className="h-12 border-r border-calendar-grid-border last:border-r-0 bg-calendar-bookable"></div>
                        ))}
                      </div>
                      <div className="col-span-7 grid grid-cols-7">
                        {octoberDays.map((day, index) => (
                          <div key={`${roomType.id}-status-oct-${index}`} className="h-12 border-r border-calendar-grid-border last:border-r-0 bg-calendar-bookable"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rooms to Sell Row */}
                <div className="grid grid-cols-[200px_1fr] border-b border-calendar-grid-border">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <span className="text-sm font-medium">Rooms to sell</span>
                    <div className="mt-1">
                      <Button variant="link" size="sm" className="text-primary p-0 h-auto text-xs">
                        Bulk edit
                      </Button>
                    </div>
                  </div>
                  <div className="p-0">
                    <div className="grid grid-cols-14 h-full">
                      <div className="col-span-7 grid grid-cols-7">
                        {roomType.rooms.slice(0, septemberDays.filter(d => d).length).map((room, index) => (
                          <div key={`${roomType.id}-rooms-sept-${index}`} className="h-12 border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center text-sm hover:bg-calendar-cell-hover cursor-pointer">
                            {room.roomsToSell}
                          </div>
                        ))}
                      </div>
                      <div className="col-span-7 grid grid-cols-7">
                        {roomType.rooms.slice(septemberDays.filter(d => d).length).map((room, index) => (
                          <div key={`${roomType.id}-rooms-oct-${index}`} className="h-12 border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center text-sm hover:bg-calendar-cell-hover cursor-pointer">
                            {room.roomsToSell}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Booked Row */}
                <div className="grid grid-cols-[200px_1fr] border-b border-calendar-grid-border">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <span className="text-sm font-medium">Net booked</span>
                  </div>
                  <div className="p-0">
                    <div className="grid grid-cols-14 h-full">
                      <div className="col-span-7 grid grid-cols-7">
                        {roomType.rooms.slice(0, septemberDays.filter(d => d).length).map((room, index) => (
                          <div key={`${roomType.id}-booked-sept-${index}`} className="h-12 border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center">
                            {room.netBooked > 0 && (
                              <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs">
                                {room.netBooked}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="col-span-7 grid grid-cols-7">
                        {roomType.rooms.slice(septemberDays.filter(d => d).length).map((room, index) => (
                          <div key={`${roomType.id}-booked-oct-${index}`} className="h-12 border-r border-calendar-grid-border last:border-r-0 flex items-center justify-center">
                            {room.netBooked > 0 && (
                              <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs">
                                {room.netBooked}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Standard Rate Row */}
                <div className="grid grid-cols-[200px_1fr]">
                  <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                    <div className="flex items-center gap-1">
                      <ChevronDown className="h-4 w-4" />
                      <span className="text-sm font-medium">Standard Rate</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      <span className="text-xs">2 Edit</span>
                    </div>
                  </div>
                  <div className="p-0">
                    <div className="grid grid-cols-14 h-full">
                      <div className="col-span-7 grid grid-cols-7">
                        {roomType.rooms.slice(0, septemberDays.filter(d => d).length).map((room, index) => (
                          <div key={`${roomType.id}-rate-sept-${index}`} className="h-12 border-r border-calendar-grid-border last:border-r-0 flex flex-col items-center justify-center text-xs hover:bg-calendar-cell-hover cursor-pointer">
                            <span className="text-[10px] text-muted-foreground">{room.currency}</span>
                            <span className="font-medium">{room.rate}</span>
                          </div>
                        ))}
                      </div>
                      <div className="col-span-7 grid grid-cols-7">
                        {roomType.rooms.slice(septemberDays.filter(d => d).length).map((room, index) => (
                          <div key={`${roomType.id}-rate-oct-${index}`} className="h-12 border-r border-calendar-grid-border last:border-r-0 flex flex-col items-center justify-center text-xs hover:bg-calendar-cell-hover cursor-pointer">
                            <span className="text-[10px] text-muted-foreground">{room.currency}</span>
                            <span className="font-medium">{room.rate}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;