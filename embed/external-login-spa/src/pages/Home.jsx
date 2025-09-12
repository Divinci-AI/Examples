import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../globals/auth";

function Home(){
  const { user } = useAuth();
  return (
    <div className="page">
      <h1>Welcome to SPA External Login Demo</h1>

      {user ? (
        <div>
          <p>Hello, <strong>{user.name}</strong>! You are logged in.</p>
          <p>This demo shows how to integrate Divinci chat with external authentication in a Single Page Application (SPA).</p>
        </div>
      ) : (
        <div>
          <p>This demo shows how to integrate Divinci chat with external authentication in a Single Page Application (SPA).</p>
          <p>Please <Link to="/login">log in</Link> to access the protected chat features.</p>
        </div>
      )}

      <h2>How it works</h2>
      <ol>
        <li><strong>User Authentication:</strong> Users log in with your existing authentication system</li>
        <li><strong>JWT Trading:</strong> Your server trades user info for a Divinci JWT</li>
        <li><strong>Chat Integration:</strong> The JWT is passed to the Divinci embed for secure chat access</li>
        <li><strong>Origin Validation:</strong> Divinci validates that your domain is authorized for the API key</li>
      </ol>

      <h2>Demo Pages</h2>
      <ul>
        <li><Link to="/example">Example Page</Link> - Public page accessible to everyone</li>
        {user ? (
          <li><Link to="/protected">Protected Page</Link> - Private page with chat (requires login)</li>
        ) : (
          <li>Protected Page - Private page with chat (requires <Link to="/login">login</Link>)</li>
        )}
      </ul>

      <h2>Test Users</h2>
      <p>You can log in with any of these test accounts:</p>
      <ul>
        <li><strong>alice</strong> / password123</li>
        <li><strong>bob</strong> / secret456</li>
        <li><strong>charlie</strong> / test789</li>
      </ul>

      {user && (
        <div className="alert alert-success">
          <strong>You're logged in!</strong> Try visiting the <Link to="/protected">Protected Page</Link> to see the chat integration in action.
        </div>
      )}
    </div>
  );
}

export default Home;
