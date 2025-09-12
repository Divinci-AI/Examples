import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../globals/auth";
import { API } from "../api";
import { DIVINCI_EMBED_URL } from "../globals/constants/divinci";

function Protected(){
  const { user, token } = useAuth();
  const [jwt, setJwt] = useState(null);
  const [jwtError, setJwtError] = useState(null);
  const [embedStatus, setEmbedStatus] = useState("loading");

  useEffect(()=>{
    if(!user) return;
    Promise.resolve().then(async ()=>{
      try {
        const { jwt } = await API.divinci.getJWT({ authToken: token });
        setJwt(jwt);
        setJwtError(null);
      }catch(error) {
        console.error("Failed to get JWT:", error);
        setJwtError(error.message);
      }
    });
  }, [user]);

  useEffect(()=>{
    if(!jwt) return;
    const script = document.querySelector(`script[src="${DIVINCI_EMBED_URL}"]`);
    if(!script) {
      setEmbedStatus("noembed");
      return;
    }

    if(!window.DIVINCI_AI_EMBED) {
      setEmbedStatus("noglobalvar");
      return;
    }



    return ()=>{
      // Cleanup on unmount
      if(window.DIVINCI_AI_EMBED) {
        window.DIVINCI_AI_EMBED.logout();
      }
      // Remove script
      const scripts = document.querySelectorAll("script[src=\"http://localhost:8080/embed.js\"]");
      scripts.forEach(s=>s.remove());
    };
  }, []);

  if(!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="page">
      <h1>Protected Page</h1>
      <p>Welcome, <strong>{user.name}</strong>! This page is only accessible to logged-in users.</p>

      <div className="alert alert-success">
        <strong>Authentication Status:</strong> Logged in as {user.username}
      </div>

      <h2>Divinci Chat Integration</h2>
      <p>
        This page demonstrates how to integrate Divinci chat with external authentication.
        The chat below is loaded dynamically after you log in.
      </p>

      {jwtError && (
        <div className="alert alert-error">
          <strong>JWT Error:</strong> {jwtError}
        </div>
      )}

      {!jwt && !jwtError && (
        <div className="alert alert-info">
          <strong>Loading:</strong> Getting authentication token...
        </div>
      )}

      {jwt && (
        <div>
          <div className="alert alert-info">
            <strong>Embed Status:</strong> {embedStatus}
            {embedStatus === "loading" && " - Loading chat..."}
            {embedStatus === "noembed" && " - Embed not found, please add the embed script tag to the page."}
            {embedStatus === "noglobalvar" && " - Global var not found, please make sure the embed script has before this script."}
            {embedStatus === "ready" && " - Chat loaded, authenticating..."}
            {embedStatus === "authenticated" && " - Chat ready!"}
            {embedStatus === "error" && " - Failed to load chat"}
          </div>

          <h3>Technical Details</h3>
          <ul>
            <li><strong>User ID:</strong> {user.id}</li>
            <li><strong>JWT:</strong> {jwt.substring(0, 20)}... (truncated)</li>
            <li><strong>Origin:</strong> {window.location.origin}</li>
            <li><strong>Release ID:</strong> test-release-spa</li>
          </ul>
        </div>
      )}

      {/* Chat will be injected here by embed script */}
      <div id="chat-container"></div>

      <h2>How This Works</h2>
      <ol>
        <li>You logged in with your credentials</li>
        <li>Server verified your identity and created a session</li>
        <li>This page requested a fresh JWT from our server</li>
        <li>Server traded your user info for a Divinci JWT</li>
        <li>Embed script loaded and authenticated with the JWT</li>
        <li>Divinci validated your origin and JWT</li>
        <li>Chat is now ready for secure communication</li>
      </ol>

      <p>
        <Link to="/">← Back to Home</Link>
      </p>
    </div>
  );
}

export default Protected;
