const config = require("./config");

/**
 * Trade user info for Divinci JWT
 * This simulates calling the Divinci API to get a JWT for embed authentication
 */
async function getDivinciJWT(user){
  if(!user) return;

  const { id, username, picture } = user;
  try {
    // In a real implementation, this would call the Divinci API
    // For demo purposes, we'll simulate the API call

    // api.divinci.ai/embed/login
    const response = await fetch(`${config.divinci.apiUrl}/embed/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apikey: config.divinci.apiKey,
        userId: id,
        username: username,
        picture: picture
      })
    });

    if(!response.ok) {
      throw new Error(`Divinci API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.refreshToken;

  }catch(error) {
    console.error("Failed to get Divinci JWT:", error);

    throw error;
  }
}

module.exports = {
  getDivinciJWT
};
