import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "@/components/Sidebar";
import RequestPanel from "@/components/RequestPanel";
import ResponsePanel from "@/components/ResponsePanel";
import { SavedRequest, Collection, ResponseData, HttpMethod, Environment } from "@/types";
import { Separator } from "@/components/ui/separator";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_REQUEST: SavedRequest = {
  id: uuidv4(),
  name: "New Request",
  url: "https://jsonplaceholder.typicode.com/todos/1",
  method: "GET" as HttpMethod,
  headers: [
    { key: "Content-Type", value: "application/json", enabled: true },
    { key: "Accept", value: "application/json", enabled: true },
  ],
  params: [],
  body: "",
  auth: {
    type: "none"
  },
  timestamp: Date.now()
};

const Index = () => {
  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem("collections");
    return saved ? JSON.parse(saved) : [
      {
        id: uuidv4(),
        name: "Sample Collection",
        requests: [
          {
            id: uuidv4(),
            name: "Get Todo",
            url: "https://jsonplaceholder.typicode.com/todos/1",
            method: "GET",
            headers: [
              { key: "Accept", value: "application/json", enabled: true },
            ],
            params: [],
            body: "",
            collectionId: "1",
            timestamp: Date.now() - 1000 * 60 * 60 // 1 hour ago
          },
          {
            id: uuidv4(),
            name: "Create Todo",
            url: "https://jsonplaceholder.typicode.com/todos",
            method: "POST",
            headers: [
              { key: "Content-Type", value: "application/json", enabled: true },
              { key: "Accept", value: "application/json", enabled: true },
            ],
            params: [],
            body: JSON.stringify({
              title: "New todo",
              completed: false,
              userId: 1,
            }, null, 2),
            collectionId: "1",
            timestamp: Date.now() - 1000 * 60 * 30 // 30 minutes ago
          },
        ],
      },
    ];
  });
  
  const [environments, setEnvironments] = useState<Environment[]>(() => {
    const saved = localStorage.getItem("environments");
    return saved ? JSON.parse(saved) : [
      {
        id: uuidv4(),
        name: "Development",
        variables: [
          { key: "baseUrl", value: "https://jsonplaceholder.typicode.com", enabled: true },
          { key: "apiKey", value: "dev-api-key-123", enabled: true },
        ],
      },
      {
        id: uuidv4(),
        name: "Production",
        variables: [
          { key: "baseUrl", value: "https://api.example.com", enabled: true },
          { key: "apiKey", value: "prod-api-key-456", enabled: true },
        ],
      },
    ];
  });
  
  const [currentEnvironmentId, setCurrentEnvironmentId] = useState<string | null>(() => {
    const saved = localStorage.getItem("currentEnvironmentId");
    return saved || null;
  });
  
  const [history, setHistory] = useState<SavedRequest[]>(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentRequest, setCurrentRequest] = useState<SavedRequest>(DEFAULT_REQUEST);
  const [activeRequestId, setActiveRequestId] = useState<string | undefined>(undefined);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  
  const { toast } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("collections", JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem("environments", JSON.stringify(environments));
  }, [environments]);

  useEffect(() => {
    if (currentEnvironmentId) {
      localStorage.setItem("currentEnvironmentId", currentEnvironmentId);
    } else {
      localStorage.removeItem("currentEnvironmentId");
    }
  }, [currentEnvironmentId]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const addToHistory = (request: SavedRequest) => {
    const MAX_HISTORY = 50;
    const existingIndex = history.findIndex(r => r.id === request.id);
    
    const updatedRequest = {
      ...request,
      timestamp: Date.now(),
      name: request.name || `${request.method} ${request.url.split('/').pop() || ''}`
    };
    
    let newHistory;
    if (existingIndex !== -1) {
      newHistory = [
        updatedRequest,
        ...history.slice(0, existingIndex),
        ...history.slice(existingIndex + 1),
      ].slice(0, MAX_HISTORY);
    } else {
      newHistory = [updatedRequest, ...history].slice(0, MAX_HISTORY);
    }
    
    setHistory(newHistory);
    
    if (updatedRequest.id === currentRequest.id) {
      setCurrentRequest({
        ...currentRequest,
        response: updatedRequest.response
      });
    }
  };

  const handleSelectRequest = (request: SavedRequest) => {
    setCurrentRequest(request);
    setActiveRequestId(request.id);
    if (request.response) {
      setResponse(request.response);
    } else {
      setResponse(null);
    }
  };

  const handleNewRequest = () => {
    const newRequest = {
      ...DEFAULT_REQUEST,
      id: uuidv4(),
      timestamp: Date.now()
    };
    setCurrentRequest(newRequest);
    setActiveRequestId(undefined);
    setResponse(null);
  };

  const handleCreateCollection = (name: string) => {
    const newCollection: Collection = {
      id: uuidv4(),
      name,
      requests: [],
    };
    setCollections([...collections, newCollection]);
    toast({
      title: "Collection created",
      description: `Collection '${name}' has been created`,
    });
  };

  const handleSaveRequest = (request: SavedRequest, name: string) => {
    const updatedRequest = { 
      ...request, 
      name,
      timestamp: Date.now(),
      response: response
    };
    
    let foundInCollection = false;
    const updatedCollections = collections.map(collection => {
      const requestIndex = collection.requests.findIndex(r => r.id === request.id);
      if (requestIndex !== -1) {
        foundInCollection = true;
        const updatedRequests = [...collection.requests];
        updatedRequests[requestIndex] = updatedRequest;
        return { ...collection, requests: updatedRequests };
      }
      return collection;
    });

    if (foundInCollection) {
      setCollections(updatedCollections);
      toast({
        title: "Request updated",
        description: `Request '${name}' has been updated`,
      });
    } else {
      if (collections.length > 0) {
        const updatedCollections = [...collections];
        const firstCollection = updatedCollections[0];
        firstCollection.requests.push({ 
          ...updatedRequest, 
          collectionId: firstCollection.id 
        });
        setCollections(updatedCollections);
        toast({
          title: "Request saved",
          description: `Request '${name}' has been saved to '${firstCollection.name}'`,
        });
      } else {
        const newCollection: Collection = {
          id: uuidv4(),
          name: "My Collection",
          requests: [{ ...updatedRequest, collectionId: "1" }],
        };
        setCollections([newCollection]);
        toast({
          title: "Request saved",
          description: `Request '${name}' has been saved to 'My Collection'`,
        });
      }
    }

    addToHistory(updatedRequest);

    setCurrentRequest(updatedRequest);
    setActiveRequestId(updatedRequest.id);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-gray-900 text-foreground dark:text-gray-100">
      <Sidebar
        collections={collections}
        history={history}
        onSelectRequest={handleSelectRequest}
        onNewRequest={handleNewRequest}
        onCreateCollection={handleCreateCollection}
        activeRequestId={activeRequestId}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={50}>
            <RequestPanel
              currentRequest={currentRequest}
              onRequestChange={setCurrentRequest}
              onSaveRequest={handleSaveRequest}
              setResponse={setResponse}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              environments={environments}
              currentEnvironmentId={currentEnvironmentId}
              onEnvironmentChange={setCurrentEnvironmentId}
              onEnvironmentsChange={setEnvironments}
              addToHistory={addToHistory}
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          <ResizablePanel defaultSize={50}>
            <ResponsePanel response={response} isLoading={isLoading} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
