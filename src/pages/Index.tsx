
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import InventoryTable from "@/components/InventoryTable";
import InventoryForm from "@/components/InventoryForm";
import EmptyState from "@/components/EmptyState";
import { InventoryItem } from "@/lib/types";

const Index = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
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

        {items.length === 0 ? (
          <EmptyState onAddItem={() => setIsFormOpen(true)} />
        ) : (
          <InventoryTable 
            items={items}
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
