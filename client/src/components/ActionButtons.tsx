import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onNewInvoice?: () => void;
  onAddExpense?: () => void;
}

export default function ActionButtons({ onNewInvoice, onAddExpense }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        className="justify-start gap-2 backdrop-blur-xl bg-card/60 border-border/50 hover-elevate active-elevate-2 transition-all duration-300 group"
        onClick={() => {
          console.log('New Invoice clicked');
          onNewInvoice?.();
        }}
        data-testid="button-new-invoice"
      >
        <div className="p-1 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
          <Plus className="w-4 h-4 text-primary" />
        </div>
        <span>New Invoice</span>
      </Button>
      
      <Button
        variant="outline"
        className="justify-start gap-2 backdrop-blur-xl bg-card/60 border-border/50 hover-elevate active-elevate-2 transition-all duration-300 group"
        onClick={() => {
          console.log('Add Expense clicked');
          onAddExpense?.();
        }}
        data-testid="button-add-expense"
      >
        <div className="p-1 rounded-md bg-destructive/10 group-hover:bg-destructive/20 transition-colors duration-300">
          <Plus className="w-4 h-4 text-destructive" />
        </div>
        <span>Add Expense</span>
      </Button>
    </div>
  );
}
