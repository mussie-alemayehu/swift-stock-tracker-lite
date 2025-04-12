
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

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort('name')}
                  className="flex items-center px-0 font-semibold"
                >
                  Item Name
                  <span className="ml-2">
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </span>
                </Button>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort('quantity')}
                  className="flex items-center px-0 font-semibold"
                >
                  Quantity
                  <span className="ml-2">
                    {sortField === 'quantity' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </span>
                </Button>
              </TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="w-[150px]">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort('purchaseDate')}
                  className="flex items-center px-0 font-semibold"
                >
                  Purchase Date
                  <span className="ml-2">
                    {sortField === 'purchaseDate' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </span>
                </Button>
              </TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>SKU/Code</TableHead>
              <TableHead>Min. Stock</TableHead>
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
                </TableCell>
                <TableCell className="max-w-[250px] truncate">
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
                <TableCell>
                  <span className="capitalize">{item.unit}</span>
                </TableCell>
                <TableCell>
                  {item.purchaseDate
                    ? format(item.purchaseDate, "MMM d, yyyy")
                    : "—"}
                </TableCell>
                <TableCell>{item.supplier || "—"}</TableCell>
                <TableCell>{item.sku || "—"}</TableCell>
                <TableCell>{item.minStockThreshold || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAdjustStock(item)}
                      title="Adjust Stock"
                      className="h-8 w-8"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewHistory(item)}
                      title="View History"
                      className="h-8 w-8"
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
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete Item"
                          className="h-8 w-8 text-destructive"
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
                  </div>
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
