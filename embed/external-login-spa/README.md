# SPA External Login Demo

This demo shows how to integrate Divinci chat with external authentication in a Single Page Application (SPA).

## Features

- **React SPA** with React Router for client-side routing
- **External Authentication** - Users log in with your system, not Divinci
- **JWT Authentication** - Stateless authentication using JSON Web Tokens
- **JWT Trading** - Server exchanges user info for Divinci JWTs
- **Secure Integration** - Chat access controlled by your authentication
- **Origin Validation** - Divinci validates authorized domains

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the React app:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Visit the demo:**
   Open http://localhost:3001

## Development

For development with auto-rebuild:

```bash
npm run dev
```

This runs both the webpack watcher and the server with nodemon.

## Test Users

You can log in with any of these test accounts:

- **alice** / password123
- **bob** / secret456  
- **charlie** / test789

## How It Works

### Authentication Flow

1. **User Login** - User enters credentials on `/login` page
2. **Server Validation** - Server checks credentials against `users.json`
3. **JWT Creation** - Server creates JWT token and returns to client
4. **Token Storage** - Client stores JWT in localStorage
5. **Protected Access** - Client sends JWT in Authorization header
6. **JWT Trading** - Protected page requests Divinci JWT from `/api/get-jwt`
7. **Chat Integration** - Divinci JWT passed to embed for secure chat

### Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │  Express API    │    │  Divinci API    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Login Page  │─┼────┼→│ POST /auth/ │ │    │ │             │ │
│ └─────────────┘ │    │ │   login     │ │    │ │             │ │
│                 │    │ └─────────────┘ │    │ │             │ │
│ ┌─────────────┐ │    │                 │    │ │             │ │
│ │ Protected   │─┼────┼→│ GET /api/   │─┼────┼→│ POST /embed/│ │
│ │ Page        │ │    │ │   get-jwt   │ │    │ │   login     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │                 │    │ ┌─────────────┐ │
│ │ Embed       │─┼────┼─────────────────┼────┼→│ POST /embed/│ │
│ │ Script      │ │    │                 │    │ │ validate-   │ │
│ └─────────────┘ │    │                 │    │ │ login       │ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Project Structure

```
external-login-spa/
├── package.json              # Dependencies and scripts
├── webpack.config.js         # React build configuration
├── .env                      # Environment variables
├── public/                   # Built React app (generated)
│   ├── index.html           # HTML entry point
│   ├── style.css            # Styles
│   └── app.js               # Built React bundle
├── src/                      # React source code
│   ├── App.jsx              # Main app with routing
│   ├── components/
│   │   └── Header.jsx       # Navigation with auth dropdown
│   └── pages/
│       ├── Home.jsx         # Home page
│       ├── Login.jsx        # Login form
│       ├── Example.jsx      # Public example page
│       └── Protected.jsx    # Protected page with chat
└── server/                   # Express server
    ├── index.js             # HTTP server
    ├── app.js               # Express app configuration
    ├── config.js            # Environment configuration
    ├── divinci.js           # Divinci API integration
    ├── users.json           # Test user database
    ├── user-cookie-session-db.js # Session storage
    ├── middleware/
    │   └── auth.js          # Authentication middleware
    └── routes/
        ├── auth.js          # Login/logout routes
        ├── api.js           # JWT and user API routes
        └── static.js        # Static file serving + SPA fallback
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login with username/password
- `POST /auth/logout` - Logout and destroy session

### API
- `GET /api/me` - Get current user info
- `GET /api/get-jwt` - Get fresh Divinci JWT (requires auth)
- `POST /api/validate-jwt` - Validate JWT with Divinci (testing)
- `GET /api/debug/sessions` - View active sessions (debugging)

### Static
- `GET /*` - SPA fallback (serves React app)

## Configuration

Environment variables in `.env`:

```bash
DIVINCI_API_KEY=your-divinci-api-key
DIVINCI_API_URL=http://localhost:3000
SESSION_SECRET=your-session-secret
PORT=3001
RELEASE_ID=your-release-id
```

**Note:** The embed script is loaded from the actual Divinci server (e.g., `http://localhost:8080/embed.js`), not from this demo server.

## Integration Guide

To integrate this pattern into your own application:

1. **Replace the user database** - Use your existing user system instead of `users.json`
2. **Update authentication** - Replace username/password with your auth method
3. **Configure Divinci** - Set your real API key and release ID
4. **Add origin validation** - Configure allowed origins in your Divinci API key
5. **Enhance security** - Add HTTPS, CSRF protection, rate limiting, etc.

## Security Considerations

- **HTTPS Required** - Use HTTPS in production
- **Secure Sessions** - Configure secure session cookies
- **Origin Validation** - Divinci validates your domain
- **JWT Expiration** - JWTs have limited lifetime
- **Session Management** - Sessions expire and can be revoked

## Troubleshooting

### Common Issues

1. **"Failed to get JWT"** - Check your Divinci API key and URL
2. **"Origin not authorized"** - Add your domain to API key's allowed origins
3. **"Authentication required"** - Make sure you're logged in
4. **Chat not loading** - Check browser console for embed script errors

### Debug Endpoints

- `GET /api/debug/sessions` - View active sessions
- Browser console - Check for embed script logs
- Network tab - Monitor API requests and responses
