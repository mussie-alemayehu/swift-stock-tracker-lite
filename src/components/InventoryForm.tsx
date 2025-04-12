import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { InventoryItem } from "@/lib/types";

const units = ["pieces", "kg", "liters", "boxes", "meters", "pairs"];

// Schema for form validation
const formSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity must be 0 or greater"),
  unit: z.enum(["pieces", "kg", "liters", "boxes", "meters", "pairs"]),
  purchaseDate: z.date().optional(),
  supplier: z.string().optional(),
  sku: z.string().optional(),
  minStockThreshold: z.coerce.number().min(0, "Threshold must be 0 or greater").optional(),
});

interface InventoryFormProps {
  itemToEdit?: InventoryItem;
  onSubmit: (item: InventoryItem) => void;
  onCancel: () => void;
  items: InventoryItem[];
}

const InventoryForm = ({ itemToEdit, onSubmit, onCancel, items }: InventoryFormProps) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: itemToEdit
      ? {
          name: itemToEdit.name,
          description: itemToEdit.description || "",
          quantity: itemToEdit.quantity,
          unit: itemToEdit.unit,
          purchaseDate: itemToEdit.purchaseDate,
          supplier: itemToEdit.supplier || "",
          sku: itemToEdit.sku || "",
          minStockThreshold: itemToEdit.minStockThreshold || 0,
        }
      : {
          name: "",
          description: "",
          quantity: 0,
          unit: "pieces",
          supplier: "",
          sku: "",
          minStockThreshold: 0,
        },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.sku) {
      const isDuplicateSku = items.some((item) => 
        item.sku === values.sku && (!itemToEdit || item.id !== itemToEdit.id)
      );
      
      if (isDuplicateSku) {
        form.setError("sku", {
          type: "manual",
          message: "This SKU already exists. Please use a unique value.",
        });
        return;
      }
    }

    if (itemToEdit) {
      onSubmit({
        ...values,
        id: itemToEdit.id,
      } as InventoryItem);
    } else {
      onSubmit({
        ...values,
        id: uuidv4(),
      } as InventoryItem);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Name*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter item name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity*</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 0) {
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

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit*</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          <span className="capitalize">{unit}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter item description (optional)"
                    className="resize-none min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Purchase Date</FormLabel>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "MMM d, yyyy")
                        ) : (
                          <span>Select date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setDatePickerOpen(false);
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Date when the item was purchased (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter supplier name (optional)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU/Product Code</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter SKU or product code (optional)" />
                </FormControl>
                <FormDescription>
                  A unique identifier for this inventory item
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Stock Threshold</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        field.onChange(value);
                      } else if (e.target.value === "") {
                        field.onChange("");
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Set a minimum threshold for low stock alerts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {itemToEdit ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default InventoryForm;
