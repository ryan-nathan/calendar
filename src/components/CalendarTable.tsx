import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

interface CalendarTableProps {
  roomTypes: RoomType[];
  calendarDates: Date[];
  currentStartDate: Date;
  simpleBulkEditOpen: boolean;
  setSimpleBulkEditOpen: (open: boolean) => void;
  selectedRoomType: string;
  closedDates: {[roomTypeId: string]: {[dateKey: string]: boolean}};
  isDragging: boolean;
  dragStart: number | null;
  dragEnd: number | null;
  currentDragRoomType: string | null;
  editingCell: {roomTypeId: string, dateIndex: number, field: 'roomsToSell' | 'rates'} | null;
  editValue: string;
  setEditValue: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  bulkEditData: BulkEditData;
  setBulkEditData: (data: BulkEditData | ((prev: BulkEditData) => BulkEditData)) => void;
  bulkEditSelection: BulkEditSelection;
  setBulkEditSelection: (selection: BulkEditSelection) => void;
  handlePreviousWeek: () => void;
  handleNextWeek: () => void;
  getDayName: (date: Date) => string;
  getDateNumber: (date: Date) => number;
  getDateKey: (date: Date) => string;
  isDateClosed: (roomTypeId: string, date: Date) => boolean;
  hasClosedDatesForRoom: (roomTypeId: string) => boolean;
  createDateSegments: (roomTypeId: string, dates: Date[]) => Array<{type: 'open' | 'closed', startIndex: number, endIndex: number, dates: Date[]}>;
  handleMouseDown: (roomTypeId: string, dateIndex: number) => void;
  handleMouseMove: (dateIndex: number) => void;
  handleMouseUp: () => void;
  isInDragRange: (dateIndex: number, roomTypeId: string) => boolean;
  handleCellClick: (roomTypeId: string, dateIndex: number, field: 'roomsToSell' | 'rates') => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleBulkEditSave: () => void;
  formatDateRange: (startDate: Date, endDate: Date) => string;
  getDataIndexForDate: (date: Date) => number;
}

export function CalendarTable({
  roomTypes,
  calendarDates,
  currentStartDate,
  simpleBulkEditOpen,
  setSimpleBulkEditOpen,
  selectedRoomType,
  closedDates,
  isDragging,
  dragStart,
  dragEnd,
  currentDragRoomType,
  editingCell,
  editValue,
  setEditValue,
  inputRef,
  bulkEditData,
  setBulkEditData,
  bulkEditSelection,
  setBulkEditSelection,
  handlePreviousWeek,
  handleNextWeek,
  getDayName,
  getDateNumber,
  getDateKey,
  isDateClosed,
  hasClosedDatesForRoom,
  createDateSegments,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  isInDragRange,
  handleCellClick,
  handleSaveEdit,
  handleCancelEdit,
  handleKeyDown,
  handleBulkEditSave,
  formatDateRange,
  getDataIndexForDate,
}: CalendarTableProps) {
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell, inputRef]);

  return (
    <div className="overflow-hidden">
      <div className="min-w-auto">
        {/* Month Headers */}
        <div className="grid grid-cols-[220px_1fr] mb-4">
          <div></div>
          <div className="flex items-center justify-between">
            <div></div>
            <div className="flex gap-8">
              {calendarDates.slice(0, 15).some((date, index) => index === 0 || date.getMonth() !== calendarDates[index - 1]?.getMonth()) && (
                <h2 className="text-sm font-medium">
                  {calendarDates[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
              )}
              {calendarDates.slice(15).some((date, index) => calendarDates[14 + index]?.getMonth() !== calendarDates[14 + index - 1]?.getMonth()) && (
                <h2 className="text-sm font-medium">
                  {calendarDates.find((date, index) => index > 14 && date.getMonth() !== calendarDates[index - 1]?.getMonth())?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2">
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
                    "border-r border-calendar-grid-border last:border-r-0",
                    isSaturday && "border-r-2 border-r-blue-500"
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
                          <span className="text-xs font-medium">Open</span>
                        </div>
                      );
                    } else {
                      return (
                        <div 
                          key={`segment-${segmentIndex}`}
                          className="absolute top-3 bottom-3 bg-red-500 text-white rounded-full flex items-center justify-start pl-3 z-30 pointer-events-none"
                          style={{
                            left: `calc(${leftPercent}% + 8px)`,
                            width: `calc(${widthPercent}% - 16px)`,
                          }}
                        >
                          <span className="text-xs font-medium">Closed</span>
                        </div>
                      );
                    }
                  })}
                  
                  {/* Invisible grid for mouse interaction */}
                  <div className="grid grid-cols-31 h-full absolute inset-0 z-40">
                    {calendarDates.map((date, dateIndex) => {
                      const dayName = getDayName(date);
                      const isSaturday = dayName === 'Sat';
                      const inRange = isInDragRange(dateIndex, roomType.id);
                      return (
                        <div
                          key={dateIndex}
                          className={cn(
                            "border-r border-calendar-grid-border last:border-r-0 cursor-pointer flex items-center justify-center",
                            isSaturday && "border-r-2 border-r-blue-500",
                            inRange && "bg-primary/10"
                          )}
                          onMouseDown={() => handleMouseDown(roomType.id, dateIndex)}
                          onMouseMove={() => handleMouseMove(dateIndex)}
                          onMouseUp={handleMouseUp}
                        >
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rooms to sell Row */}
              <div className="grid grid-cols-[220px_1fr] border-b border-calendar-grid-border">
                <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                  <span className="text-xs font-medium">Rooms to sell</span>
                </div>
                <div className="grid grid-cols-31">
                  {calendarDates.map((date, dateIndex) => {
                    const dataIndex = getDataIndexForDate(date);
                    const roomsToSell = roomType.data.roomsToSell[dataIndex] || 0;
                    const netBooked = roomType.data.netBooked[dataIndex] || 0;
                    const dayName = getDayName(date);
                    const isSaturday = dayName === 'Sat';
                    const isEditing = editingCell?.roomTypeId === roomType.id && editingCell?.dateIndex === dateIndex && editingCell?.field === 'roomsToSell';
                    const isClosed = isDateClosed(roomType.id, date);
                    const inRange = isInDragRange(dateIndex, roomType.id);
                    
                    return (
                      <div
                        key={dateIndex}
                        className={cn(
                          "p-2 border-r border-calendar-grid-border last:border-r-0 text-xs text-center min-h-[40px] flex flex-col justify-center",
                          isSaturday && "border-r-2 border-r-blue-500",
                          isClosed && "bg-red-50 text-red-700",
                          inRange && "bg-primary/10"
                        )}
                        onClick={() => !isEditing && handleCellClick(roomType.id, dateIndex, 'roomsToSell')}
                      >
                        {isEditing ? (
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSaveEdit}
                            className="h-6 text-xs text-center border-0 bg-transparent p-0 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <>
                            <div className="font-medium">{roomsToSell}</div>
                            <div className="text-[10px] text-muted-foreground">({netBooked} booked)</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rates Row */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="p-3 bg-muted/30 border-r border-calendar-grid-border">
                  <span className="text-xs font-medium">Standard rate</span>
                </div>
                <div className="grid grid-cols-31">
                  {calendarDates.map((date, dateIndex) => {
                    const dataIndex = getDataIndexForDate(date);
                    const rate = roomType.data.rates[dataIndex] || 0;
                    const dayName = getDayName(date);
                    const isSaturday = dayName === 'Sat';
                    const isEditing = editingCell?.roomTypeId === roomType.id && editingCell?.dateIndex === dateIndex && editingCell?.field === 'rates';
                    const isClosed = isDateClosed(roomType.id, date);
                    const inRange = isInDragRange(dateIndex, roomType.id);
                    
                    return (
                      <div
                        key={dateIndex}
                        className={cn(
                          "p-2 border-r border-calendar-grid-border last:border-r-0 text-xs text-center min-h-[40px] flex items-center justify-center cursor-pointer hover:bg-muted/50",
                          isSaturday && "border-r-2 border-r-blue-500",
                          isClosed && "bg-red-50 text-red-700",
                          inRange && "bg-primary/10"
                        )}
                        onClick={() => !isEditing && handleCellClick(roomType.id, dateIndex, 'rates')}
                      >
                        {isEditing ? (
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSaveEdit}
                            className="h-6 text-xs text-center border-0 bg-transparent p-0 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <div className="font-medium">₹{rate.toLocaleString()}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simple Bulk Edit Dialog */}
        <Sheet open={simpleBulkEditOpen} onOpenChange={(open) => {
          setSimpleBulkEditOpen(open);
          if (!open) {
            setBulkEditSelection({ startDate: null, endDate: null, roomTypeId: null });
            setBulkEditData(prev => ({ ...prev, roomsToSell: "", price: "" }));
          }
        }}>
          <SheetContent className="w-[400px] sm:w-[400px] max-w-none sm:max-w-none" style={{width: '400px'}}>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-semibold">
                  Simple bulk edit
                </SheetTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSimpleBulkEditOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* Selected Date Range */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Selected range</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {bulkEditSelection.startDate && bulkEditSelection.endDate ? 
                    formatDateRange(bulkEditSelection.startDate, bulkEditSelection.endDate) : 
                    'No range selected'
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Room type: {roomTypes.find(rt => rt.id === bulkEditSelection.roomTypeId)?.name || 'Unknown'}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rooms to sell</label>
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
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Price (THB)</label>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={bulkEditData.price}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleBulkEditSave} className="flex-1">
                  Apply changes
                </Button>
                <Button variant="outline" onClick={() => setSimpleBulkEditOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}