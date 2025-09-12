import React from "react";
import { Link } from "react-router-dom";

function Example(){
  return (
    <div className="page">
      <h1>Example Page</h1>
      <p>This is a public example page that anyone can access, whether logged in or not.</p>

      <h2>About This Demo</h2>
      <p>
        This Single Page Application (SPA) demonstrates how to integrate Divinci chat
        with external authentication. The key concepts are:
      </p>

      <ul>
        <li><strong>External Authentication:</strong> Users authenticate with your existing system</li>
        <li><strong>JWT Trading:</strong> Your server exchanges user info for Divinci JWTs</li>
        <li><strong>Secure Integration:</strong> Chat access is controlled by your authentication</li>
        <li><strong>Origin Validation:</strong> Divinci validates authorized domains</li>
      </ul>

      <h2>Technical Implementation</h2>
      <p>This demo uses:</p>
      <ul>
        <li><strong>React:</strong> Frontend SPA framework</li>
        <li><strong>React Router:</strong> Client-side routing</li>
        <li><strong>Express:</strong> Backend API server</li>
        <li><strong>Sessions:</strong> Server-side session management</li>
        <li><strong>Divinci Embed:</strong> Chat integration via script tag</li>
      </ul>

      <h2>Authentication Flow</h2>
      <ol>
        <li>User logs in with username/password</li>
        <li>Server creates session and stores user info</li>
        <li>Protected pages check authentication status</li>
        <li>When chat is needed, server gets fresh JWT from Divinci</li>
        <li>JWT is passed to embed script for secure chat access</li>
      </ol>

      <div className="alert alert-info">
        <strong>Try it out:</strong> <Link to="/login">Log in</Link> and visit the <Link to="/protected">Protected Page</Link> to see the chat integration in action.
      </div>

      <h2>Code Structure</h2>
      <p>The demo is organized as follows:</p>
      <ul>
        <li><code>src/</code> - React source code</li>
        <li><code>server/</code> - Express server with routes and middleware</li>
        <li><code>public/</code> - Built React app and static assets</li>
      </ul>

      <p>
        This structure separates concerns cleanly and provides a realistic
        example of how you might integrate Divinci chat into your own application.
      </p>
    </div>
  );
}

export default Example;
