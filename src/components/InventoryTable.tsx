
import { useState } from "react";
import { format } from "date-fns";
import { 
  ArrowUpDown, 
  Edit, 
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  AlertTriangle,
  Menu,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InventoryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortField = keyof Pick<InventoryItem, 'name' | 'quantity' | 'purchaseDate'>;
type SortDirection = 'asc' | 'desc';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
}

const InventoryTable = ({ 
  items, 
  onEdit, 
  onDelete, 
  onAdjustStock,
  onViewHistory
}: InventoryTableProps) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
    if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc' 
        ? aValue.getTime() - bValue.getTime() 
        : bValue.getTime() - aValue.getTime();
    }
    
    // For numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const isLowStock = (item: InventoryItem): boolean => {
    if (item.minStockThreshold === undefined) return false;
    return item.quantity <= item.minStockThreshold;
  };

  // Generate table header with sort buttons
  const renderSortableHeader = (
    label: string, 
    field: SortField, 
    className?: string
  ) => (
    <Button
      variant="ghost"
      onClick={() => toggleSort(field)}
      className={cn("flex items-center px-0 font-semibold", className)}
    >
      {label}
      <span className="ml-2">
        {sortField === field ? (
          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4" />
        )}
      </span>
    </Button>
  );

  // Action buttons for each row
  const ActionButtons = ({ item }: { item: InventoryItem }) => (
    <div className="flex justify-end items-center space-x-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onAdjustStock(item)}
        title="Adjust Stock"
        className="h-8 w-8 hidden sm:flex"
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onViewHistory(item)}
        title="View History"
        className="h-8 w-8 hidden sm:flex"
      >
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(item)}
        title="Edit Item"
        className="h-8 w-8 hidden sm:flex"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            title="Delete Item"
            className="h-8 w-8 text-destructive hidden sm:flex"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={() => onDelete(item.id)}
          >
            Confirm Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mobile menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:hidden"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          <DropdownMenuItem onClick={() => onAdjustStock(item)}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Adjust Stock
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewHistory(item)}>
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View History
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Item
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                {renderSortableHeader('Item Name', 'name')}
              </TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="w-[120px]">
                {renderSortableHeader('Quantity', 'quantity')}
              </TableHead>
              <TableHead className="hidden sm:table-cell">Unit</TableHead>
              <TableHead className="hidden lg:table-cell w-[150px]">
                {renderSortableHeader('Purchase Date', 'purchaseDate')}
              </TableHead>
              <TableHead className="hidden lg:table-cell">Supplier</TableHead>
              <TableHead className="hidden xl:table-cell">SKU/Code</TableHead>
              <TableHead className="hidden md:table-cell">Min. Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <TableRow 
                key={item.id} 
                className={cn(
                  "hover:bg-gray-50",
                  isLowStock(item) && "bg-red-50 hover:bg-red-100"
                )}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {item.name}
                    {isLowStock(item) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Low stock alert! Below minimum threshold.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  {/* Mobile-only information */}
                  <div className="block sm:hidden mt-1 text-xs text-gray-500">
                    <div><span className="font-medium">Unit:</span> {item.unit}</div>
                    <div><span className="font-medium">Min Stock:</span> {item.minStockThreshold || "—"}</div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[250px] truncate hidden md:table-cell">
                  {item.description || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className={isLowStock(item) ? "text-red-600 font-semibold" : ""}>
                      {item.quantity}
                    </span>
                    {isLowStock(item) && (
                      <Badge variant="destructive" className="ml-2 text-xs">Low</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="capitalize">{item.unit}</span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {item.purchaseDate
                    ? format(item.purchaseDate, "MMM d, yyyy")
                    : "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{item.supplier || "—"}</TableCell>
                <TableCell className="hidden xl:table-cell">{item.sku || "—"}</TableCell>
                <TableCell className="hidden md:table-cell">{item.minStockThreshold || "—"}</TableCell>
                <TableCell className="text-right">
                  <ActionButtons item={item} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InventoryTable;
