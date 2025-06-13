"use client";
//----------Dependencies----------//
import {useEffect, useState, useCallback, useRef, useMemo} from 'react'
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
    skip?: boolean;
    params?:QueryParams;
    method?: Methods;
    body?: JSONBody;
    debounceDelay?: number; // number in ms
}
//----------End Types----------//

//----------Constants----------//
const errorInitState = {
    message: '',
    errorText: '',
    issues: []
}
//----------End Constants----------//

//----------Utilities----------//
function buildQueryParams(params?: Record<string, any>): string {
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

function debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
}
//----------End Utilities----------//

const useFetch = <TData = unknown>( baseUrl: string, options: FetchOptions = {} ) => {
    const {
        skip = false,
        params: initialParams,
        body: initialBody,
        method = "GET",
        headers = {},
        debounceDelay,
        ...fetchOptions
    } = options;

    //----------State----------//
    const [body, setBody] = useState<JSONBody | undefined>(initialBody);
    const [params, setParams] = useState<QueryParams | undefined>(initialParams);
    const [data, setData] = useState<TData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<APIErrorResponse>(errorInitState);

    const isFirstRun = useRef(true);
    //----------End State----------//

    //----------API Call----------//
    const fetchData = useCallback(async (overrideParams?: QueryParams, overrideBody?: JSONBody) => {
        const activeParams = overrideParams ?? params;
        const activeBody = overrideBody ?? body;

        setParams(activeParams);
        setBody(activeBody);
        setLoading(true);

        const fullUrl = `${baseUrl}${buildQueryParams(activeParams)}`;

        try {
            const res = await fetch(fullUrl , {
                method,
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  ...headers,
                },
                body: ["POST", "PUT", "PATCH"].includes(method)
                  ? JSON.stringify(activeBody)
                  : undefined,
                ...fetchOptions,
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
                return;
            }

            const json: TData = await res.json();
            setData(json);
            setError(errorInitState);

            return json;

        } catch (err: any) {
            // Set error if fetch completely failed
            setError({
                message: err.message || "Fetch Failed",
                errorText: "NETWORK_ERROR",
                issues: []
            });

            return null;

        } finally {
            setLoading(false);
        }
    }, [baseUrl, method, headers, fetchOptions, params, body])

    // Used for search queries and the like
    const debouncedFetch = useMemo(() => {
        return debounceDelay ? debounce(fetchData, debounceDelay) : fetchData;
    }, [fetchData, debounceDelay]);
    //----------End API Call----------//

    //----------Effects----------//
    useEffect(() => {
        if (!skip && isFirstRun.current) {
          debouncedFetch();
        }

        isFirstRun.current = false;
    }, [debouncedFetch, skip]);
    //----------End Effects----------//

    return {
        error,
        data,
        loading,
        callFetch: fetchData,
        debouncedFetch
    }
}

//----------Exports----------//
export {useFetch}
//----------End Exports----------//
