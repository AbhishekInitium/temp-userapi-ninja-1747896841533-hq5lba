
import { ResponseData, ResponseViewMode } from "@/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Clock, Database, Code, Copy, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResponsePanelProps {
  response: ResponseData | null;
  isLoading: boolean;
}

const ResponsePanel = ({ response, isLoading }: ResponsePanelProps) => {
  const [formattedResponse, setFormattedResponse] = useState<string>("");
  const [activeTab, setActiveTab] = useState("body");
  const [viewMode, setViewMode] = useState<ResponseViewMode>("json");
  const { toast } = useToast();

  useEffect(() => {
    if (response?.data) {
      formatResponseData(response.data, viewMode);
    } else {
      setFormattedResponse("");
    }
  }, [response, viewMode]);

  const formatResponseData = (data: any, mode: ResponseViewMode) => {
    if (!data) {
      setFormattedResponse("");
      return;
    }

    try {
      switch (mode) {
        case "json":
          if (typeof data === "object") {
            setFormattedResponse(JSON.stringify(data, null, 2));
          } else if (typeof data === "string" && isJsonString(data)) {
            setFormattedResponse(JSON.stringify(JSON.parse(data), null, 2));
          } else {
            setFormattedResponse(String(data));
          }
          break;
        case "xml":
          if (typeof data === "string" && isXmlString(data)) {
            // Pretty format XML - basic implementation
            setFormattedResponse(formatXml(data));
          } else {
            setFormattedResponse(String(data));
          }
          break;
        case "html":
          if (typeof data === "string") {
            setFormattedResponse(data);
          } else {
            setFormattedResponse(String(data));
          }
          break;
        case "raw":
        default:
          setFormattedResponse(typeof data === "string" ? data : String(data));
          break;
      }
    } catch (error) {
      console.error("Error formatting response:", error);
      setFormattedResponse(String(data));
    }
  };

  const isJsonString = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isXmlString = (str: string) => {
    return /^\s*<[\s\S]*>/.test(str);
  };

  const formatXml = (xml: string) => {
    // Very basic XML formatting - for complex XML, a proper formatter library would be better
    let formatted = '';
    let indent = '';
    const tab = '  ';
    
    xml.split(/>\s*</).forEach(function(node) {
      if (node.match(/^\/\w/)) {
        indent = indent.substring(tab.length);
      }
      
      formatted += indent + '<' + node + '>\r\n';
      
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.match(/\/>/)) {
        indent += tab;
      }
    });
    
    return formatted.substring(1, formatted.length - 3);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedResponse);
    toast({
      title: "Copied!",
      description: "Response copied to clipboard",
    });
  };

  const downloadResponse = () => {
    const blob = new Blob([formattedResponse], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `response-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Response downloaded as JSON file",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600"></div>
        <p className="mt-4 text-muted-foreground">Sending request...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <p className="text-muted-foreground">Send a request to see the response</p>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-blue-500";
    if (status >= 400 && status < 500) return "bg-amber-500";
    if (status >= 500) return "bg-red-500";
    return "bg-gray-500"; // For status 0 (error)
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Badge className={`${getStatusColor(response.status)} text-white`}>
            {response.status}
          </Badge>
          <span className="font-medium">{response.statusText}</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>{response.time}ms</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Database className="mr-1 h-4 w-4" />
            <span>{(response.size / 1024).toFixed(2)} KB</span>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="flex items-center justify-between px-4 pt-2">
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {viewMode.toUpperCase()}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setViewMode("raw")}>
                  Raw
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("json")}>
                  JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("xml")}>
                  XML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("html")}>
                  HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("preview")}>
                  Preview
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="mr-1 h-4 w-4" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={downloadResponse}>
              <Download className="mr-1 h-4 w-4" /> Download
            </Button>
          </div>
        </div>
        
        <TabsContent value="body" className="flex-1 p-4">
          {viewMode === "preview" && typeof response.data === "string" && isXmlString(response.data) ? (
            <div className="h-full max-h-[500px] overflow-auto bg-white p-4">
              <iframe 
                srcDoc={response.data}
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
                title="Response Preview"
              />
            </div>
          ) : (
            <pre className={`h-full max-h-[500px] overflow-auto rounded-md ${viewMode === "json" ? "bg-muted" : "bg-white"} p-4 font-mono text-sm`}>
              {formattedResponse}
            </pre>
          )}
        </TabsContent>
        
        <TabsContent value="headers" className="flex-1 p-4">
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Header</th>
                  <th className="p-2 text-left font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers).map(([key, value]) => (
                  <tr key={key} className="border-b">
                    <td className="p-2 font-mono text-sm">{key}</td>
                    <td className="p-2 font-mono text-sm">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        
        <TabsContent value="cookies" className="flex-1 p-4">
          <div className="rounded-md border p-4">
            <h3 className="text-lg font-medium mb-4">Cookies</h3>
            <div className="text-muted-foreground">
              No cookies were found in the response.
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="tests" className="flex-1 p-4">
          <div className="rounded-md border p-4">
            <h3 className="text-lg font-medium mb-4">Test Results</h3>
            <div className="text-muted-foreground">
              No tests were run for this request. Add test scripts in the Tests tab before sending the request.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResponsePanel;
