import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface TimePeriodSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function TimePeriodSelector({ value = "This Month", onChange }: TimePeriodSelectorProps) {
  const [selected, setSelected] = useState(value);
  
  const periods = ["This Month", "This Quarter", "This Year"];

  const handleSelect = (period: string) => {
    console.log(`Period selected: ${period}`);
    setSelected(period);
    onChange?.(period);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 font-normal"
          data-testid="button-period-selector"
        >
          {selected}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {periods.map((period) => (
          <DropdownMenuItem
            key={period}
            onClick={() => handleSelect(period)}
            data-testid={`option-${period.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {period}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
