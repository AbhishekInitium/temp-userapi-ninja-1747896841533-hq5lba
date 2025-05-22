
import { Collection as CollectionType, SavedRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Settings, User, Moon, Sun } from "lucide-react";
import Collection from "./Collection";
import HistoryItem from "./HistoryItem";
import { useState } from "react";

interface SidebarProps {
  collections: CollectionType[];
  history: SavedRequest[];
  onSelectRequest: (request: SavedRequest) => void;
  onNewRequest: () => void;
  onCreateCollection: (name: string) => void;
  activeRequestId?: string;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Sidebar = ({
  collections,
  history,
  onSelectRequest,
  onNewRequest,
  onCreateCollection,
  activeRequestId,
  darkMode,
  toggleDarkMode,
}: SidebarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isAddingCollection, setIsAddingCollection] = useState(false);

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      onCreateCollection(newCollectionName.trim());
      setNewCollectionName("");
      setIsAddingCollection(false);
    }
  };

  const filteredCollections = collections.map(collection => ({
    ...collection,
    requests: collection.requests.filter(req => 
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.url.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(collection => collection.requests.length > 0);

  const filteredHistory = history.filter(req => 
    req.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full w-[280px] flex-col bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center">
          <span className="text-xl font-bold text-orange-600">API Ninja</span>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="p-2">
        <Button onClick={onNewRequest} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>
      
      <div className="px-2 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="collections" className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="collections" className="flex-1 overflow-auto p-2">
          {isAddingCollection ? (
            <div className="mb-4 space-y-2">
              <Input
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                autoFocus
              />
              <div className="flex space-x-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleCreateCollection}
                  className="flex-1"
                >
                  Create
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAddingCollection(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="mb-2 w-full justify-start text-muted-foreground"
              onClick={() => setIsAddingCollection(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Collection
            </Button>
          )}
          
          {filteredCollections.map((collection) => (
            <Collection
              key={collection.id}
              collection={collection}
              onSelectRequest={onSelectRequest}
              activeRequestId={activeRequestId}
            />
          ))}
          
          {filteredCollections.length === 0 && !isAddingCollection && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">No collections found</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="flex-1 overflow-auto p-2 space-y-2">
          {filteredHistory.map((request) => (
            <HistoryItem
              key={request.id}
              request={request}
              onClick={onSelectRequest}
              isActive={activeRequestId === request.id}
            />
          ))}
          
          {filteredHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">No history found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sidebar;
