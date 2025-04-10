
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddItem: () => void;
}

const EmptyState = ({ onAddItem }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 mb-4">
        <PackageOpen className="h-6 w-6 text-blue-500" />
      </div>
      <h3 className="mt-2 text-lg font-semibold text-gray-900">No inventory items</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by adding your first inventory item.
      </p>
      <div className="mt-6">
        <Button onClick={onAddItem}>
          Add New Item
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
