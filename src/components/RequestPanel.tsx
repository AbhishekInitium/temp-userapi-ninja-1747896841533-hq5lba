
import { SavedRequest, HttpMethod, ResponseData, Environment, AuthType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import RequestMethod from "./RequestMethod";
import RequestUrl from "./RequestUrl";
import RequestOptions from "./RequestOptions";
import RequestBody from "./RequestBody";
import RequestAuth from "./RequestAuth";
import EnvironmentManager from "./EnvironmentManager";
import { sendRequest, ResponseWithRequest } from "@/utils/httpClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { v4 as uuidv4 } from "uuid";

interface RequestPanelProps {
  currentRequest: SavedRequest;
  onRequestChange: (request: SavedRequest) => void;
  onSaveRequest: (request: SavedRequest, name: string) => void;
  setResponse: (response: ResponseData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  environments: Environment[];
  currentEnvironmentId: string | null;
  onEnvironmentChange: (environmentId: string | null) => void;
  onEnvironmentsChange: (environments: Environment[]) => void;
  addToHistory: (request: SavedRequest) => void;
}

const RequestPanel = ({
  currentRequest,
  onRequestChange,
  onSaveRequest,
  setResponse,
  isLoading,
  setIsLoading,
  environments,
  currentEnvironmentId,
  onEnvironmentChange,
  onEnvironmentsChange,
  addToHistory,
}: RequestPanelProps) => {
  const [activeTab, setActiveTab] = useState("params");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [requestName, setRequestName] = useState(currentRequest.name || "");
  const [processedUrl, setProcessedUrl] = useState(currentRequest.url);

  const currentEnvironment = currentEnvironmentId 
    ? environments.find(env => env.id === currentEnvironmentId) || null
    : null;

  useEffect(() => {
    let newUrl = currentRequest.url;
    if (currentEnvironment) {
      currentEnvironment.variables
        .filter(v => v.enabled)
        .forEach(({ key, value }) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          newUrl = newUrl.replace(regex, value);
        });
    }
    setProcessedUrl(newUrl);
  }, [currentRequest.url, currentEnvironment]);

  const handleMethodChange = (method: HttpMethod) => {
    onRequestChange({ ...currentRequest, method });
  };

  const handleUrlChange = (url: string) => {
    onRequestChange({ ...currentRequest, url });
  };

  const handleHeadersChange = (headers: typeof currentRequest.headers) => {
    onRequestChange({ ...currentRequest, headers });
  };

  const handleParamsChange = (params: typeof currentRequest.params) => {
    onRequestChange({ ...currentRequest, params });
  };

  const handleBodyChange = (body: string) => {
    onRequestChange({ ...currentRequest, body });
  };

  const handleAuthChange = (authType: AuthType, authData: any) => {
    onRequestChange({
      ...currentRequest,
      auth: {
        type: authType,
        ...authData
      }
    });
  };

  const handleSaveRequest = () => {
    if (requestName.trim()) {
      onSaveRequest(currentRequest, requestName);
      setSaveDialogOpen(false);
    }
  };

  const handleSendRequest = async () => {
    setIsLoading(true);
    setResponse(null);
    try {
      const processedHeaders = [...currentRequest.headers];
      const processedBody = currentRequest.body;
      
      if (currentEnvironment) {
        processedHeaders.forEach(header => {
          if (header.enabled) {
            currentEnvironment.variables
              .filter(v => v.enabled)
              .forEach(({ key, value }) => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                header.value = header.value.replace(regex, value);
              });
          }
        });
      }
      
      const result = await sendRequest({
        method: currentRequest.method,
        url: processedUrl,
        headers: processedHeaders,
        params: currentRequest.params,
        body: processedBody,
        auth: currentRequest.auth,
        requestId: currentRequest.id,
      });
      
      setResponse(result.response);
      
      // Create a new request object with the current request details and response
      const historyRequest: SavedRequest = {
        ...currentRequest,
        id: currentRequest.id || uuidv4(),
        name: requestName || `${currentRequest.method} ${currentRequest.url.split('/').pop() || ''}`,
        timestamp: Date.now(),
        response: result.response
      };
      
      // Add to history
      addToHistory(historyRequest);
    } catch (error) {
      console.error("Request error:", error);
      const errorResponse = {
        status: 0,
        statusText: "Error",
        headers: {},
        data: error instanceof Error ? error.message : "Unknown error",
        time: 0,
        size: 0,
      };
      setResponse(errorResponse);
      
      // Still add failed requests to history
      const historyRequest: SavedRequest = {
        ...currentRequest,
        id: currentRequest.id || uuidv4(),
        name: requestName || `${currentRequest.method} ${currentRequest.url.split('/').pop() || ''}`,
        timestamp: Date.now(),
        response: errorResponse
      };
      
      addToHistory(historyRequest);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col min-h-full">
        <div className="flex items-center gap-2 p-4 border-b">
          <div className="flex items-center gap-2 flex-1">
            <RequestMethod method={currentRequest.method} onMethodChange={handleMethodChange} />
            <RequestUrl
              url={currentRequest.url}
              onUrlChange={handleUrlChange}
              onSendRequest={handleSendRequest}
              isLoading={isLoading}
              environments={environments.map(env => ({ label: env.name, value: env.id }))}
              variables={currentEnvironment?.variables.filter(v => v.enabled) || []}
            />
          </div>
          
          <EnvironmentManager
            environments={environments}
            currentEnvironment={currentEnvironment}
            onEnvironmentChange={onEnvironmentChange}
            onEnvironmentsChange={onEnvironmentsChange}
          />
          
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="ml-2">
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Request</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Request name"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRequest}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="authorization">Authorization</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="params" className="p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <RequestOptions
                    headers={currentRequest.headers}
                    params={currentRequest.params}
                    onHeadersChange={handleHeadersChange}
                    onParamsChange={handleParamsChange}
                    tabName="params"
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="authorization" className="p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <RequestAuth 
                    auth={currentRequest.auth}
                    onAuthChange={handleAuthChange}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="headers" className="p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <RequestOptions
                    headers={currentRequest.headers}
                    params={currentRequest.params}
                    onHeadersChange={handleHeadersChange}
                    onParamsChange={handleParamsChange}
                    tabName="headers"
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="body" className="p-0 h-full">
              <ScrollArea className="h-full">
                <RequestBody
                  method={currentRequest.method}
                  body={currentRequest.body}
                  onBodyChange={handleBodyChange}
                />
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="tests" className="p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="h-full w-full flex flex-col">
                    <h3 className="text-lg font-medium mb-2">Test Scripts</h3>
                    <p className="text-muted-foreground mb-4">
                      Write JavaScript code to test your response. Results will appear in the Tests tab of the response.
                    </p>
                    <Textarea
                      className="flex-1 min-h-[200px] font-mono text-sm"
                      placeholder={`// Example test script:
pm.test("Status code is 200", function() {
    pm.response.to.have.status(200);
});

pm.test("Response has expected data", function() {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
});`}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Request Settings</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Configure advanced settings for this request</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="cookies" className="p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cookies</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Manage cookies for this request</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

export default RequestPanel;

const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return (
    <textarea
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};
