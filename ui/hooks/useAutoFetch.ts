//----------Dependencies----------//
import {useState, useEffect, useCallback} from 'react';
//----------End Dependencies----------//

//----------Types----------//
type APIErrorResponse = {
    message: string;
    errorText: string;
    issues: APIIssue[];
}

type APIIssue = {
    path: string;
    message: string;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;
type Methods = "GET" | "POST" | "PUT" | "DELETE";
type JSONBody = Record<string, any>;

type FetchOptions = Omit<RequestInit, "body"> & {
    params?:QueryParams;
    method?: Methods;
    body?: JSONBody;
}
//----------End Types----------//

//----------Utilities----------//
function buildQueryParams(params: QueryParams | null): string {
    if (!params) return '';
    const query = new URLSearchParams();
    for (const key in params) {
      const value = params[key];
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    }
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
}
//----------End Utilities----------//

//----------Constants----------//
const errorInitState: APIErrorResponse = {
    message: '',
    errorText: '',
    issues: []
}
//----------End Constants----------//

function useAutoFetch<TData = unknown>(baseUrl: string, options: FetchOptions = {}) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<APIErrorResponse>(errorInitState);
    const [data, setData] = useState<TData | null>(null);
    
    const {
        params = null,
        method = "GET",
        body = {},
        headers = {},
        ...fetchOptions
    } = options;

    const stringifiedParams = JSON.stringify(params);
    const stringifiedHeaders = JSON.stringify(headers);
    const stringifiedBody = JSON.stringify(body);
    const stringifiedFetchOptions = JSON.stringify(fetchOptions);

    const fetchData = useCallback(async () => {
        setIsLoading(true);

        try {
            const currentParams = JSON.parse(stringifiedParams);
            const currentHeaders = JSON.parse(stringifiedHeaders);
            const currentBody = JSON.parse(stringifiedBody);
            const currentFetchOptions = JSON.parse(stringifiedFetchOptions);

            const fullUrl = `${baseUrl}${buildQueryParams(currentParams)}`;

            const res = await fetch(fullUrl , {
                method,
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  ...currentHeaders,
                },
                body: ["POST", "PUT", "PATCH"].includes(method)
                  ? JSON.stringify(currentBody)
                  : undefined,
                ...currentFetchOptions,
            });

            if (!res.ok) {
                let parsedError: APIErrorResponse
                try {
                    //Set error object stored on body
                    parsedError = await res.json();
                } catch {
                    // set generic error message
                    parsedError = {
                        message: "Unexpected error",
                        errorText: res.statusText,
                        issues: []
                    };
                }
                setError(parsedError);
                setData(null);
                return;
            }

            const json: TData = await res.json();
            setData(json);
            setError(errorInitState);
        } catch (err: any) {
            setError({
                message: err.message || "Fetch Failed",
                errorText: "NETWORK_ERROR",
                issues: []
            });
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [baseUrl, stringifiedParams, method, stringifiedHeaders, stringifiedFetchOptions, stringifiedBody]);

    useEffect(() => {
        fetchData();
    }, [fetchData])

    return {
        isLoading,
        error,
        data
    }
}

export {useAutoFetch}