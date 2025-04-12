
import { Database } from "@/integrations/supabase/types";
import { AdjustmentReason, AdjustmentType, InventoryItem, StockMovement, Unit } from "./types";

// Type for database inventory item
export type SupabaseInventoryItem = Database['public']['Tables']['inventory_items']['Row'];

// Type for database stock movement
export type SupabaseStockMovement = Database['public']['Tables']['stock_movements']['Row'];

// Function to convert from Supabase inventory item to our app's format
export function mapSupabaseToInventoryItem(item: SupabaseInventoryItem): InventoryItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description || undefined,
    quantity: Number(item.quantity),
    unit: item.unit as Unit,
    purchaseDate: item.purchase_date ? new Date(item.purchase_date) : undefined,
    supplier: item.supplier || undefined,
    sku: item.sku || undefined,
    minStockThreshold: item.min_stock_threshold ? Number(item.min_stock_threshold) : undefined
  };
}

// Function to prepare inventory item for Supabase insert/update
export function prepareInventoryItemForSupabase(item: InventoryItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    purchase_date: item.purchaseDate?.toISOString(),
    supplier: item.supplier,
    sku: item.sku,
    min_stock_threshold: item.minStockThreshold
  };
}

// Function to convert from Supabase stock movement to our app's format
export function mapSupabaseToStockMovement(movement: SupabaseStockMovement): StockMovement {
  return {
    id: movement.id,
    itemId: movement.item_id,
    quantityBefore: Number(movement.quantity_before),
    quantityAfter: Number(movement.quantity_after),
    adjustmentType: movement.adjustment_type as AdjustmentType,
    reason: movement.reason as AdjustmentReason,
    notes: movement.notes || undefined,
    timestamp: new Date(movement.timestamp)
  };
}

// Function to prepare stock movement for Supabase insert
export function prepareStockMovementForSupabase(
  movement: Omit<StockMovement, "id" | "timestamp">, 
  userId: string
) {
  return {
    item_id: movement.itemId,
    user_id: userId,
    quantity_before: movement.quantityBefore,
    quantity_after: movement.quantityAfter,
    adjustment_type: movement.adjustmentType,
    reason: movement.reason,
    notes: movement.notes
  };
}
