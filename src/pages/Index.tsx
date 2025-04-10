
import { useState, useEffect } from "react";
import { PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import InventoryTable from "@/components/InventoryTable";
import InventoryForm from "@/components/InventoryForm";
import EmptyState from "@/components/EmptyState";
import { InventoryItem } from "@/lib/types";

const Index = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
  }, []);

  // Save items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("inventoryItems", JSON.stringify(items));
  }, [items]);

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
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    toast.error(itemToDelete 
      ? `${itemToDelete.name} has been removed from inventory.`
      : "Item has been removed from inventory.", {
      description: "Inventory updated successfully."
    });
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
  };

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(query) ||
      (item.description?.toLowerCase().includes(query)) ||
      (item.supplier?.toLowerCase().includes(query)) ||
      (item.sku?.toLowerCase().includes(query))
    );
  });

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

        {filteredItems.length === 0 && items.length > 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No items match your search criteria.</p>
            <Button 
              variant="link" 
              onClick={() => setSearchQuery("")}
              className="mt-2"
            >
              Clear search
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState onAddItem={() => setIsFormOpen(true)} />
        ) : (
          <InventoryTable 
            items={filteredItems}
            onEdit={openEditDialog}
            onDelete={handleDeleteItem}
          />
        )}
      </div>

      {/* Add Item Dialog */}
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
    </div>
  );
};

export default Index;
