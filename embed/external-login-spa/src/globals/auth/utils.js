const TOKEN_KEY = "authToken";

export function saveToken(token){
  if(!token) {
    console.warn("Attempted to save empty token");
    return;
  }

  try {
    localStorage.setItem(TOKEN_KEY, token);
    console.log("Token saved successfully");
  }catch(error) {
    console.error("Failed to save token:", error);
  }
}

export function getToken(){
  try {
    return localStorage.getItem(TOKEN_KEY);
  }catch(error) {
    console.error("Failed to get token:", error);
    return null;
  }
}

export function removeToken(){
  try {
    localStorage.removeItem(TOKEN_KEY);
    console.log("Token removed successfully");
  }catch(error) {
    console.error("Failed to remove token:", error);
  }
}

export function decodeToken(token){
  if(!token) return null;

  try {
    const parts = token.split(".");
    if(parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  }catch(error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

export function getUserFromToken(token){
  const decoded = decodeToken(token);
  if(!decoded) return null;

  return {
    id: decoded.id,
    username: decoded.username,
    name: decoded.name,
    picture: decoded.picture
  };
}
