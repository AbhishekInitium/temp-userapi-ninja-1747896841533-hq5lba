
import { HttpMethod, QueryParam, RequestHeader, Auth, SavedRequest } from "@/types";
import { decryptData } from "./encryption";

interface RequestOptions {
  method: HttpMethod;
  url: string;
  headers: RequestHeader[];
  params: QueryParam[];
  body?: string;
  auth?: Auth;
  timeout?: number;
  requestId?: string; // For tracking the request in history
}

export interface ResponseWithRequest {
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    time: number;
    size: number;
  };
  request: {
    method: HttpMethod;
    url: string;
    headers: RequestHeader[];
    params: QueryParam[];
    body?: string;
    auth?: Auth;
  };
}

export const sendRequest = async (options: RequestOptions): Promise<ResponseWithRequest> => {
  const startTime = performance.now();
  try {
    // Build URL with query parameters
    let url: URL;
    try {
      url = new URL(options.url);
    } catch (error) {
      console.error("Invalid URL:", options.url, error);
      return {
        response: {
          status: 0,
          statusText: 'Invalid URL',
          headers: {},
          data: `The URL "${options.url}" is not valid. Please check the format.`,
          time: 0,
          size: 0
        },
        request: {
          method: options.method,
          url: options.url,
          headers: options.headers,
          params: options.params,
          body: options.body,
          auth: options.auth
        }
      };
    }
    
    // Add enabled query parameters
    options.params
      .filter(param => param.enabled)
      .forEach(param => {
        url.searchParams.append(param.key, param.value);
      });
    
    // Prepare headers
    const headers = new Headers();
    options.headers
      .filter(header => header.enabled)
      .forEach(header => {
        headers.append(header.key, header.value);
      });
    
    // Add authentication headers if needed
    if (options.auth) {
      switch (options.auth.type) {
        case "basic":
          if (options.auth.basic?.username && options.auth.basic?.password) {
            // Decrypt username and password if they are encrypted
            const username = await decryptData(options.auth.basic.username);
            const password = await decryptData(options.auth.basic.password);
            const credentials = btoa(`${username}:${password}`);
            headers.append("Authorization", `Basic ${credentials}`);
          }
          break;
        case "bearer":
          if (options.auth.bearer?.token) {
            // Decrypt bearer token if it's encrypted
            const token = await decryptData(options.auth.bearer.token);
            headers.append("Authorization", `Bearer ${token}`);
          }
          break;
        case "apiKey":
          if (options.auth.apiKey?.key && options.auth.apiKey?.value) {
            // Decrypt API key value if it's encrypted
            const keyName = options.auth.apiKey.key;
            const keyValue = await decryptData(options.auth.apiKey.value);
            
            if (options.auth.apiKey.in === "header") {
              headers.append(keyName, keyValue);
            } else if (options.auth.apiKey.in === "query") {
              url.searchParams.append(keyName, keyValue);
            }
          }
          break;
        case "oauth2":
          if (options.auth.oauth2?.token) {
            // Decrypt OAuth token if it's encrypted
            const token = await decryptData(options.auth.oauth2.token);
            headers.append("Authorization", `Bearer ${token}`);
          }
          break;
        default:
          // No auth or unsupported auth type
          break;
      }
    }
    
    // Set defaults for SAP OData APIs if not already provided
    if (url.hostname.includes('s4hana.cloud.sap')) {
      if (!headers.has('Accept')) {
        headers.append('Accept', 'application/json');
      }
      
      if (!headers.has('Content-Type') && options.method !== 'GET') {
        headers.append('Content-Type', 'application/json');
      }
      
      // Add common SAP API headers
      if (!headers.has('X-Requested-With')) {
        headers.append('X-Requested-With', 'XMLHttpRequest');
      }
    }
    
    // Prepare request
    const requestOptions: RequestInit = {
      method: options.method,
      headers,
      redirect: 'follow',
      mode: 'cors', // Try with CORS enabled
      credentials: 'include', // Include credentials if needed for SAP
    };
    
    // Add body for non-GET requests
    if (options.method !== 'GET' && options.body) {
      requestOptions.body = options.body;
    }
    
    console.log('Request URL:', url.toString());
    console.log('Request Headers:', Object.fromEntries([...headers.entries()]));
    console.log('Request Method:', options.method);
    if (options.body) {
      console.log('Request Body:', options.body);
    }
    
    // Send request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
    requestOptions.signal = controller.signal;
    
    try {
      const response = await fetch(url.toString(), requestOptions);
      const endTime = performance.now();
      clearTimeout(timeoutId);
      
      // Parse response data
      let data;
      const contentType = response.headers.get('content-type');
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        data = await response.text(); // Fallback to text if parsing fails
      }
      
      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // Calculate response size
      const responseSize = JSON.stringify(data).length;
      
      // Log response details for debugging
      console.log('Response Status:', response.status, response.statusText);
      console.log('Response Headers:', responseHeaders);
      console.log('Response Data:', data);
      
      return {
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          data,
          time: Math.round(endTime - startTime),
          size: responseSize
        },
        request: {
          method: options.method,
          url: options.url,
          headers: options.headers,
          params: options.params,
          body: options.body,
          auth: options.auth
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', error);
      
      // Provide more specific error messages for common issues
      if (error.name === 'AbortError') {
        return {
          response: {
            status: 408,
            statusText: 'Request Timeout',
            headers: {},
            data: 'The request timed out. The server took too long to respond.',
            time: Math.round(performance.now() - startTime),
            size: 0
          },
          request: {
            method: options.method,
            url: options.url,
            headers: options.headers,
            params: options.params,
            body: options.body,
            auth: options.auth
          }
        };
      }
      
      if (error.message?.includes('Network') || error.message?.includes('CORS')) {
        return {
          response: {
            status: 0,
            statusText: 'Network Error',
            headers: {},
            data: 'Network error: This might be due to CORS restrictions. SAP APIs often require proper authentication and may not be directly accessible from a browser. You may need to use a proxy server or backend API to make this request.',
            time: Math.round(performance.now() - startTime),
            size: 0
          },
          request: {
            method: options.method,
            url: options.url,
            headers: options.headers,
            params: options.params,
            body: options.body,
            auth: options.auth
          }
        };
      }
      
      throw error; // Re-throw for the outer catch
    }
  } catch (error) {
    console.error('Request error:', error);
    const endTime = performance.now();
    return {
      response: {
        status: 0,
        statusText: 'Error',
        headers: {},
        data: error instanceof Error 
          ? `${error.name}: ${error.message}` 
          : 'Unknown error occurred while making the request',
        time: Math.round(endTime - startTime),
        size: 0
      },
      request: {
        method: options.method,
        url: options.url,
        headers: options.headers,
        params: options.params,
        body: options.body,
        auth: options.auth
      }
    };
  }
};
