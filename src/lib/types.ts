
export type Unit = "pieces" | "kg" | "liters" | "boxes" | "meters" | "pairs";

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: Unit;
  purchaseDate?: Date;
  supplier?: string;
  sku?: string;
}
