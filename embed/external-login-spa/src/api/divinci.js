import { API_ORIGIN } from "./constants";

export async function apiDivinciRelease(){
  const response = await fetch(`${API_ORIGIN}/api/divinci/release`);
  if(!response.ok) {
    throw new Error(`Failed to fetch release ID: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

export async function apiDivinciJWT({ authToken }){
  const response = await fetch(`${API_ORIGIN}/api/divinci/get-jwt`, {
    headers: {
      "Authorization": `Bearer ${authToken}`
    }
  });

  if(!response.ok) {
    throw new Error(`Failed to get JWT: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
