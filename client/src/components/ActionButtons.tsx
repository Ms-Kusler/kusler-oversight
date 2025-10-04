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
        className="justify-start gap-2"
        onClick={() => {
          console.log('New Invoice clicked');
          onNewInvoice?.();
        }}
        data-testid="button-new-invoice"
      >
        <Plus className="w-4 h-4" />
        New Invoice
      </Button>
      <Button
        variant="outline"
        className="justify-start gap-2"
        onClick={() => {
          console.log('Add Expense clicked');
          onAddExpense?.();
        }}
        data-testid="button-add-expense"
      >
        <Plus className="w-4 h-4" />
        Add Expense
      </Button>
    </div>
  );
}
