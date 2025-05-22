
import { SavedRequest } from "@/types";
import { cn } from "@/lib/utils";
import { Clock, PlayCircle } from "lucide-react";
import { formatDistance } from "date-fns";

interface HistoryItemProps {
  request: SavedRequest;
  onClick: (request: SavedRequest) => void;
  isActive?: boolean;
}

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  PUT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
};

const statusColors: Record<string, string> = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  pending: "text-amber-600 dark:text-amber-400",
};

const HistoryItem = ({ request, onClick, isActive }: HistoryItemProps) => {
  // Generate a readable timestamp for display
  const timestamp = request.timestamp ? new Date(request.timestamp) : new Date();
  const timeAgo = formatDistance(timestamp, new Date(), { addSuffix: true });
  
  // Determine status color based on response
  let statusColor = statusColors.pending;
  let statusText = "No response";
  
  if (request.response) {
    if (request.response.status >= 200 && request.response.status < 300) {
      statusColor = statusColors.success;
      statusText = `${request.response.status} ${request.response.statusText}`;
    } else if (request.response.status >= 400) {
      statusColor = statusColors.error;
      statusText = `${request.response.status} ${request.response.statusText}`;
    } else {
      statusText = `${request.response.status} ${request.response.statusText}`;
    }
  }
  
  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col gap-1 rounded-md border p-3 hover:bg-muted/50 transition-colors",
        isActive && "bg-muted border-orange-400"
      )}
      onClick={() => onClick(request)}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-xs font-semibold px-2 py-1 rounded",
            methodColors[request.method]
          )}
        >
          {request.method}
        </span>
        <span className="font-medium truncate flex-1">{request.name}</span>
        <PlayCircle className="h-4 w-4 text-orange-500 opacity-0 hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-xs text-muted-foreground truncate">
        {request.url}
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          {timeAgo}
        </div>
        {request.response && (
          <div className={cn("font-medium", statusColor)}>
            {statusText}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryItem;
