/**
 * Cloudflare Worker for SSR Demo Example
 * Demonstrates server-side rendering with session-based authentication
 */

export interface Env {
	EMBED_SCRIPT_URL: string;
	DIVINCI_API_URL: string;
	DIVINCI_API_KEY: string;
	RELEASE_ID: string;
	ENVIRONMENT: string;
	SESSIONS: KVNamespace;
	ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins for CORS
	RATE_LIMIT_PER_MINUTE?: string; // Max requests per IP per minute
}

// Security utilities
const SECURITY = {
	// Sanitize string input to prevent XSS
	sanitizeString(input: string, maxLength = 1000): string {
		return input
			.trim()
			.slice(0, maxLength)
			.replace(/[<>'"]/g, (char) => {
				const entities: Record<string, string> = {
					"<": "&lt;",
					">": "&gt;",
					"'": "&#x27;",
					'"': "&quot;"
				};
				return entities[char] || char;
			});
	},

	// Validate username format
	validateUsername(username: string): boolean {
		return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
	},

	// Simple rate limiting using KV
	async checkRateLimit(
		kv: KVNamespace,
		ip: string,
		limit: number
	): Promise<boolean> {
		const key = `ratelimit:${ip}`;
		const current = await kv.get(key);
		const count = current ? parseInt(current) : 0;

		if (count >= limit) {
			return false;
		}

		await kv.put(key, (count + 1).toString(), { expirationTtl: 60 });
		return true;
	},

	// Get CORS headers
	getCORSHeaders(origin: string | null, allowedOrigins: string[]): Record<string, string> {
		const headers: Record<string, string> = {};

		if (origin && (allowedOrigins.includes("*") || allowedOrigins.includes(origin))) {
			headers["Access-Control-Allow-Origin"] = origin;
			headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
			headers["Access-Control-Allow-Headers"] = "Content-Type";
			headers["Access-Control-Max-Age"] = "86400";
		}

		return headers;
	}
};

interface User {
	id: string;
	username: string;
	name: string;
	picture?: string;
}

interface Session {
	userId: string;
	username: string;
	name: string;
	picture?: string;
	createdAt: number;
}

// Mock user database (in production, this would be a real database)
const MOCK_USERS: Record<string, { password: string; name: string; picture: string }> = {
	alice: {
		password: "password123",
		name: "Alice Johnson",
		picture: "https://i.pravatar.cc/150?img=1"
	},
	bob: {
		password: "secret456",
		name: "Bob Smith",
		picture: "https://i.pravatar.cc/150?img=2"
	},
	charlie: {
		password: "test789",
		name: "Charlie Brown",
		picture: "https://i.pravatar.cc/150?img=3"
	}
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS preflight handling
		if (request.method === "OPTIONS") {
			const allowedOrigins = env.ALLOWED_ORIGINS?.split(",") || ["*"];
			const origin = request.headers.get("Origin");
			const corsHeaders = SECURITY.getCORSHeaders(origin, allowedOrigins);

			return new Response(null, {
				status: 204,
				headers: corsHeaders
			});
		}

		// Rate limiting
		const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
		const rateLimit = parseInt(env.RATE_LIMIT_PER_MINUTE || "60");

		if (!(await SECURITY.checkRateLimit(env.SESSIONS, clientIP, rateLimit))) {
			return new Response("Too many requests. Please try again later.", {
				status: 429,
				headers: {
					"Retry-After": "60",
					"Content-Type": "text/plain"
				}
			});
		}

		// Get session
		const sessionId = getSessionCookie(request);
		const session = sessionId ? await getSession(env.SESSIONS, sessionId) : null;

		// CORS headers for actual requests
		const allowedOrigins = env.ALLOWED_ORIGINS?.split(",") || ["*"];
		const origin = request.headers.get("Origin");
		const corsHeaders = SECURITY.getCORSHeaders(origin, allowedOrigins);

		// Routes
		if (path === "/" || path === "") {
			return renderHomePage(env, session);
		}

		if (path === "/login") {
			if (request.method === "POST") {
				return handleLogin(request, env);
			}
			return renderLoginPage(env, session);
		}

		if (path === "/logout") {
			return handleLogout(request, env, sessionId);
		}

		if (path === "/example") {
			return renderExamplePage(env, session);
		}

		if (path === "/protected") {
			if (!session) {
				return new Response(null, {
					status: 302,
					headers: { Location: "/login" }
				});
			}
			return renderProtectedPage(env, session);
		}

		if (path === "/api/get-jwt") {
			if (!session) {
				return new Response(JSON.stringify({ error: "Unauthorized" }), {
					status: 401,
					headers: {
						"Content-Type": "application/json",
						...corsHeaders
					}
				});
			}
			return getDivinciJWT(env, session, corsHeaders);
		}

		if (path === "/styles.css") {
			return new Response(CSS_STYLES, {
				headers: {
					"Content-Type": "text/css",
					"Cache-Control": "public, max-age=3600"
				}
			});
		}

		return new Response("Not Found", { status: 404 });
	}
};

// Session management
function generateSessionId(): string {
	return crypto.randomUUID();
}

function getSessionCookie(request: Request): string | null {
	const cookie = request.headers.get("Cookie");
	if (!cookie) return null;

	const match = cookie.match(/session=([^;]+)/);
	return match ? match[1] : null;
}

async function getSession(kv: KVNamespace, sessionId: string): Promise<Session | null> {
	const data = await kv.get(`session:${sessionId}`);
	return data ? JSON.parse(data) : null;
}

async function createSession(kv: KVNamespace, user: User): Promise<string> {
	const sessionId = generateSessionId();
	const session: Session = {
		userId: user.id,
		username: user.username,
		name: user.name,
		picture: user.picture,
		createdAt: Date.now()
	};

	// Store session for 24 hours
	await kv.put(`session:${sessionId}`, JSON.stringify(session), {
		expirationTtl: 86400
	});

	return sessionId;
}

async function destroySession(kv: KVNamespace, sessionId: string | null): Promise<void> {
	if (sessionId) {
		await kv.delete(`session:${sessionId}`);
	}
}

// Authentication handlers
async function handleLogin(request: Request, env: Env): Promise<Response> {
	const formData = await request.formData();
	const rawUsername = formData.get("username") as string;
	const rawPassword = formData.get("password") as string;

	// Input validation
	if (!rawUsername || !rawPassword) {
		return new Response(
			renderLoginPage(env, null, "Username and password are required"),
			{
				headers: { "Content-Type": "text/html;charset=UTF-8" }
			}
		);
	}

	// Sanitize and validate username
	const username = SECURITY.sanitizeString(rawUsername, 20);
	if (!SECURITY.validateUsername(username)) {
		return new Response(
			renderLoginPage(env, null, "Invalid username format"),
			{
				headers: { "Content-Type": "text/html;charset=UTF-8" }
			}
		);
	}

	// Password length validation (don't sanitize passwords)
	if (rawPassword.length < 6 || rawPassword.length > 100) {
		return new Response(
			renderLoginPage(env, null, "Invalid credentials"),
			{
				headers: { "Content-Type": "text/html;charset=UTF-8" }
			}
		);
	}

	const user = MOCK_USERS[username];
	if (!user || user.password !== rawPassword) {
		return new Response(
			renderLoginPage(env, null, "Invalid username or password"),
			{
				headers: { "Content-Type": "text/html;charset=UTF-8" }
			}
		);
	}

	const sessionId = await createSession(env.SESSIONS, {
		id: username,
		username,
		name: user.name,
		picture: user.picture
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: "/protected",
			"Set-Cookie": `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
		}
	});
}

async function handleLogout(
	request: Request,
	env: Env,
	sessionId: string | null
): Promise<Response> {
	await destroySession(env.SESSIONS, sessionId);

	return new Response(null, {
		status: 302,
		headers: {
			Location: "/",
			"Set-Cookie": "session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
		}
	});
}

// Divinci JWT trading
async function getDivinciJWT(
	env: Env,
	session: Session,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const response = await fetch(`${env.DIVINCI_API_URL}/embed/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				apikey: env.DIVINCI_API_KEY,
				userId: session.userId,
				username: session.username,
				picture: session.picture
			})
		});

		if (!response.ok) {
			throw new Error(`Divinci API error: ${response.status}`);
		}

		const data = await response.json() as { refreshToken: string };
		return new Response(JSON.stringify({ token: data.refreshToken }), {
			headers: {
				"Content-Type": "application/json",
				...corsHeaders
			}
		});
	} catch (error) {
		console.error("Failed to get Divinci JWT:", error);
		return new Response(
			JSON.stringify({ error: "Failed to get JWT" }),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					...corsHeaders
				}
			}
		);
	}
}

// Page renderers
function renderHomePage(env: Env, session: Session | null): Response {
	const html = renderLayout(
		env,
		session,
		"Home",
		`
		<div class="page">
			<h1>Welcome to SSR External Login Demo</h1>

			${
				session
					? `
				<div class="info-box">
					<p>Hello, <strong>${SECURITY.sanitizeString(session.name, 50)}</strong>! You are logged in.</p>
					<p>This demo shows how to integrate Divinci chat with external authentication in a Server-Side Rendered application.</p>
				</div>
			`
					: `
				<div class="info-box">
					<p>This demo shows how to integrate Divinci chat with external authentication in a Server-Side Rendered application.</p>
					<p>Please <a href="/login">log in</a> to access the protected chat features.</p>
				</div>
			`
			}

			<h2>How it works</h2>
			<ol>
				<li><strong>User Authentication:</strong> Users log in with your existing authentication system</li>
				<li><strong>Server-Side Sessions:</strong> User info stored in server sessions</li>
				<li><strong>JWT Trading:</strong> Server trades user info for Divinci JWT during page render</li>
				<li><strong>Embed Integration:</strong> JWT passed directly to embed script via data attributes</li>
				<li><strong>Origin Validation:</strong> Divinci validates that your domain is authorized</li>
			</ol>

			<div class="deploy-section">
				<h3>🚀 Deploy Your Own</h3>
				<p>Deploy this SSR example to Cloudflare Workers:</p>
				<p>
					<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/Divinci-AI/Examples/tree/main/embed/external-login-ssr"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers"/></a>
				</p>
				<p class="deploy-note">
					<strong>Don't have a Divinci account yet?</strong> <a href="https://divinci.app" target="_blank" rel="noopener noreferrer">Sign up for free</a> to create your AI and get your API credentials.
				</p>
				<p class="deploy-note">
					Requires Cloudflare account (free tier works!).
					See <a href="https://github.com/Divinci-AI/Examples/blob/main/embed/HowToEmbed.md" target="_blank">documentation</a> for setup.
				</p>
			</div>

			<h2>Other Integration Examples</h2>
			<ul>
				<li><a href="https://whitelabel-static-example-staging.divinci-ai.workers.dev" target="_blank">📄 Static Example - Simplest Integration</a></li>
				<li><a href="https://whitelabel-spa-demo-staging.divinci-ai.workers.dev" target="_blank">⚛️ SPA Example - Single Page App with JWT</a></li>
			</ul>

			<h2>Demo Pages</h2>
			<ul>
				<li><a href="/example">Example Page</a> - Public page accessible to everyone</li>
				${
					session
						? '<li><a href="/protected">Protected Page</a> - Private page with chat (requires login)</li>'
						: '<li>Protected Page - Private page with chat (requires <a href="/login">login</a>)</li>'
				}
			</ul>

			<h2>Test Users</h2>
			<p>You can log in with any of these test accounts:</p>
			<ul>
				<li><strong>alice</strong> / password123</li>
				<li><strong>bob</strong> / secret456</li>
				<li><strong>charlie</strong> / test789</li>
			</ul>

			${
				session
					? `
				<div class="alert alert-success">
					<strong>You're logged in!</strong> Try visiting the <a href="/protected">Protected Page</a> to see the chat integration in action.
				</div>
			`
					: ""
			}
		</div>
	`
	);

	return new Response(html, {
		headers: { "Content-Type": "text/html;charset=UTF-8" }
	});
}

function renderLoginPage(
	env: Env,
	session: Session | null,
	error?: string
): Response | string {
	const html = renderLayout(
		env,
		session,
		"Login",
		`
		<div class="page">
			<h1>Login</h1>

			${
				error
					? `<div class="alert alert-error">${error}</div>`
					: ""
			}

			<form method="POST" action="/login" class="login-form">
				<div class="form-group">
					<label for="username">Username</label>
					<input type="text" id="username" name="username" required autofocus>
				</div>

				<div class="form-group">
					<label for="password">Password</label>
					<input type="password" id="password" name="password" required>
				</div>

				<button type="submit" class="btn btn-primary">Log In</button>
			</form>

			<div class="info-box" style="margin-top: 20px;">
				<h3>Test Accounts</h3>
				<ul>
					<li>alice / password123</li>
					<li>bob / secret456</li>
					<li>charlie / test789</li>
				</ul>
			</div>
		</div>
	`
	);

	if (typeof html === "string") {
		return html;
	}
	return new Response(html, {
		headers: { "Content-Type": "text/html;charset=UTF-8" }
	});
}

function renderExamplePage(env: Env, session: Session | null): Response {
	const html = renderLayout(
		env,
		session,
		"Example",
		`
		<div class="page">
			<h1>Example Page</h1>
			<p>This is a public page accessible to everyone.</p>

			<div class="info-box">
				<h3>💡 About External Login</h3>
				<p>
					The chat embed can work with or without a logged-in user. When there's no user,
					the chat can handle authentication internally, or you can leave the
					<code>divinci-external-user</code> attribute empty to indicate you'll provide
					a user token when available.
				</p>
			</div>
		</div>

		<script
			src="${env.EMBED_SCRIPT_URL}"
			divinci-release="${env.RELEASE_ID}"
			divinci-external-user
		></script>
	`
	);

	return new Response(html, {
		headers: { "Content-Type": "text/html;charset=UTF-8" }
	});
}

function renderProtectedPage(env: Env, session: Session): Response {
	const html = renderLayout(
		env,
		session,
		"Protected Page",
		`
		<div class="page">
			<h1>Protected Page</h1>
			<div class="alert alert-success">
				<strong>Welcome, ${SECURITY.sanitizeString(session.name, 50)}!</strong> This page requires authentication.
			</div>

			<div class="info-box">
				<h3>🔐 Authenticated Chat</h3>
				<p>
					The chat below is initialized with your user token. This allows Divinci to:
				</p>
				<ul>
					<li>Personalize the chat experience</li>
					<li>Maintain conversation history</li>
					<li>Apply user-specific settings and permissions</li>
				</ul>
			</div>
		</div>

		<script src="${env.EMBED_SCRIPT_URL}"></script>
		<script>
			// Get JWT token from server
			fetch('/api/get-jwt')
				.then(res => res.json())
				.then(data => {
					// Initialize chat with user token
					const script = document.querySelector('script[src*="embed-script"]');
					if (script) {
						script.setAttribute('divinci-release', '${env.RELEASE_ID}');
						script.setAttribute('divinci-external-user', data.token);
					}
				})
				.catch(error => {
					console.error('Failed to get JWT:', error);
				});
		</script>
	`
	);

	return new Response(html, {
		headers: { "Content-Type": "text/html;charset=UTF-8" }
	});
}

function renderLayout(
	env: Env,
	session: Session | null,
	title: string,
	content: string
): string {
	// Sanitize title to prevent XSS
	const safeTitle = SECURITY.sanitizeString(title, 100);

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>${safeTitle} - Divinci SSR Demo</title>
		<meta http-equiv="X-Content-Type-Options" content="nosniff">
		<meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
		<meta http-equiv="Content-Security-Policy" content="default-src 'self' ${env.EMBED_SCRIPT_URL.replace(/\/[^\/]*$/, '')} ${env.DIVINCI_API_URL}; script-src 'self' 'unsafe-inline' ${env.EMBED_SCRIPT_URL.replace(/\/[^\/]*$/, '')}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ${env.DIVINCI_API_URL};">
		<link rel="stylesheet" href="/styles.css">
	</head>
	<body>
		<header class="site-header">
			<div class="container">
				<h1 class="logo">🚀 Divinci SSR Demo</h1>
				<nav>
					<a href="/">Home</a>
					<a href="/example">Example</a>
					${session ? '<a href="/protected">Protected</a>' : ""}
					${
						session
							? `
						<div class="user-menu">
							<span>${SECURITY.sanitizeString(session.name, 50)}</span>
							<a href="/logout" class="btn-logout">Logout</a>
						</div>
					`
							: '<a href="/login" class="btn-login">Login</a>'
					}
				</nav>
			</div>
		</header>

		<main class="container">
			${content}
		</main>

		<footer class="site-footer">
			<div class="container">
				<p>Environment: <strong>${env.ENVIRONMENT}</strong></p>
				<p>Powered by <a href="https://divinci.ai" target="_blank">Divinci AI</a></p>
			</div>
		</footer>
	</body>
</html>`;
}

const CSS_STYLES = `
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	line-height: 1.6;
	color: #333;
	background: #f5f5f5;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 20px;
}

.site-header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 20px 0;
	box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.site-header .container {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.logo {
	font-size: 1.5rem;
	margin: 0;
}

nav {
	display: flex;
	gap: 20px;
	align-items: center;
}

nav a {
	color: white;
	text-decoration: none;
	font-weight: 500;
}

nav a:hover {
	text-decoration: underline;
}

.user-menu {
	display: flex;
	gap: 10px;
	align-items: center;
}

.btn-login, .btn-logout {
	background: rgba(255,255,255,0.2);
	padding: 8px 16px;
	border-radius: 6px;
}

main {
	padding: 40px 20px;
}

.page {
	background: white;
	padding: 40px;
	border-radius: 12px;
	box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
	font-size: 2.5rem;
	margin-bottom: 20px;
	color: #333;
}

h2 {
	font-size: 1.8rem;
	margin: 30px 0 15px;
	color: #444;
}

h3 {
	font-size: 1.4rem;
	margin-bottom: 10px;
	color: #555;
}

.info-box {
	background: #f8f9fa;
	border-left: 4px solid #667eea;
	padding: 20px;
	margin: 20px 0;
	border-radius: 8px;
}

.alert {
	padding: 15px;
	border-radius: 8px;
	margin: 20px 0;
}

.alert-success {
	background: #d4edda;
	border-left: 4px solid #28a745;
	color: #155724;
}

.alert-error {
	background: #f8d7da;
	border-left: 4px solid #dc3545;
	color: #721c24;
}

.login-form {
	max-width: 400px;
	margin: 30px 0;
}

.form-group {
	margin-bottom: 20px;
}

.form-group label {
	display: block;
	margin-bottom: 5px;
	font-weight: 600;
	color: #555;
}

.form-group input {
	width: 100%;
	padding: 10px;
	border: 2px solid #ddd;
	border-radius: 6px;
	font-size: 1rem;
}

.form-group input:focus {
	outline: none;
	border-color: #667eea;
}

.btn {
	padding: 12px 24px;
	border: none;
	border-radius: 6px;
	font-size: 1rem;
	cursor: pointer;
	font-weight: 600;
}

.btn-primary {
	background: #667eea;
	color: white;
}

.btn-primary:hover {
	background: #5568d3;
}

.site-footer {
	background: #333;
	color: white;
	padding: 20px 0;
	text-align: center;
	margin-top: 40px;
}

.site-footer a {
	color: #667eea;
	text-decoration: none;
}

code {
	background: #f4f4f4;
	padding: 2px 6px;
	border-radius: 3px;
	font-family: monospace;
}

ol, ul {
	margin-left: 30px;
	margin-top: 10px;
}

li {
	margin: 8px 0;
}

.deploy-section {
	background: #f6f6f6;
	border: 1px solid #e0e0e0;
	padding: 30px;
	border-radius: 8px;
	text-align: center;
	margin: 30px 0;
}

.deploy-section h3 {
	color: #333;
	margin-bottom: 15px;
}

.deploy-section img {
	display: inline-block;
	margin: 10px 0;
}

.deploy-note {
	font-size: 0.9rem;
	color: #666;
	margin-top: 10px;
}

.deploy-note a {
	color: #667eea;
	text-decoration: underline;
}

@media (max-width: 768px) {
	.site-header .container {
		flex-direction: column;
		gap: 15px;
	}

	nav {
		flex-direction: column;
		gap: 10px;
	}

	.page {
		padding: 20px;
	}

	h1 {
		font-size: 2rem;
	}
}
`;
