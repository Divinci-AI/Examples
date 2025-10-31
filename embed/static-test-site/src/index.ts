/**
 * Cloudflare Worker for Static Test Site Example
 * Demonstrates the simplest way to embed Divinci chat
 */

export interface Env {
	EMBED_SCRIPT_URL: string;
	RELEASE_ID: string;
	ENVIRONMENT: string;
}

const HTML_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Divinci Static Example - Simple Embed</title>
    <link rel="stylesheet" href="/styles.css">

    <!-- Divinci Chat Embed - Simplest Integration -->
    <script
      src="{{EMBED_SCRIPT_URL}}"
      divinci-release="{{RELEASE_ID}}"
      divinci-external-user
    ></script>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>🚀 Divinci Static Example</h1>
        <p class="subtitle">The simplest way to embed Divinci chat</p>
      </header>

      <main>
        <section class="info-box">
          <h2>Welcome to the Static Site Example</h2>
          <p>
            This demonstrates the <strong>simplest possible integration</strong> of Divinci chat.
            Just add a script tag and you're done!
          </p>
        </section>

        <section class="code-example">
          <h3>How it works:</h3>
          <pre><code>&lt;script
  src="{{EMBED_SCRIPT_URL}}"
  divinci-release="{{RELEASE_ID}}"
  divinci-external-user
&gt;&lt;/script&gt;</code></pre>

          <div class="features">
            <h4>Features:</h4>
            <ul>
              <li>✅ Zero configuration required</li>
              <li>✅ Auto-embed on page load</li>
              <li>✅ External user authentication ready</li>
              <li>✅ Fully responsive</li>
            </ul>
          </div>
        </section>

        <section class="info-box info-note">
          <h3>📝 Note about External Users</h3>
          <p>
            The <code>divinci-external-user</code> attribute tells the chat that you'll handle
            user authentication. When a user token is available, update the attribute:
          </p>
          <pre><code>divinci-external-user="USER_TOKEN_HERE"</code></pre>
        </section>

        <section class="deploy-section">
          <h3>🚀 Deploy Your Own</h3>
          <p>Deploy this example to Cloudflare Workers with one click:</p>
          <p>
            <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/Divinci-AI/Examples/tree/main/embed/static-test-site"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers"/></a>
          </p>
          <p class="deploy-note">
            You'll need a Cloudflare account (free tier works!) and your Divinci Release ID.
            See <a href="https://github.com/Divinci-AI/Examples/blob/main/embed/HowToEmbed.md" target="_blank">documentation</a> for setup instructions.
          </p>
        </section>

        <section class="links">
          <h3>Other Integration Examples:</h3>
          <ul>
            <li><a href="https://whitelabel-ssr-demo-staging.divinci-ai.workers.dev" target="_blank">🔄 SSR Example - Server-Side Rendering with Sessions</a></li>
            <li><a href="https://whitelabel-spa-demo-staging.divinci-ai.workers.dev" target="_blank">⚛️ SPA Example - Single Page App with JWT Auth</a></li>
          </ul>

          <h3>Resources:</h3>
          <ul>
            <li><a href="https://github.com/Divinci-AI/Examples/blob/main/embed/HowToEmbed.md" target="_blank">📖 Full Documentation</a></li>
            <li><a href="https://github.com/Divinci-AI/Examples" target="_blank">💻 Source Code & Examples</a></li>
            <li><a href="https://divinci.ai/docs" target="_blank">📚 Divinci AI Documentation</a></li>
          </ul>
        </section>
      </main>

      <footer>
        <p>Environment: <strong>{{ENVIRONMENT}}</strong></p>
        <p>Powered by <a href="https://divinci.ai" target="_blank">Divinci AI</a></p>
      </footer>
    </div>

    <script>
      // Optional: Log when Divinci is ready
      window.addEventListener('DOMContentLoaded', () => {
        console.log('🎯 Static example loaded');
        console.log('Release ID:', '{{RELEASE_ID}}');
        console.log('Environment:', '{{ENVIRONMENT}}');
      });
    </script>
  </body>
</html>`;

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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
  text-align: center;
}

header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

main {
  padding: 30px;
}

section {
  margin-bottom: 30px;
}

.info-box {
  background: #f8f9fa;
  border-left: 4px solid #667eea;
  padding: 20px;
  border-radius: 8px;
}

.info-note {
  border-left-color: #ffc107;
  background: #fff9e6;
}

h2, h3, h4 {
  margin-bottom: 15px;
  color: #333;
}

h2 {
  font-size: 1.8rem;
}

h3 {
  font-size: 1.4rem;
}

h4 {
  font-size: 1.1rem;
}

.code-example {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

pre {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 15px 0;
}

code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
}

.features ul, .links ul {
  list-style-position: inside;
  padding-left: 10px;
}

.features li, .links li {
  margin: 8px 0;
  font-size: 1.05rem;
}

.links a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.links a:hover {
  text-decoration: underline;
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

footer {
  background: #f8f9fa;
  padding: 20px 30px;
  text-align: center;
  border-top: 1px solid #e9ecef;
}

footer p {
  margin: 5px 0;
  color: #666;
}

footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

footer a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  header h1 {
    font-size: 2rem;
  }

  main {
    padding: 20px;
  }

  pre {
    font-size: 0.8rem;
  }
}
`;

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Handle CSS request
		if (url.pathname === "/styles.css") {
			return new Response(CSS_STYLES, {
				headers: {
					"Content-Type": "text/css",
					"Cache-Control": "public, max-age=3600"
				}
			});
		}

		// Handle main page
		if (url.pathname === "/" || url.pathname === "") {
			const html = HTML_TEMPLATE
				.replace(/{{EMBED_SCRIPT_URL}}/g, env.EMBED_SCRIPT_URL)
				.replace(/{{RELEASE_ID}}/g, env.RELEASE_ID)
				.replace(/{{ENVIRONMENT}}/g, env.ENVIRONMENT);

			return new Response(html, {
				headers: {
					"Content-Type": "text/html;charset=UTF-8",
					"Cache-Control": "public, max-age=300"
				}
			});
		}

		// 404 for other paths
		return new Response("Not Found", { status: 404 });
	}
};
