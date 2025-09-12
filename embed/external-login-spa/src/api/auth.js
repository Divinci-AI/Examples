import { API_ORIGIN } from "./constants";

export async function apiLogin(body){
  const response = await fetch(`${API_ORIGIN}/api/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if(!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function apiAuthRefresh({ authToken }){
  const response = await fetch(`${API_ORIGIN}/api/auth/refresh`, {
    headers: {
      "Authorization": `Bearer ${authToken}`
    }
  });

  if(!response.ok) {
    throw new Error(`Refresh failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function apiMe({ authToken }){
  const response = await fetch(`${API_ORIGIN}/api/auth`, {
    headers: !authToken ? undefined : {
      "Authorization": `Bearer ${authToken}`
    }
  });

  if(!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function apiLogout({ authToken }){
  const response = await fetch(`${API_ORIGIN}/api/auth`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${authToken}`
    }
  });

  if(!response.ok) {
    throw new Error(`Logout failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
