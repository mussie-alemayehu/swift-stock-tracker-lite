
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem, StockMovement } from './types';
import { 
  mapSupabaseToInventoryItem, 
  mapSupabaseToStockMovement, 
  prepareInventoryItemForSupabase,
  prepareStockMovementForSupabase
} from './supabase-types';

export const inventoryService = {
  // Fetch all inventory items for the current user
  async getInventoryItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
    
    return data.map(mapSupabaseToInventoryItem);
  },

  // Add a new inventory item
  async addInventoryItem(item: InventoryItem): Promise<InventoryItem> {
    const user = supabase.auth.getUser();
    const userId = (await user).data.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(prepareInventoryItemForSupabase(item, userId))
      .select()
      .single();
    
    if (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
    
    return mapSupabaseToInventoryItem(data);
  },

  // Update an existing inventory item
  async updateInventoryItem(item: InventoryItem): Promise<InventoryItem> {
    const user = supabase.auth.getUser();
    const userId = (await user).data.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('inventory_items')
      .update(prepareInventoryItemForSupabase(item, userId))
      .eq('id', item.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
    
    return mapSupabaseToInventoryItem(data);
  },

  // Delete an inventory item
  async deleteInventoryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  },

  // Get stock movements for an item
  async getStockMovements(itemId: string): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('item_id', itemId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching stock movements:', error);
      throw error;
    }
    
    return data.map(mapSupabaseToStockMovement);
  },

  // Add a stock movement
  async addStockMovement(
    movement: Omit<StockMovement, "id" | "timestamp">
  ): Promise<StockMovement> {
    const user = supabase.auth.getUser();
    const userId = (await user).data.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(prepareStockMovementForSupabase(movement, userId))
      .select()
      .single();
    
    if (error) {
      console.error('Error adding stock movement:', error);
      throw error;
    }
    
    return mapSupabaseToStockMovement(data);
  }
};
