
import * as React from "react"
import { Auth, AuthType } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { encryptData, decryptData, isEncrypted } from "@/utils/encryption";
import { useToast } from "@/hooks/use-toast";

interface RequestAuthProps {
  auth?: Auth;
  onAuthChange: (type: AuthType, data: any) => void;
}

const RequestAuth = ({ auth, onAuthChange }: RequestAuthProps) => {
  const [authType, setAuthType] = useState<AuthType>(auth?.type || "none");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (auth?.type) {
      setAuthType(auth.type);
    }
  }, [auth]);

  const handleAuthTypeChange = (value: AuthType) => {
    setAuthType(value);
    
    let authData = {};
    switch (value) {
      case "basic":
        authData = { basic: { username: "", password: "" } };
        break;
      case "bearer":
        authData = { bearer: { token: "" } };
        break;
      case "apiKey":
        authData = { apiKey: { key: "", value: "", in: "header" } };
        break;
      case "oauth2":
        authData = { oauth2: { token: "" } };
        break;
      default:
        authData = {};
    }
    
    onAuthChange(value, authData);
  };

  // Function to securely store sensitive data
  const encryptAndStore = async (field: string, value: string, authType: AuthType, fieldType: string) => {
    try {
      // Only encrypt if the value has changed and isn't already encrypted
      if (value && !isEncrypted(value)) {
        const encryptedValue = await encryptData(value);
        
        // Return the data based on auth type
        let authData: any = {};
        
        switch (authType) {
          case "basic":
            authData = {
              basic: {
                ...(auth?.basic || { username: "", password: "" }),
                [fieldType]: encryptedValue
              }
            };
            break;
          case "bearer":
            authData = { bearer: { token: encryptedValue } };
            break;
          case "apiKey":
            authData = {
              apiKey: {
                ...(auth?.apiKey || { key: "", value: "", in: "header" }),
                [fieldType]: fieldType === "key" ? value : encryptedValue
              }
            };
            break;
          case "oauth2":
            authData = { oauth2: { token: encryptedValue } };
            break;
        }
        
        onAuthChange(authType, authData);
        
        toast({
          title: "Credential Secured",
          description: `Your ${field} has been encrypted for security.`,
          duration: 3000,
        });
      } else {
        // Just update with the original value if it's empty or already encrypted
        let authData: any = {};
        
        switch (authType) {
          case "basic":
            authData = {
              basic: {
                ...(auth?.basic || { username: "", password: "" }),
                [fieldType]: value
              }
            };
            break;
          case "bearer":
            authData = { bearer: { token: value } };
            break;
          case "apiKey":
            authData = {
              apiKey: {
                ...(auth?.apiKey || { key: "", value: "", in: "header" }),
                [fieldType]: value
              }
            };
            break;
          case "oauth2":
            authData = { oauth2: { token: value } };
            break;
        }
        
        onAuthChange(authType, authData);
      }
    } catch (error) {
      console.error("Encryption error:", error);
      toast({
        title: "Encryption Error",
        description: "Unable to encrypt your credentials. Using plain text.",
        variant: "destructive",
      });
      
      // Fallback to storing in plain text if encryption fails
      let authData: any = {};
      
      switch (authType) {
        case "basic":
          authData = {
            basic: {
              ...(auth?.basic || { username: "", password: "" }),
              [fieldType]: value
            }
          };
          break;
        case "bearer":
          authData = { bearer: { token: value } };
          break;
        case "apiKey":
          authData = {
            apiKey: {
              ...(auth?.apiKey || { key: "", value: "", in: "header" }),
              [fieldType]: value
            }
          };
          break;
        case "oauth2":
          authData = { oauth2: { token: value } };
          break;
      }
      
      onAuthChange(authType, authData);
    }
  };

  const handleBasicAuthChange = async (field: "username" | "password", value: string) => {
    await encryptAndStore(field === "username" ? "Username" : "Password", value, "basic", field);
  };

  const handleBearerTokenChange = async (token: string) => {
    await encryptAndStore("Bearer Token", token, "bearer", "token");
  };

  const handleApiKeyChange = async (field: "key" | "value" | "in", value: string | "header" | "query") => {
    if (field === "in") {
      const apiKey = { ...(auth?.apiKey || { key: "", value: "", in: "header" }), [field]: value };
      onAuthChange("apiKey", { apiKey });
    } else {
      await encryptAndStore(field === "key" ? "API Key Name" : "API Key Value", value as string, "apiKey", field);
    }
  };

  const handleOAuth2TokenChange = async (token: string) => {
    await encryptAndStore("OAuth Token", token, "oauth2", "token");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Helper to display decrypted values in the UI when needed
  const getDisplayValue = async (value: string, setDecrypted: (value: string) => void) => {
    if (isEncrypted(value)) {
      try {
        const decrypted = await decryptData(value);
        setDecrypted(decrypted);
      } catch (error) {
        console.error("Decryption error:", error);
        setDecrypted("[Encrypted]");
      }
    } else {
      setDecrypted(value);
    }
  };

  // State to hold decrypted display values
  const [displayValues, setDisplayValues] = useState({
    username: "",
    password: "",
    bearerToken: "",
    apiKeyValue: "",
    oauthToken: ""
  });

  // Decrypt values for display when auth changes
  useEffect(() => {
    if (auth?.basic?.username) {
      getDisplayValue(auth.basic.username, (value) => 
        setDisplayValues(prev => ({ ...prev, username: value })));
    }
    
    if (auth?.basic?.password) {
      getDisplayValue(auth.basic.password, (value) => 
        setDisplayValues(prev => ({ ...prev, password: value })));
    }
    
    if (auth?.bearer?.token) {
      getDisplayValue(auth.bearer.token, (value) => 
        setDisplayValues(prev => ({ ...prev, bearerToken: value })));
    }
    
    if (auth?.apiKey?.value) {
      getDisplayValue(auth.apiKey.value, (value) => 
        setDisplayValues(prev => ({ ...prev, apiKeyValue: value })));
    }
    
    if (auth?.oauth2?.token) {
      getDisplayValue(auth.oauth2.token, (value) => 
        setDisplayValues(prev => ({ ...prev, oauthToken: value })));
    }
  }, [auth]);

  return (
    <div className="space-y-6">
      <div>
        <Label>Auth Type</Label>
        <Select value={authType} onValueChange={handleAuthTypeChange}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select authentication type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Auth</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="apiKey">API Key</SelectItem>
            <SelectItem value="oauth2">OAuth 2.0</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-1">
          <Lock className="h-4 w-4 inline-block" />
          Authentication data will be encrypted locally before storage for enhanced security.
        </AlertDescription>
      </Alert>

      {authType === "basic" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="basic-username">Username</Label>
            <div className="relative">
              <Input
                id="basic-username"
                value={displayValues.username}
                onChange={(e) => handleBasicAuthChange("username", e.target.value)}
                placeholder="Username"
              />
              {isEncrypted(auth?.basic?.username || "") && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <Label htmlFor="basic-password">Password</Label>
            <div className="relative">
              <Input
                id="basic-password"
                type={showPassword ? "text" : "password"}
                value={displayValues.password}
                onChange={(e) => handleBasicAuthChange("password", e.target.value)}
                placeholder="Password"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              >
                {showPassword ? 
                  <EyeOff className="h-4 w-4" /> : 
                  <Eye className="h-4 w-4" />
                }
              </Button>
              {isEncrypted(auth?.basic?.password || "") && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            The authorization header will be automatically generated when you send the request.
          </div>
        </div>
      )}

      {authType === "bearer" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="bearer-token">Token</Label>
            <div className="relative">
              <Input
                id="bearer-token"
                value={displayValues.bearerToken}
                onChange={(e) => handleBearerTokenChange(e.target.value)}
                placeholder="Bearer Token"
              />
              {isEncrypted(auth?.bearer?.token || "") && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            The token will be prefixed with "Bearer " in the Authorization header.
          </div>
        </div>
      )}

      {authType === "apiKey" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="apikey-key">Key</Label>
            <Input
              id="apikey-key"
              value={auth?.apiKey?.key || ""}
              onChange={(e) => handleApiKeyChange("key", e.target.value)}
              placeholder="API Key Name"
            />
          </div>
          <div>
            <Label htmlFor="apikey-value">Value</Label>
            <div className="relative">
              <Input
                id="apikey-value"
                value={displayValues.apiKeyValue}
                onChange={(e) => handleApiKeyChange("value", e.target.value)}
                placeholder="API Key Value"
              />
              {isEncrypted(auth?.apiKey?.value || "") && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
          </div>
          <div>
            <Label>Add to</Label>
            <Select 
              value={auth?.apiKey?.in || "header"} 
              onValueChange={(value: "header" | "query") => handleApiKeyChange("in", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query Param</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {authType === "oauth2" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="oauth2-token">Access Token</Label>
            <div className="relative">
              <Input
                id="oauth2-token"
                value={displayValues.oauthToken}
                onChange={(e) => handleOAuth2TokenChange(e.target.value)}
                placeholder="OAuth 2.0 Token"
              />
              {isEncrypted(auth?.oauth2?.token || "") && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            The token will be sent as a Bearer token in the Authorization header.
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestAuth;
