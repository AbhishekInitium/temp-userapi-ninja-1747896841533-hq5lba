
import { Collection as CollectionType } from "@/types";
import { useState } from "react";
import { ChevronDown, ChevronRight, FolderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SavedRequest } from "@/types";

interface CollectionProps {
  collection: CollectionType;
  onSelectRequest: (request: SavedRequest) => void;
  activeRequestId?: string;
}

const Collection = ({
  collection,
  onSelectRequest,
  activeRequestId,
}: CollectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-2">
      <div
        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
        onClick={toggleExpand}
      >
        <button onClick={toggleExpand} className="p-0.5">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <FolderIcon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{collection.name}</span>
      </div>
      
      {isExpanded && (
        <div className="ml-4 mt-1 border-l pl-2">
          {collection.requests.map((request) => (
            <div
              key={request.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50",
                activeRequestId === request.id && "bg-muted"
              )}
              onClick={() => onSelectRequest(request)}
            >
              <span
                className={cn(
                  "text-xs font-semibold",
                  request.method === "GET" && "text-green-600",
                  request.method === "POST" && "text-blue-600",
                  request.method === "PUT" && "text-amber-600",
                  request.method === "DELETE" && "text-red-600",
                  request.method === "PATCH" && "text-purple-600"
                )}
              >
                {request.method}
              </span>
              <span className="truncate">{request.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collection;
