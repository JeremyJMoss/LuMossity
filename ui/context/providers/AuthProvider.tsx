"use client";

import { AuthContext } from "../AuthContext";
import { useContext, useEffect, useState } from "react";

export const AuthProvider = ({children} : { children: React.ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Try rehydrating token from server on initial load
        const rehydrate = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include' // Send cookies
                });

                console.log(res);

                if (res.ok) {
                    const data = await res.json();
                    setAccessToken(data.access_token);
                } else {
                    setAccessToken(null);
                }
            } catch (err) {
                console.error('Token rehydrate failed', err);
                setAccessToken(null);
            } finally {
                setLoading(false);
            }
        }

        rehydrate();
    }, []);

    return (
        <AuthContext.Provider
        value={{accessToken, setAccessToken, loading}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);