
import { useState } from "react";
import { PlusCircle, Search, AlertTriangle, LogOut } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryTable from "@/components/InventoryTable";
import InventoryForm from "@/components/InventoryForm";
import StockAdjustmentForm from "@/components/StockAdjustmentForm";
import StockMovementHistory from "@/components/StockMovementHistory";
import EmptyState from "@/components/EmptyState";
import { InventoryItem, StockMovement } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";
import { inventoryService } from "@/lib/inventoryService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdjustFormOpen, setIsAdjustFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch inventory items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => inventoryService.getInventoryItems(),
  });

  // Fetch stock movements for selected item
  const { data: movements = [] } = useQuery({
    queryKey: ['stock-movements', selectedItem?.id],
    queryFn: () => selectedItem ? inventoryService.getStockMovements(selectedItem.id) : Promise.resolve([]),
    enabled: !!selectedItem,
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: (newItem: InventoryItem) => inventoryService.addInventoryItem(newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setIsFormOpen(false);
      toast.success(`Item has been added to inventory.`, {
        description: "Inventory updated successfully."
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to add item`, {
        description: error.message || "An error occurred while adding the item."
      });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: (updatedItem: InventoryItem) => inventoryService.updateInventoryItem(updatedItem),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setEditingItem(null);
      toast.success(`${updatedItem.name} has been updated.`, {
        description: "Inventory updated successfully."
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to update item`, {
        description: error.message || "An error occurred while updating the item."
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deleteInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.error(`Item has been removed from inventory.`, {
        description: "Inventory updated successfully."
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete item`, {
        description: error.message || "An error occurred while deleting the item."
      });
    }
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: ({ 
      itemId, 
      adjustment 
    }: { 
      itemId: string; 
      adjustment: Omit<StockMovement, "id" | "timestamp" | "itemId">
    }) => {
      const movement: Omit<StockMovement, "id" | "timestamp"> = {
        ...adjustment,
        itemId
      };
      return inventoryService.addStockMovement(movement);
    },
    onSuccess: () => {
      // Invalidate both inventory items and stock movements queries
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      if (selectedItem) {
        queryClient.invalidateQueries({ queryKey: ['stock-movements', selectedItem.id] });
      }
      setIsAdjustFormOpen(false);
      
      toast.success(
        `Stock adjusted successfully.`,
        {
          description: `The inventory has been updated.`
        }
      );
    },
    onError: (error: any) => {
      toast.error(`Failed to adjust stock`, {
        description: error.message || "An error occurred while adjusting the stock."
      });
    }
  });

  const handleAddItem = (newItem: InventoryItem) => {
    // Generate UUID if not present
    if (!newItem.id) {
      newItem.id = uuidv4();
    }
    addItemMutation.mutate(newItem);
  };

  const handleEditItem = (updatedItem: InventoryItem) => {
    updateItemMutation.mutate(updatedItem);
  };

  const handleDeleteItem = (id: string) => {
    deleteItemMutation.mutate(id);
  };

  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsAdjustFormOpen(true);
  };

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsHistoryOpen(true);
  };

  const handleStockAdjustment = (
    itemId: string, 
    adjustment: Omit<StockMovement, "id" | "timestamp" | "itemId">
  ) => {
    adjustStockMutation.mutate({ itemId, adjustment });
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
  };

  // Filter items based on search query and active tab
  const filteredItems = items.filter((item) => {
    // Filter by search query
    const matchesSearch = !searchQuery.trim() || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      (item.supplier?.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      (item.sku?.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    
    // Filter by tab
    if (activeTab === "low-stock") {
      return matchesSearch && item.minStockThreshold !== undefined && 
        item.quantity <= item.minStockThreshold;
    }
    
    return matchesSearch;
  });

  // Count low stock items
  const lowStockCount = items.filter(
    item => item.minStockThreshold !== undefined && item.quantity <= item.minStockThreshold
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              {user && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut} 
                  className="ml-4"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>
            <p className="mt-2 text-gray-600">
              {user && (
                <span>Welcome, {user.email}</span>
              )}
            </p>
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="mt-4 sm:mt-0"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search items by name, description, supplier or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-2"
          />
          {searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSearchQuery("")}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="low-stock" className="flex items-center">
              Low Stock
              {lowStockCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {lowStockCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredItems.length === 0 && items.length > 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No items match your search criteria.</p>
            <Button 
              variant="link" 
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState onAddItem={() => setIsFormOpen(true)} />
        ) : (
          <InventoryTable 
            items={filteredItems}
            onEdit={openEditDialog}
            onDelete={handleDeleteItem}
            onAdjustStock={handleAdjustStock}
            onViewHistory={handleViewHistory}
          />
        )}
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new item to your inventory
            </DialogDescription>
          </DialogHeader>
          <InventoryForm
            onSubmit={handleAddItem}
            onCancel={() => setIsFormOpen(false)}
            items={items}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the details of this inventory item
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <InventoryForm
              itemToEdit={editingItem}
              onSubmit={handleEditItem}
              onCancel={() => setEditingItem(null)}
              items={items.filter(item => item.id !== editingItem.id)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog 
        open={isAdjustFormOpen} 
        onOpenChange={(open) => !open && setIsAdjustFormOpen(false)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Increase or reduce the quantity of this item
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <StockAdjustmentForm
              item={selectedItem}
              onAdjust={handleStockAdjustment}
              onCancel={() => setIsAdjustFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Movement History Dialog */}
      <Dialog 
        open={isHistoryOpen} 
        onOpenChange={(open) => !open && setIsHistoryOpen(false)}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Stock Movement History</DialogTitle>
            <DialogDescription>
              View all stock adjustments for this item
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <StockMovementHistory
              item={selectedItem}
              movements={movements}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
