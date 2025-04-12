
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdjustmentReason, AdjustmentType, InventoryItem, StockMovement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const adjustmentReasons: { value: AdjustmentReason; label: string }[] = [
  { value: "restock", label: "Restock" },
  { value: "sale", label: "Sale" },
  { value: "return", label: "Return" },
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "correction", label: "Correction" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  adjustmentType: z.enum(["increase", "reduce"]),
  quantity: z.coerce.number()
    .positive("Quantity must be greater than 0"),
  reason: z.enum(["restock", "sale", "return", "damaged", "expired", "correction", "other"]),
  notes: z.string().optional(),
});

interface StockAdjustmentFormProps {
  item: InventoryItem;
  onAdjust: (itemId: string, adjustment: Omit<StockMovement, "id" | "timestamp" | "itemId">) => void;
  onCancel: () => void;
}

const StockAdjustmentForm = ({ item, onAdjust, onCancel }: StockAdjustmentFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adjustmentType: "increase",
      quantity: 1,
      reason: "restock",
      notes: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const { adjustmentType, quantity, reason, notes } = values;
    
    // Calculate the new quantity
    const quantityBefore = item.quantity;
    const quantityAfter = adjustmentType === "increase" 
      ? quantityBefore + quantity 
      : quantityBefore - quantity;
    
    // Validate the adjustment to prevent negative stock
    if (adjustmentType === "reduce" && quantityAfter < 0) {
      form.setError("quantity", {
        type: "manual",
        message: `Cannot reduce more than current stock (${quantityBefore})`,
      });
      return;
    }
    
    // Create the stock movement record
    onAdjust(item.id, {
      quantityBefore,
      quantityAfter,
      adjustmentType,
      reason,
      notes,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Adjust Stock for: {item.name}</h3>
          <p className="text-sm text-gray-500">
            Current stock: {item.quantity} {item.unit}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="adjustmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adjustment Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="increase">Increase</SelectItem>
                    <SelectItem value="reduce">Reduce</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    {...field} 
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        field.onChange(value);
                      } else if (e.target.value === "") {
                        field.onChange("");
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {adjustmentReasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Optional notes about this adjustment..." 
                  className="min-h-[80px]" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Add any relevant details about this stock adjustment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            Confirm Adjustment
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StockAdjustmentForm;
