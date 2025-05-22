
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HttpMethod } from "@/types";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RequestBodyProps {
  method: HttpMethod;
  body: string;
  onBodyChange: (body: string) => void;
}

const RequestBody = ({ method, body, onBodyChange }: RequestBodyProps) => {
  const [contentType, setContentType] = useState("application/json");
  const [formattedBody, setFormattedBody] = useState(body);
  
  const isBodyAllowed = method !== "GET";
  
  useEffect(() => {
    // When content type changes, try to format the body
    if (contentType === "application/json" && body) {
      try {
        const parsed = JSON.parse(body);
        setFormattedBody(JSON.stringify(parsed, null, 2));
      } catch (e) {
        // If it's not valid JSON, keep as is
        setFormattedBody(body);
      }
    } else {
      setFormattedBody(body);
    }
  }, [contentType, body]);

  const handleBodyChange = (value: string) => {
    setFormattedBody(value);
    onBodyChange(value);
  };

  const formatJson = () => {
    if (contentType === "application/json" && formattedBody) {
      try {
        const parsed = JSON.parse(formattedBody);
        const formatted = JSON.stringify(parsed, null, 2);
        setFormattedBody(formatted);
        onBodyChange(formatted);
      } catch (e) {
        console.error("Invalid JSON");
      }
    }
  };

  if (!isBodyAllowed) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Body is not applicable for GET requests
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-1">
        <div className="flex items-center justify-between">
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="application/json">JSON</SelectItem>
              <SelectItem value="application/xml">XML</SelectItem>
              <SelectItem value="text/plain">Text</SelectItem>
              <SelectItem value="application/x-www-form-urlencoded">Form URL Encoded</SelectItem>
            </SelectContent>
          </Select>
          
          {contentType === "application/json" && (
            <button
              type="button"
              onClick={formatJson}
              className="text-sm text-blue-600 hover:underline"
            >
              Format JSON
            </button>
          )}
        </div>
        
        <Textarea
          value={formattedBody}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder={contentType === "application/json" ? "{\n  \"key\": \"value\"\n}" : "Request body"}
          className="min-h-[200px] font-mono text-sm"
        />
      </div>
    </ScrollArea>
  );
};

export default RequestBody;
