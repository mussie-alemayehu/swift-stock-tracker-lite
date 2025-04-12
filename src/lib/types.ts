
export type Unit = "pieces" | "kg" | "liters" | "boxes" | "meters" | "pairs";

export type AdjustmentType = "increase" | "reduce";

export type AdjustmentReason = 
  | "restock" 
  | "sale" 
  | "return" 
  | "damaged" 
  | "expired" 
  | "correction" 
  | "other";

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: Unit;
  purchaseDate?: Date;
  supplier?: string;
  sku?: string;
  minStockThreshold?: number;
}

export interface StockMovement {
  id: string;
  itemId: string;
  quantityBefore: number;
  quantityAfter: number;
  adjustmentType: AdjustmentType;
  reason: AdjustmentReason;
  notes?: string;
  timestamp: Date;
}
