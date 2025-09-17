import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface RoomType {
  id: string;
  name: string;
  data: {
    status: string;
    roomsToSell: number[];
    netBooked: number[];
    rates: number[];
  };
}

interface BulkEditData {
  fromDate: string;
  toDate: string;
  daysOfWeek: string[];
  roomsToSell: string;
  rateType: string;
  price: string;
  roomStatus: string;
  restrictions: string;
}

interface BulkEditSelection {
  startDate: Date | null;
  endDate: Date | null;
  roomTypeId: string | null;
}

interface CalendarSidebarProps {
  roomTypes: RoomType[];
  bulkEditOpen: boolean;
  setBulkEditOpen: (open: boolean) => void;
  selectedRoomType: string;
  setSelectedRoomType: (roomType: string) => void;
  bulkEditData: BulkEditData;
  setBulkEditData: (data: BulkEditData | ((prev: BulkEditData) => BulkEditData)) => void;
  bulkEditSelection: BulkEditSelection;
  setBulkEditSelection: (selection: BulkEditSelection) => void;
  calendarDates: Date[];
  handleDayOfWeekToggle: (day: string) => void;
  handleBulkEditSave: () => void;
  formatDateStringRange: (fromDate: string, toDate: string) => string;
}

export function CalendarSidebar({
  roomTypes,
  bulkEditOpen,
  setBulkEditOpen,
  selectedRoomType,
  setSelectedRoomType,
  bulkEditData,
  setBulkEditData,
  bulkEditSelection,
  setBulkEditSelection,
  calendarDates,
  handleDayOfWeekToggle,
  handleBulkEditSave,
  formatDateStringRange,
}: CalendarSidebarProps) {
  const getCurrentRoomType = () => {
    return roomTypes.find(rt => rt.id === bulkEditSelection.roomTypeId);
  };

  return (
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
        </div>
      ))}
    </div>
  );
}