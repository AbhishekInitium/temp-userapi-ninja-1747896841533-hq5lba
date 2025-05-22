
import { useState } from "react";
import { Environment, EnvironmentVariable } from "@/types";
import { v4 as uuidv4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Plus, Trash, Edit } from "lucide-react";

interface EnvironmentManagerProps {
  environments: Environment[];
  currentEnvironment: Environment | null;
  onEnvironmentChange: (environmentId: string | null) => void;
  onEnvironmentsChange: (environments: Environment[]) => void;
}

const EnvironmentManager = ({
  environments,
  currentEnvironment,
  onEnvironmentChange,
  onEnvironmentsChange,
}: EnvironmentManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarValue, setNewVarValue] = useState("");

  const handleSelectEnvironment = (value: string) => {
    if (value === "no-environment") {
      onEnvironmentChange(null);
    } else {
      onEnvironmentChange(value);
    }
  };

  const openEnvironmentEditor = (env: Environment | null = null) => {
    setEditingEnvironment(env || {
      id: uuidv4(),
      name: "",
      variables: [],
    });
    setIsDialogOpen(true);
  };

  const saveEnvironment = () => {
    if (!editingEnvironment) return;
    
    const updatedEnvironments = editingEnvironment.id 
      ? environments.map(env => env.id === editingEnvironment.id ? editingEnvironment : env)
      : [...environments, editingEnvironment];
    
    onEnvironmentsChange(updatedEnvironments);
    setIsDialogOpen(false);
    setEditingEnvironment(null);
  };

  const addVariable = () => {
    if (!editingEnvironment || !newVarKey.trim()) return;
    
    const newVariable: EnvironmentVariable = {
      key: newVarKey.trim(),
      value: newVarValue,
      enabled: true,
    };
    
    setEditingEnvironment({
      ...editingEnvironment,
      variables: [...editingEnvironment.variables, newVariable],
    });
    
    setNewVarKey("");
    setNewVarValue("");
  };

  const removeVariable = (index: number) => {
    if (!editingEnvironment) return;
    
    const updatedVariables = [...editingEnvironment.variables];
    updatedVariables.splice(index, 1);
    
    setEditingEnvironment({
      ...editingEnvironment,
      variables: updatedVariables,
    });
  };

  const updateVariable = (index: number, field: keyof EnvironmentVariable, value: string | boolean) => {
    if (!editingEnvironment) return;
    
    const updatedVariables = [...editingEnvironment.variables];
    updatedVariables[index] = { 
      ...updatedVariables[index], 
      [field]: value 
    };
    
    setEditingEnvironment({
      ...editingEnvironment,
      variables: updatedVariables,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentEnvironment?.id || "no-environment"}
        onValueChange={handleSelectEnvironment}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-environment">No Environment</SelectItem>
          {environments.map((env) => (
            <SelectItem key={env.id} value={env.id}>
              {env.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" onClick={() => openEnvironmentEditor(currentEnvironment)}>
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingEnvironment?.name ? `Edit Environment: ${editingEnvironment.name}` : "New Environment"}
            </DialogTitle>
          </DialogHeader>
          
          {editingEnvironment && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Environment Name</label>
                <Input
                  value={editingEnvironment.name}
                  onChange={(e) => setEditingEnvironment({
                    ...editingEnvironment,
                    name: e.target.value
                  })}
                  placeholder="Environment Name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Variables</label>
                <div className="mt-2 rounded-md border">
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
                      {editingEnvironment.variables.map((variable, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={variable.enabled}
                              onCheckedChange={(checked) => 
                                updateVariable(index, "enabled", !!checked)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={variable.key}
                              onChange={(e) => updateVariable(index, "key", e.target.value)}
                              placeholder="Variable name"
                              className="h-8"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={variable.value}
                              onChange={(e) => updateVariable(index, "value", e.target.value)}
                              placeholder="Variable value"
                              className="h-8"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeVariable(index)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="p-2 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={newVarKey}
                        onChange={(e) => setNewVarKey(e.target.value)}
                        placeholder="New variable key"
                        className="h-8"
                      />
                      <Input
                        value={newVarValue}
                        onChange={(e) => setNewVarValue(e.target.value)}
                        placeholder="New variable value"
                        className="h-8"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={addVariable}
                        className="h-8 w-8"
                        disabled={!newVarKey.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEnvironment}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Button variant="outline" size="icon" onClick={() => openEnvironmentEditor()}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default EnvironmentManager;
