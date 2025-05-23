import { createContext } from "react";

interface AuthContextType {
    accessToken: string | null;
    setAccessToken: (token: string | null) => void;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
    accessToken: null,
    setAccessToken: () => {},
    loading: true
});