
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useState, useEffect } from "react";

interface RequestUrlProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSendRequest: () => void;
  isLoading: boolean;
  environments: { label: string; value: string }[];
  variables: { key: string; value: string }[];
}

const RequestUrl = ({
  url,
  onUrlChange,
  onSendRequest,
  isLoading,
  environments = [],
  variables = [],
}: RequestUrlProps) => {
  const [processedUrl, setProcessedUrl] = useState(url);

  // Replace any variables in the URL (format: {{variableName}})
  useEffect(() => {
    let newUrl = url;
    variables.forEach(({ key, value }) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      newUrl = newUrl.replace(regex, value);
    });
    setProcessedUrl(newUrl);
  }, [url, variables]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendRequest();
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <Input
        type="url"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="Enter request URL"
        className="flex-1"
        required
      />
      <Button 
        type="submit" 
        disabled={isLoading}
        className="bg-orange-600 hover:bg-orange-700 text-white"
      >
        {isLoading ? "Sending..." : "Send"}
        <Send className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
};

export default RequestUrl;
