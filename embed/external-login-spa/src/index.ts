/**
 * Cloudflare Worker for SPA Demo Example
 * Demonstrates Single Page Application with JWT-based authentication
 * Note: This is a simplified version. In production, you'd bundle actual React code.
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
			headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
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

interface AuthToken {
	userId: string;
	username: string;
	name: string;
	picture?: string;
	iat: number;
	exp: number;
}

// Mock user database
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

		// Get CORS configuration
		const allowedOrigins = env.ALLOWED_ORIGINS?.split(",") || ["*"];
		const origin = request.headers.get("Origin");
		const corsHeaders = SECURITY.getCORSHeaders(origin, allowedOrigins);

		// CORS preflight handling
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: corsHeaders
			});
		}

		// Rate limiting (skip for static assets)
		if (!path.startsWith("/style.css") && !path.startsWith("/app.js")) {
			const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
			const rateLimit = parseInt(env.RATE_LIMIT_PER_MINUTE || "60");

			if (!(await SECURITY.checkRateLimit(env.SESSIONS, clientIP, rateLimit))) {
				return new Response(
					JSON.stringify({ error: "Too many requests. Please try again later." }),
					{
						status: 429,
						headers: {
							"Retry-After": "60",
							"Content-Type": "application/json",
							...corsHeaders
						}
					}
				);
			}
		}

		// Security headers for all responses
		const securityHeaders = {
			"X-Content-Type-Options": "nosniff",
			"X-Frame-Options": "SAMEORIGIN",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			...corsHeaders
		};

		// API routes
		if (path.startsWith("/api/")) {
			return handleAPI(request, env, path, securityHeaders);
		}

		// Static assets
		if (path === "/app.js") {
			return new Response(SPA_JS, {
				headers: {
					"Content-Type": "application/javascript",
					"Cache-Control": "public, max-age=3600",
					...securityHeaders
				}
			});
		}

		if (path === "/style.css") {
			return new Response(SPA_CSS, {
				headers: {
					"Content-Type": "text/css",
					"Cache-Control": "public, max-age=3600",
					...securityHeaders
				}
			});
		}

		// SPA fallback - serve index.html for all other routes
		return new Response(renderIndexHTML(env), {
			headers: {
				"Content-Type": "text/html;charset=UTF-8",
				...securityHeaders
			}
		});
	}
};

async function handleAPI(
	request: Request,
	env: Env,
	path: string,
	securityHeaders: Record<string, string>
): Promise<Response> {
	const responseHeaders = {
		...securityHeaders,
		"Content-Type": "application/json"
	};

	// Login endpoint
	if (path === "/api/auth/login" && request.method === "POST") {
		const { username: rawUsername, password: rawPassword } = await request.json() as { username: string; password: string };

		// Input validation
		if (!rawUsername || !rawPassword) {
			return new Response(
				JSON.stringify({ error: "Username and password are required" }),
				{ status: 400, headers: responseHeaders }
			);
		}

		// Sanitize and validate username
		const username = SECURITY.sanitizeString(rawUsername, 20);
		if (!SECURITY.validateUsername(username)) {
			return new Response(
				JSON.stringify({ error: "Invalid username format" }),
				{ status: 400, headers: responseHeaders }
			);
		}

		// Password length validation (don't sanitize passwords)
		if (rawPassword.length < 6 || rawPassword.length > 100) {
			return new Response(
				JSON.stringify({ error: "Invalid credentials" }),
				{ status: 401, headers: responseHeaders }
			);
		}

		const user = MOCK_USERS[username];
		if (!user || user.password !== rawPassword) {
			return new Response(
				JSON.stringify({ error: "Invalid credentials" }),
				{ status: 401, headers: responseHeaders }
			);
		}

		const token = await createJWT(env, {
			id: username,
			username,
			name: user.name,
			picture: user.picture
		});

		return new Response(
			JSON.stringify({
				token,
				user: { username, name: user.name, picture: user.picture }
			}),
			{ headers: responseHeaders }
		);
	}

	// Get current user
	if (path === "/api/me" && request.method === "GET") {
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response(
				JSON.stringify({ error: "Unauthorized" }),
				{ status: 401, headers: responseHeaders }
			);
		}

		const token = authHeader.substring(7);
		const user = await verifyJWT(env, token);

		if (!user) {
			return new Response(
				JSON.stringify({ error: "Invalid token" }),
				{ status: 401, headers: responseHeaders }
			);
		}

		return new Response(
			JSON.stringify({ user }),
			{ headers: responseHeaders }
		);
	}

	// Get Divinci JWT
	if (path === "/api/get-jwt" && request.method === "GET") {
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response(
				JSON.stringify({ error: "Unauthorized" }),
				{ status: 401, headers: responseHeaders }
			);
		}

		const token = authHeader.substring(7);
		const user = await verifyJWT(env, token);

		if (!user) {
			return new Response(
				JSON.stringify({ error: "Invalid token" }),
				{ status: 401, headers: responseHeaders }
			);
		}

		try {
			const response = await fetch(`${env.DIVINCI_API_URL}/embed/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					apikey: env.DIVINCI_API_KEY,
					userId: user.userId,
					username: user.username,
					picture: user.picture
				})
			});

			if (!response.ok) {
				throw new Error(`Divinci API error: ${response.status}`);
			}

			const data = await response.json() as { refreshToken: string };
			return new Response(
				JSON.stringify({ token: data.refreshToken }),
				{ headers: responseHeaders }
			);
		} catch (error) {
			console.error("Failed to get Divinci JWT:", error);
			return new Response(
				JSON.stringify({ error: "Failed to get JWT" }),
				{ status: 500, headers: responseHeaders }
			);
		}
	}

	return new Response(
		JSON.stringify({ error: "Not found" }),
		{ status: 404, headers: responseHeaders }
	);
}

// Simple JWT implementation (in production, use a proper library)
async function createJWT(env: Env, user: User): Promise<string> {
	const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const payload = btoa(
		JSON.stringify({
			userId: user.id,
			username: user.username,
			name: user.name,
			picture: user.picture,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
		})
	);

	const signature = btoa(`${header}.${payload}.secret`);
	return `${header}.${payload}.${signature}`;
}

async function verifyJWT(env: Env, token: string): Promise<AuthToken | null> {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;

		const payload = JSON.parse(atob(parts[1])) as AuthToken;

		// Check expiration
		if (payload.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}

function renderIndexHTML(env: Env): string {
	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Divinci SPA Demo - React with JWT Auth</title>
		<link rel="stylesheet" href="/style.css">
	</head>
	<body>
		<div id="root"></div>

		<!-- Divinci Embed Script -->
		<script src="${env.EMBED_SCRIPT_URL}"></script>

		<!-- Environment Config -->
		<script>
			window.DIVINCI_CONFIG = {
				embedScriptUrl: '${env.EMBED_SCRIPT_URL}',
				apiUrl: '/api',
				releaseId: '${env.RELEASE_ID}',
				environment: '${env.ENVIRONMENT}'
			};
		</script>

		<!-- React App -->
		<script src="/app.js"></script>
	</body>
</html>`;
}

// Simplified SPA JavaScript (normally this would be bundled React)
const SPA_JS = `
// Simple SPA implementation
const { DivinciChat } = window.DIVINCI_AI || {};
const config = window.DIVINCI_CONFIG;

class App {
	constructor() {
		this.user = null;
		this.token = localStorage.getItem('authToken');
		this.divinciChat = null;
		this.init();
	}

	async init() {
		if (this.token) {
			await this.checkAuth();
		}
		this.render();
		this.setupRouting();
	}

	async checkAuth() {
		try {
			const response = await fetch(config.apiUrl + '/me', {
				headers: { Authorization: 'Bearer ' + this.token }
			});

			if (response.ok) {
				const data = await response.json();
				this.user = data.user;
			} else {
				localStorage.removeItem('authToken');
				this.token = null;
			}
		} catch (error) {
			console.error('Auth check failed:', error);
		}
	}

	async login(username, password) {
		try {
			const response = await fetch(config.apiUrl + '/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			if (!response.ok) {
				throw new Error('Login failed');
			}

			const data = await response.json();
			this.token = data.token;
			this.user = data.user;
			localStorage.setItem('authToken', this.token);

			this.navigate('/protected');
		} catch (error) {
			alert('Login failed: ' + error.message);
		}
	}

	logout() {
		this.user = null;
		this.token = null;
		localStorage.removeItem('authToken');
		this.navigate('/');
	}

	async initDivinciChat() {
		if (!DivinciChat) {
			console.error('DivinciChat not loaded');
			return;
		}

		this.divinciChat = new DivinciChat({
			releaseId: config.releaseId,
			externalLogin: true,
			toggleable: false,
			debug: false
		});

		if (this.user && this.token) {
			try {
				const response = await fetch(config.apiUrl + '/get-jwt', {
					headers: { Authorization: 'Bearer ' + this.token }
				});

				if (response.ok) {
					const data = await response.json();
					this.divinciChat.auth.login(data.token);
				}
			} catch (error) {
				console.error('Failed to get Divinci JWT:', error);
			}
		}

		const container = document.querySelector('#chat-container');
		if (container) {
			container.appendChild(this.divinciChat.iframe);
			this.divinciChat.iframe.style.width = '100%';
			this.divinciChat.iframe.style.height = '70vh';
			this.divinciChat.iframe.style.border = 'none';
			this.divinciChat.iframe.style.borderRadius = '12px';
		}
	}

	setupRouting() {
		window.addEventListener('popstate', () => this.render());

		document.addEventListener('click', (e) => {
			if (e.target.matches('[data-route]')) {
				e.preventDefault();
				this.navigate(e.target.getAttribute('data-route'));
			}
		});
	}

	navigate(path) {
		window.history.pushState({}, '', path);
		this.render();
	}

	render() {
		const path = window.location.pathname;
		const root = document.getElementById('root');

		let content = '';

		// Header
		content += '<header class="header">';
		content += '<div class="container">';
		content += '<h1 class="logo">⚛️ Divinci SPA Demo</h1>';
		content += '<nav>';
		content += '<a href="/" data-route="/">Home</a>';
		content += '<a href="/example" data-route="/example">Example</a>';

		if (this.user) {
			content += '<a href="/protected" data-route="/protected">Protected</a>';
			content += '<div class="user-menu">';
			content += '<span>' + this.user.name + '</span>';
			content += '<button onclick="app.logout()" class="btn-logout">Logout</button>';
			content += '</div>';
		} else {
			content += '<a href="/login" data-route="/login" class="btn-login">Login</a>';
		}

		content += '</nav>';
		content += '</div>';
		content += '</header>';

		content += '<main class="container">';

		// Routes
		if (path === '/' || path === '') {
			content += this.renderHome();
		} else if (path === '/login') {
			content += this.renderLogin();
		} else if (path === '/example') {
			content += this.renderExample();
		} else if (path === '/protected') {
			if (!this.user) {
				this.navigate('/login');
				return;
			}
			content += this.renderProtected();
		} else {
			content += '<div class="page"><h1>404 - Not Found</h1></div>';
		}

		content += '</main>';

		// Footer
		content += '<footer class="footer">';
		content += '<div class="container">';
		content += '<p>Environment: <strong>' + config.environment + '</strong></p>';
		content += '<p>Powered by <a href="https://divinci.ai" target="_blank">Divinci AI</a></p>';
		content += '</div>';
		content += '</footer>';

		root.innerHTML = content;

		// Initialize chat on protected page
		if (path === '/protected' && this.user) {
			setTimeout(() => this.initDivinciChat(), 100);
		}
	}

	renderHome() {
		return \`
			<div class="page">
				<h1>Welcome to SPA External Login Demo</h1>
				\${this.user ? \`
					<div class="info-box">
						<p>Hello, <strong>\${this.user.name}</strong>! You are logged in.</p>
						<p>This demo shows how to integrate Divinci chat with external authentication in a Single Page Application.</p>
					</div>
				\` : \`
					<div class="info-box">
						<p>This demo shows how to integrate Divinci chat with external authentication in a Single Page Application.</p>
						<p>Please <a href="/login" data-route="/login">log in</a> to access the protected chat features.</p>
					</div>
				\`}

				<h2>How it works</h2>
				<ol>
					<li><strong>Client-Side Routing:</strong> React Router handles navigation</li>
					<li><strong>JWT Authentication:</strong> Stateless auth using tokens</li>
					<li><strong>Local Storage:</strong> Tokens stored in browser</li>
					<li><strong>API Integration:</strong> Protected endpoints require bearer token</li>
					<li><strong>Chat Integration:</strong> Dynamic JWT trading for chat access</li>
				</ol>

				<div class="deploy-section">
					<h3>🚀 Deploy Your Own</h3>
					<p>Deploy this SPA example to Cloudflare Workers:</p>
					<p>
						<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/Divinci-AI/Examples/tree/main/embed/external-login-spa"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers"/></a>
					</p>
					<p class="deploy-note">
						Requires Cloudflare account and Divinci API credentials.
						See <a href="https://github.com/Divinci-AI/Examples/blob/main/embed/HowToEmbed.md" target="_blank">documentation</a> for setup.
					</p>
				</div>

				<h2>Other Integration Examples</h2>
				<ul>
					<li><a href="https://whitelabel-static-example-staging.divinci-ai.workers.dev" target="_blank">📄 Static Example - Simplest Integration</a></li>
					<li><a href="https://whitelabel-ssr-demo-staging.divinci-ai.workers.dev" target="_blank">🔄 SSR Example - Server-Side Rendering</a></li>
				</ul>

				<h2>Test Users</h2>
				<ul>
					<li><strong>alice</strong> / password123</li>
					<li><strong>bob</strong> / secret456</li>
					<li><strong>charlie</strong> / test789</li>
				</ul>
			</div>
		\`;
	}

	renderLogin() {
		return \`
			<div class="page">
				<h1>Login</h1>
				<form onsubmit="event.preventDefault(); app.login(event.target.username.value, event.target.password.value);" class="login-form">
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

				<div class="info-box">
					<h3>Test Accounts</h3>
					<ul>
						<li>alice / password123</li>
						<li>bob / secret456</li>
						<li>charlie / test789</li>
					</ul>
				</div>
			</div>
		\`;
	}

	renderExample() {
		return \`
			<div class="page">
				<h1>Example Page</h1>
				<div class="info-box">
					<h3>💡 SPA Architecture</h3>
					<p>This is a Single Page Application built with vanilla JavaScript (normally React).</p>
					<p>Features:</p>
					<ul>
						<li>Client-side routing</li>
						<li>JWT-based authentication</li>
						<li>Dynamic content loading</li>
						<li>State management</li>
					</ul>
				</div>
			</div>
		\`;
	}

	renderProtected() {
		return \`
			<div class="page">
				<h1>Protected Page</h1>
				<div class="alert alert-success">
					<strong>Welcome, \${this.user.name}!</strong> This page requires authentication.
				</div>

				<div class="info-box">
					<h3>🔐 Authenticated Chat</h3>
					<p>The chat below is initialized with your user token.</p>
				</div>

				<div id="chat-container" style="margin-top: 30px;"></div>
			</div>
		\`;
	}
}

// Initialize app
const app = new App();
window.app = app;
`;

const SPA_CSS = `
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

.header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 20px 0;
	box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header .container {
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

nav a, nav button {
	color: white;
	text-decoration: none;
	font-weight: 500;
	background: none;
	border: none;
	cursor: pointer;
	font-size: 1rem;
}

nav a:hover, nav button:hover {
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
	min-height: calc(100vh - 200px);
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

.footer {
	background: #333;
	color: white;
	padding: 20px 0;
	text-align: center;
	margin-top: 40px;
}

.footer a {
	color: #667eea;
	text-decoration: none;
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
	.header .container {
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
