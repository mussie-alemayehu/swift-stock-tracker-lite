
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, FileUp, Loader2 } from "lucide-react";
import { inventoryService } from "@/lib/inventoryService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface ImportInventoryDialogProps {
  onImportComplete: () => void;
  onCancel: () => void;
}

const ImportInventoryDialog = ({ onImportComplete, onCancel }: ImportInventoryDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ row: number; error: string }[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrors([]);
      setShowErrors(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error("Only CSV files are supported");
      return;
    }

    try {
      setIsLoading(true);
      setErrors([]);
      
      // Read file content
      const fileContent = await file.text();
      
      // Process import
      const result = await inventoryService.importInventoryFromCsv(fileContent);
      
      if (result.errors.length > 0) {
        setErrors(result.errors);
        setShowErrors(true);
        
        if (result.success.length > 0) {
          toast.success(`Imported ${result.success.length} items successfully`, {
            description: `${result.errors.length} items had errors and were not imported.`
          });
        } else {
          toast.error("Import failed", {
            description: `All ${result.errors.length} items had errors and could not be imported.`
          });
        }
      } else {
        toast.success(`Imported ${result.success.length} items successfully`);
        onImportComplete();
      }
    } catch (error: any) {
      toast.error("Import failed", {
        description: error.message || "An error occurred during import"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Import Inventory</DialogTitle>
        <DialogDescription>
          Upload a CSV file to bulk import inventory items. 
          The file should include headers for: Name, Description, Quantity, Unit, Purchase Date, 
          Supplier, SKU, and Min Stock Threshold.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="grid w-full items-center gap-1.5">
          <label htmlFor="importFile" className="text-sm font-medium">
            CSV File
          </label>
          <Input
            id="importFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">
            Only CSV files are supported. Make sure your file has the correct headers.
          </p>
        </div>

        {showErrors && errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Import Errors</AlertTitle>
            <AlertDescription>
              <p>The following errors were encountered during import:</p>
              <ul className="mt-2 max-h-40 overflow-y-auto text-sm">
                {errors.map((error, index) => (
                  <li key={index}>
                    Row {error.row}: {error.error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {showErrors && errors.length > 0 && (
          <div className="text-sm text-gray-500">
            <p>Example CSV format:</p>
            <pre className="mt-1 rounded bg-gray-100 p-2 overflow-x-auto text-xs">
              Name,Description,Quantity,Unit,Purchase Date,Supplier,SKU,Min Stock Threshold<br/>
              "Rice","Long grain white rice",100,kg,2023-01-15,"Global Foods","RICE001",25<br/>
              "Flour","All purpose flour",50,kg,2023-02-20,"Baker's Supply","FLOUR002",10
            </pre>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={!file || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Import
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ImportInventoryDialog;
