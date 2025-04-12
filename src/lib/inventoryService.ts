
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

  // Add a stock movement and update the item quantity
  async addStockMovement(
    movement: Omit<StockMovement, "id" | "timestamp">
  ): Promise<StockMovement> {
    const user = supabase.auth.getUser();
    const userId = (await user).data.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Start a transaction to ensure both operations succeed or fail together
    const { data: movementData, error: movementError } = await supabase
      .from('stock_movements')
      .insert(prepareStockMovementForSupabase(movement, userId))
      .select()
      .single();
    
    if (movementError) {
      console.error('Error adding stock movement:', movementError);
      throw movementError;
    }
    
    // Update the item's quantity to match the new quantity after adjustment
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ quantity: movement.quantityAfter })
      .eq('id', movement.itemId);
    
    if (updateError) {
      console.error('Error updating item quantity:', updateError);
      throw updateError;
    }
    
    return mapSupabaseToStockMovement(movementData);
  },

  // Export inventory items to CSV
  async exportInventoryToCsv(): Promise<string> {
    const items = await this.getInventoryItems();
    
    // Define CSV header
    const headers = [
      'Name', 'Description', 'Quantity', 'Unit', 'Purchase Date',
      'Supplier', 'SKU', 'Min Stock Threshold'
    ];

    // Map items to CSV rows
    const rows = items.map(item => [
      item.name,
      item.description || '',
      item.quantity.toString(),
      item.unit,
      item.purchaseDate ? item.purchaseDate.toISOString().split('T')[0] : '',
      item.supplier || '',
      item.sku || '',
      item.minStockThreshold?.toString() || ''
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          // Escape commas and quotes in cell values
          cell.includes(',') || cell.includes('"') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    return csvContent;
  },

  // Import inventory items from CSV
  async importInventoryFromCsv(csvContent: string): Promise<{ 
    success: InventoryItem[]; 
    errors: { row: number; error: string }[] 
  }> {
    const user = supabase.auth.getUser();
    const userId = (await user).data.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Parse CSV content
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    const successItems: InventoryItem[] = [];
    const errors: { row: number; error: string }[] = [];

    // Get existing items for SKU validation
    const existingItems = await this.getInventoryItems();
    const existingSkus = new Set(
      existingItems.map(item => item.sku).filter(Boolean)
    );

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      try {
        if (!lines[i].trim()) continue; // Skip empty lines

        // Parse the CSV row, handling quoted values correctly
        const values: string[] = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];
          
          if (char === '"') {
            if (j < lines[i].length - 1 && lines[i][j+1] === '"') {
              // Handle escaped quotes
              currentValue += '"';
              j++; // Skip the next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            values.push(currentValue);
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        
        // Add the last value
        values.push(currentValue);

        // Create item object
        const newItem: Partial<InventoryItem> = {
          name: values[headers.indexOf('Name')],
          description: values[headers.indexOf('Description')] || undefined,
          quantity: parseFloat(values[headers.indexOf('Quantity')]),
          unit: values[headers.indexOf('Unit')] as any,
          supplier: values[headers.indexOf('Supplier')] || undefined,
          sku: values[headers.indexOf('SKU')] || undefined,
          minStockThreshold: values[headers.indexOf('Min Stock Threshold')] 
            ? parseFloat(values[headers.indexOf('Min Stock Threshold')]) 
            : undefined,
          purchaseDate: values[headers.indexOf('Purchase Date')] 
            ? new Date(values[headers.indexOf('Purchase Date')]) 
            : undefined
        };

        // Validate required fields
        if (!newItem.name) {
          throw new Error('Name is required');
        }
        
        if (isNaN(newItem.quantity!)) {
          throw new Error('Quantity must be a valid number');
        }
        
        if (!newItem.unit) {
          throw new Error('Unit is required');
        }

        // Check for duplicate SKU
        if (newItem.sku && existingSkus.has(newItem.sku)) {
          throw new Error(`SKU '${newItem.sku}' already exists`);
        }

        // Add to database
        const item: InventoryItem = {
          id: crypto.randomUUID(),
          name: newItem.name!,
          description: newItem.description,
          quantity: newItem.quantity!,
          unit: newItem.unit!,
          supplier: newItem.supplier,
          sku: newItem.sku,
          minStockThreshold: newItem.minStockThreshold,
          purchaseDate: newItem.purchaseDate
        };

        const addedItem = await this.addInventoryItem(item);
        successItems.push(addedItem);
        
        // Add SKU to set to prevent duplicates within import
        if (item.sku) {
          existingSkus.add(item.sku);
        }
      } catch (error: any) {
        errors.push({
          row: i,
          error: error.message || 'Unknown error'
        });
      }
    }

    return { success: successItems, errors };
  }
};
