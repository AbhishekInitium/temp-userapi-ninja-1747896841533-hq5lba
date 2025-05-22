
import { Button } from "@/components/ui/button";
import { HttpMethod } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface RequestMethodProps {
  method: HttpMethod;
  onMethodChange: (method: HttpMethod) => void;
}

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-green-500 hover:bg-green-600",
  POST: "bg-blue-500 hover:bg-blue-600",
  PUT: "bg-amber-500 hover:bg-amber-600",
  DELETE: "bg-red-500 hover:bg-red-600",
  PATCH: "bg-purple-500 hover:bg-purple-600",
};

const RequestMethod = ({ method, onMethodChange }: RequestMethodProps) => {
  const methods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[100px] font-semibold text-white",
            methodColors[method]
          )}
        >
          {method} <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[100px]">
        {methods.map((m) => (
          <DropdownMenuItem
            key={m}
            onClick={() => onMethodChange(m)}
            className={cn(
              "justify-center font-semibold",
              method === m && "bg-muted"
            )}
          >
            {m}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RequestMethod;
