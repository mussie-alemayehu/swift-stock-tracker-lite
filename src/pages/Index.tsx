
import { useState, useEffect } from "react";
import { PlusCircle, Search, AlertTriangle } from "lucide-react";
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

const Index = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdjustFormOpen, setIsAdjustFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Load items from localStorage on initial render
  useEffect(() => {
    const savedItems = localStorage.getItem("inventoryItems");
    if (savedItems) {
      try {
        // Convert date strings back to Date objects
        const parsedItems = JSON.parse(savedItems).map((item: any) => ({
          ...item,
          purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
        }));
        setItems(parsedItems);
      } catch (error) {
        console.error("Failed to parse saved inventory items:", error);
      }
    }

    const savedMovements = localStorage.getItem("stockMovements");
    if (savedMovements) {
      try {
        // Convert date strings back to Date objects
        const parsedMovements = JSON.parse(savedMovements).map((movement: any) => ({
          ...movement,
          timestamp: movement.timestamp ? new Date(movement.timestamp) : new Date(),
        }));
        setMovements(parsedMovements);
      } catch (error) {
        console.error("Failed to parse saved stock movements:", error);
      }
    }
  }, []);

  // Save items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("inventoryItems", JSON.stringify(items));
  }, [items]);

  // Save movements to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("stockMovements", JSON.stringify(movements));
  }, [movements]);

  const handleAddItem = (newItem: InventoryItem) => {
    setItems((prevItems) => [...prevItems, newItem]);
    setIsFormOpen(false);
    toast.success(`${newItem.name} has been added to inventory.`, {
      description: "Inventory updated successfully."
    });
  };

  const handleEditItem = (updatedItem: InventoryItem) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    setEditingItem(null);
    toast.success(`${updatedItem.name} has been updated.`, {
      description: "Inventory updated successfully."
    });
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find((item) => item.id === id);
    
    // Delete associated stock movements
    setMovements(prevMovements => 
      prevMovements.filter(movement => movement.itemId !== id)
    );
    
    // Delete the item
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    
    toast.error(itemToDelete 
      ? `${itemToDelete.name} has been removed from inventory.`
      : "Item has been removed from inventory.", {
      description: "Inventory updated successfully."
    });
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
    // Create the stock movement record
    const newMovement: StockMovement = {
      id: uuidv4(),
      itemId,
      timestamp: new Date(),
      ...adjustment
    };
    
    setMovements(prev => [...prev, newMovement]);
    
    // Update the item quantity
    setItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: adjustment.quantityAfter
          };
        }
        return item;
      })
    );
    
    setIsAdjustFormOpen(false);
    
    toast.success(
      `Stock ${adjustment.adjustmentType === "increase" ? "increased" : "reduced"} successfully.`, 
      {
        description: `New quantity: ${adjustment.quantityAfter}`
      }
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="mt-2 text-gray-600">
              Track and manage your inventory items efficiently
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
              movements={movements.filter(m => m.itemId === selectedItem.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
