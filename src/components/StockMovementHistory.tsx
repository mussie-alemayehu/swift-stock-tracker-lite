
import { format } from "date-fns";
import { InventoryItem, StockMovement } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface StockMovementHistoryProps {
  item: InventoryItem;
  movements: StockMovement[];
}

const StockMovementHistory = ({ item, movements }: StockMovementHistoryProps) => {
  // Sort movements by timestamp, newest first
  const sortedMovements = [...movements].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Stock Movement History</h3>
        <p className="text-sm text-gray-500">
          History of changes for {item.name}
        </p>
      </div>

      {sortedMovements.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No movement history available for this item.</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Before</TableHead>
                <TableHead>After</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {format(movement.timestamp, "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={movement.adjustmentType === "increase" ? "default" : "destructive"}
                    >
                      {movement.adjustmentType === "increase" ? "Increase" : "Reduce"}
                    </Badge>
                  </TableCell>
                  <TableCell>{movement.quantityBefore}</TableCell>
                  <TableCell>{movement.quantityAfter}</TableCell>
                  <TableCell>
                    {movement.adjustmentType === "increase" 
                      ? `+${movement.quantityAfter - movement.quantityBefore}`
                      : `${movement.quantityAfter - movement.quantityBefore}`
                    }
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{movement.reason}</span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {movement.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default StockMovementHistory;
