const config = require("./config");

/**
 * Trade user info for Divinci JWT
 * This simulates calling the Divinci API to get a JWT for embed authentication
 */
async function getDivinciJWT(userId, username, picture){
  try {
    // In a real implementation, this would call the Divinci API
    // For demo purposes, we'll simulate the API call

    const response = await fetch(`${config.divinci.apiUrl}/embed/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apikey: config.divinci.apiKey,
        userId: userId,
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

    // For demo purposes, return a mock JWT if the API is not available
    if(error.code === "ECONNREFUSED" || error.message.includes("fetch")) {
      console.warn("Divinci API not available, returning mock JWT for demo");
      return `mock_jwt_${userId}_${Date.now()}`;
    }

    throw error;
  }
}

/**
 * Validate a JWT with Divinci (for testing purposes)
 */
async function validateJWT(jwt, origin){
  try {
    const response = await fetch(`${config.divinci.apiUrl}/embed/validate-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jwt: jwt,
        origin: origin,
        releaseId: config.divinci.releaseId
      })
    });

    if(!response.ok) {
      return { valid: false, error: `Validation failed: ${response.status}` };
    }

    return await response.json();

  }catch(error) {
    console.error("Failed to validate JWT:", error);
    return { valid: false, error: error.message };
  }
}

module.exports = {
  getDivinciJWT,
  validateJWT
};
