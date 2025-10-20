import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddInvoiceDialog from "@/components/AddInvoiceDialog";
import AddExpenseDialog from "@/components/AddExpenseDialog";

export default function ActionButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <AddInvoiceDialog
        trigger={
          <Button
            variant="outline"
            className="justify-start gap-2 backdrop-blur-xl bg-card/60 border-border/50 hover-elevate active-elevate-2 transition-all duration-300 group"
            data-testid="button-new-invoice"
          >
            <div className="p-1 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <span>New Invoice</span>
          </Button>
        }
      />
      
      <AddExpenseDialog
        trigger={
          <Button
            variant="outline"
            className="justify-start gap-2 backdrop-blur-xl bg-card/60 border-border/50 hover-elevate active-elevate-2 transition-all duration-300 group"
            data-testid="button-add-expense"
          >
            <div className="p-1 rounded-md bg-destructive/10 group-hover:bg-destructive/20 transition-colors duration-300">
              <Plus className="w-4 h-4 text-destructive" />
            </div>
            <span>Add Expense</span>
          </Button>
        }
      />
    </div>
  );
}
