
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { QueryParam, RequestHeader } from "@/types";
import { Plus, Trash } from "lucide-react";
import { useState, useEffect } from "react";

interface RequestOptionsProps {
  headers: RequestHeader[];
  params: QueryParam[];
  onHeadersChange: (headers: RequestHeader[]) => void;
  onParamsChange: (params: QueryParam[]) => void;
  tabName?: string; // Make tabName optional
}

const RequestOptions = ({
  headers,
  params,
  onHeadersChange,
  onParamsChange,
  tabName,
}: RequestOptionsProps) => {
  // Set default tab based on tabName prop if provided, otherwise use 'headers'
  const [activeTab, setActiveTab] = useState(tabName || "headers");
  
  // Update activeTab when tabName prop changes
  useEffect(() => {
    if (tabName) {
      setActiveTab(tabName);
    }
  }, [tabName]);

  const addHeader = () => {
    onHeadersChange([...headers, { key: "", value: "", enabled: true }]);
  };

  const updateHeader = (index: number, field: keyof RequestHeader, value: string | boolean) => {
    const updatedHeaders = [...headers];
    updatedHeaders[index] = { ...updatedHeaders[index], [field]: value };
    onHeadersChange(updatedHeaders);
  };

  const removeHeader = (index: number) => {
    onHeadersChange(headers.filter((_, i) => i !== index));
  };

  const addParam = () => {
    onParamsChange([...params, { key: "", value: "", enabled: true }]);
  };

  const updateParam = (index: number, field: keyof QueryParam, value: string | boolean) => {
    const updatedParams = [...params];
    updatedParams[index] = { ...updatedParams[index], [field]: value };
    onParamsChange(updatedParams);
  };

  const removeParam = (index: number) => {
    onParamsChange(params.filter((_, i) => i !== index));
  };

  return (
    <Tabs defaultValue="headers" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="headers">Headers</TabsTrigger>
        <TabsTrigger value="params">Query Params</TabsTrigger>
      </TabsList>
      
      <TabsContent value="headers" className="space-y-4">
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 p-2"></th>
                <th className="p-2 text-left font-medium">Key</th>
                <th className="p-2 text-left font-medium">Value</th>
                <th className="w-10 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {headers.map((header, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2 text-center">
                    <Checkbox
                      checked={header.enabled}
                      onCheckedChange={(checked) =>
                        updateHeader(index, "enabled", !!checked)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={header.key}
                      onChange={(e) => updateHeader(index, "key", e.target.value)}
                      placeholder="Header name"
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={header.value}
                      onChange={(e) => updateHeader(index, "value", e.target.value)}
                      placeholder="Header value"
                      className="h-8"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHeader(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={addHeader}
              className="w-full justify-start text-muted-foreground"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Header
            </Button>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="params" className="space-y-4">
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 p-2"></th>
                <th className="p-2 text-left font-medium">Key</th>
                <th className="p-2 text-left font-medium">Value</th>
                <th className="w-10 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {params.map((param, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2 text-center">
                    <Checkbox
                      checked={param.enabled}
                      onCheckedChange={(checked) =>
                        updateParam(index, "enabled", !!checked)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={param.key}
                      onChange={(e) => updateParam(index, "key", e.target.value)}
                      placeholder="Parameter name"
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={param.value}
                      onChange={(e) => updateParam(index, "value", e.target.value)}
                      placeholder="Parameter value"
                      className="h-8"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParam(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={addParam}
              className="w-full justify-start text-muted-foreground"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Parameter
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default RequestOptions;
