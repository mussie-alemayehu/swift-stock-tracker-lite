
import { useState } from "react";
import { format } from "date-fns";
import { 
  ArrowUpDown, 
  Edit, 
  Trash2,
  ChevronDown,
  ChevronUp,
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
import { InventoryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortField = keyof Pick<InventoryItem, 'name' | 'quantity' | 'purchaseDate'>;
type SortDirection = 'asc' | 'desc';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

const InventoryTable = ({ items, onEdit, onDelete }: InventoryTableProps) => {
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="max-w-[250px] truncate">
                  {item.description || "—"}
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
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
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
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
