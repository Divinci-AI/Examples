# SSR External Login Demo

This demo shows how to integrate Divinci chat with external authentication in a Server-Side Rendered application using Express and EJS.

## Features

- **Server-Side Rendering** with EJS templates
- **External Authentication** - Users log in with your system, not Divinci
- **Session Management** - Server-side sessions with secure cookies
- **JWT Trading** - Server exchanges user info for Divinci JWTs during page render
- **Direct JWT Embedding** - JWT passed to embed script via data attributes
- **Origin Validation** - Divinci validates authorized domains

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Visit the demo:**
   Open http://localhost:3002

## Development

For development with auto-restart:

```bash
npm run dev
```

## Test Users

You can log in with any of these test accounts:

- **alice** / password123
- **bob** / secret456  
- **charlie** / test789

## How It Works

### Authentication Flow

1. **User Login** - User submits form to `/auth/login`
2. **Server Validation** - Server checks credentials against `users.json`
3. **Session Creation** - Server creates session and stores user info
4. **Protected Access** - Protected pages check session before rendering
5. **JWT Trading** - Server gets Divinci JWT during page render
6. **Direct Embedding** - JWT embedded in HTML via script data attributes
7. **Auto-Authentication** - Embed script auto-authenticates on page load

### Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │  Express SSR    │    │  Divinci API    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Login Form  │─┼────┼→│ POST /auth/ │ │    │ │             │ │
│ └─────────────┘ │    │ │   login     │ │    │ │             │ │
│                 │    │ └─────────────┘ │    │ │             │ │
│ ┌─────────────┐ │    │                 │    │ │             │ │
│ │ Protected   │─┼────┼→│ GET /       │─┼────┼→│ POST /embed/│ │
│ │ Page        │ │    │ │ protected   │ │    │ │   login     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │        │        │    │                 │
│ ┌─────────────┐ │    │        ▼        │    │                 │
│ │ Embed       │◄┼────┼─── JWT in ──────┼────┤                 │
│ │ Script      │ │    │    HTML         │    │                 │
│ └─────────────┘ │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Project Structure

```
external-login-ssr/
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── public/                   # Static assets
│   └── style.css            # CSS styles
├── views/                    # EJS templates
│   ├── layout.ejs           # Base layout template
│   ├── home.ejs             # Home page
│   ├── login.ejs            # Login form
│   ├── example.ejs          # Public example page
│   ├── protected.ejs        # Protected page with chat
│   └── error.ejs            # Error page
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
        ├── api.js           # API endpoints
        └── pages.js         # Page rendering routes
```

## Routes

### Pages
- `GET /` - Home page
- `GET /login` - Login form
- `GET /example` - Public example page
- `GET /protected` - Protected page with chat (requires auth)

### Authentication
- `POST /auth/login` - Process login form
- `POST /auth/logout` - Logout and destroy session

### API
- `GET /api/get-jwt` - Get fresh Divinci JWT (requires auth)
- `GET /api/debug/sessions` - View active sessions (debugging)

## Configuration

Environment variables in `.env`:

```bash
DIVINCI_API_KEY=your-divinci-api-key
DIVINCI_API_URL=http://localhost:3000
SESSION_SECRET=your-session-secret
PORT=3002
RELEASE_ID=your-release-id
```

**Note:** The embed script is loaded from the actual Divinci server (e.g., `http://localhost:8080/embed.js`).

## SSR Benefits

### Performance
- **Immediate Chat Load** - JWT embedded in initial HTML
- **No API Roundtrips** - Chat authenticates instantly
- **Server-Side Security** - JWT trading on secure server
- **Fast Page Loads** - Content rendered on server

### SEO & Accessibility
- **Search Engine Friendly** - Content available to crawlers
- **Progressive Enhancement** - Works without JavaScript
- **Better Performance** - Faster initial page loads
- **Accessibility** - Screen readers can access content immediately

### Security
- **Server-Side Sessions** - Secure session management
- **No Client Tokens** - JWT never stored client-side
- **Origin Validation** - Server controls all API calls
- **CSRF Protection** - Form-based authentication

## Integration Guide

To integrate this pattern into your own application:

1. **Replace user database** - Use your existing user system instead of `users.json`
2. **Update authentication** - Replace form auth with your auth method
3. **Configure Divinci** - Set your real API key and release ID
4. **Add origin validation** - Configure allowed origins in your Divinci API key
5. **Enhance security** - Add HTTPS, CSRF protection, rate limiting, etc.

## Troubleshooting

### Common Issues

1. **"Failed to get JWT"** - Check your Divinci API key and URL
2. **"Origin not authorized"** - Add your domain to API key's allowed origins
3. **Session issues** - Check session secret and cookie settings
4. **Chat not loading** - Verify embed script URL and JWT embedding

### Debug Endpoints

- `GET /api/debug/sessions` - View active sessions
- Browser console - Check for embed script logs and errors
