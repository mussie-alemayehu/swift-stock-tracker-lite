
import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonProps } from "@/components/ui/button";
import { inventoryService } from "@/lib/inventoryService";

type ExportInventoryButtonProps = Omit<ButtonProps, "onClick" | "children">;

const ExportInventoryButton = (props: ExportInventoryButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const csvContent = await inventoryService.exportInventoryToCsv();
      
      // Create a downloadable blob
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      // Create and trigger download link
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Inventory exported successfully");
    } catch (error: any) {
      toast.error("Export failed", {
        description: error.message || "An error occurred during export"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
      {...props}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </>
      )}
    </Button>
  );
};

export default ExportInventoryButton;
