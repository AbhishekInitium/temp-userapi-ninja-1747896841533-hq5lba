
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface RequestHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface SavedRequest {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers: RequestHeader[];
  params: QueryParam[];
  body: string;
  collectionId?: string;
  auth?: Auth;
  timestamp?: number; // Added timestamp for history tracking
  response?: ResponseData; // Optional stored response
}

export interface Collection {
  id: string;
  name: string;
  requests: SavedRequest[];
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
}

export type AuthType = "none" | "basic" | "bearer" | "apiKey" | "oauth2";

export interface Auth {
  type: AuthType;
  basic?: {
    username: string;
    password: string;
  };
  bearer?: {
    token: string;
  };
  apiKey?: {
    key: string;
    value: string;
    in: "header" | "query";
  };
  oauth2?: {
    token: string;
  };
}

export type ResponseViewMode = "raw" | "json" | "xml" | "html" | "preview";
