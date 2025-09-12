import React, {
  createContext, useContext,
  useCallback, useState, useEffect, useRef
} from "react";

import { API } from "../../api";
import { saveToken, getToken, removeToken, decodeToken } from "./utils";

/*
User should look like
{
  id: string,
  username: string,
  name: string,
  picture: string,
}
*/

const HOUR_IN_MILLI = 60 * 60 * 1000;

export const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: ()=>(Promise.reject("Not Implemented")),
  logout: ()=>(Promise.reject("Not Implemented")),
});

export function useAuth(){
  return useContext(AuthContext);
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const loadingRef = useRef(true);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const authToken = getToken();
    if(!authToken) {
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    const decoded = decodeToken(authToken);
    if(!decoded || decoded.exp < Date.now() / 1000) {
      removeToken();
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    setToken(authToken);
    setUser(decoded);
    loadingRef.current = false;
    setLoading(false);
  }, []);

  const cleanupUser = useCallback(async ()=>{
    try {
      removeToken();
      setToken(null);
      setUser(null);
      if(!token) return;
      await API.auth.logout({ authToken: token });
    }catch(error) {
      console.error("Logout failed:", error);
    }
  }, [token]);

  useEffect(()=>{
    if(!token) return;
    saveToken(token);
    const { exp } = decodeToken(token);
    const to = setTimeout(async function refreshToken(){
      try {
        const { token } = await API.auth.refresh({ authToken: token });
        setToken(token);
      }catch(e){
        cleanupUser();
      }
    }, Math.min(HOUR_IN_MILLI, (exp * 1000) - Date.now()));
    return ()=>{
      clearTimeout(to);
    };
  }, [token]);

  const login = useCallback(async (credentials)=>{
    if(loadingRef.current){
      throw new Error("Login in progress");
    }
    loadingRef.current = true;
    setLoading(true);
    const { token, user } = await API.auth.login(credentials);
    setToken(token);
    setUser(user);
    loadingRef.current = false;
    setLoading(false);
  }, []);

  const logout = useCallback(async ()=>{
    if(!token) throw new Error("Not logged in");
    cleanupUser();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      { children }
    </AuthContext.Provider>
  );
}