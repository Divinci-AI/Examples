
# How to Embed
## Step 1: Setting Up in the web client
Inside of your workspace
1. Create a release
2. Create an API key, add your site to the allowed origins



## Step 2: Getting the user token to pass to the client
> In your server, at some point you will need to trade the user information for a JWT to pass to the client.
> The username and picture are not as important as the userId
```typescript
type ExpectedLoginBodyType = {
  apikey: string;
  userId: number | string; // both will turn into strings so 12345 and "12345" are the same
  username: string;
  picture?: string | null; // picture is optional, must be a valid https url (http will not work as it's not secure)
}

async function getDivinciJWT(userId, username, picture){
  const response = await fetch(`https://api.divinci.ai/embed/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apikey: "YOUR_API_KEY_FROM_STEP_1",
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
}
```



## Step 3: Auto Embedding the chat
> This is the simplest way to embed the chat
- provide release id and userId to the script
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID_FROM_STEP_1"
  divinci-external-user="YOUR_USER_REFRESH_TOKEN_FROM_STEP_2"
></script>
```

> Important! If there's no user currently logged in, keep the `divinci-external-user` attribute but don't provide a user id. Without the `divinci-external-user` attribute, the chat will handle the login flow internally allowing them to login using their divinci credentials. By keeping the attribute, you are telling the chat that you will be providing a user token when the user is logged in, but that there is no user currenlty logged in.
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID_FROM_STEP_1"
  divinci-external-user
></script>
```




## Step 4: Full Page Chat
> If you'd like control over the size and location of the chat (like a full page chat), you will need to do a bit more work
> See: external-login-ssr/views/full-page-app.ejs

1. Add the script with no information (No release nor divinci-external-user)
```html
<script src="http://embed.divinci.ai/embed-script.js" ></script>
```

2. create a divinci chat
```javascript
const { DivinciChat } = window.DIVINCI_AI;
const releaseId = "YOUR_RELEASE_ID_FROM_STEP_1"
const divinciChat = new DivinciChat({
  releaseId: releaseId,

  // externalUser: true is required for external users
  // otherwise the user will be controlled by divinci's internal auth
  externalUser: true,

  // toggleable: false will prevent the chat from being auto added
  toggleable: false,
  debug: false,
});
```

3. Add the iframe to the page
```javascript
// Get the iframe from the chat
// At the moment, it's not appended to the DOM
const chatIframe = divinciChat.iframe;

// The container is up to you
const container = document.querySelector("#YOUR_CHAT_CONTAINER");
container.appendChild(chatIframe);

// Style it however you want
divinciChat.iframe.style.width = "100%";
divinciChat.iframe.style.height = "70vh";
divinciChat.iframe.style.border = "none";
```

4. Login the user if it exists
```javascript
// logging in is optional
const USER_TOKEN = "YOUR_USER_REFRESH_TOKEN_FROM_STEP_2";
if(USER_TOKEN) {
  divinciChat.auth.login(USER_TOKEN);
}
```



## Step 5: Membership Tiers (Optional)

Control how many messages users can send based on their subscription level in your application.

> **Security Note:** Membership tiers are set **server-side only** during the initial `/embed/login` call (Step 2). The browser client cannot modify or escalate tiers.

### Server-Side: Set Tier During Login

Your backend sets the tier when obtaining the JWT:

```typescript
async function getDivinciJWT(userId, username, picture, subscriptionTier) {
  const response = await fetch("https://api.divinci.ai/embed/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: "YOUR_API_KEY",
      userId: userId,
      username: username,
      picture: picture,
      membershipTier: subscriptionTier  // "free", "basic", "premium", "enterprise", or "unlimited"
    })
  });

  const data = await response.json();
  console.log(`Tier assigned: ${data.tierAssigned}`);  // May be downgraded if not in allowedTiers
  return data.refreshToken;
}
```

### Client-Side: Access Tier Config After Login

The client receives the tier configuration (set server-side) after validating the session:

```javascript
// Login with refreshToken only - tier comes from server
const { tierConfig } = await divinciChat.auth.login(USER_TOKEN);

// Check remaining quota
console.log(`Tier: ${tierConfig.tier}`);
console.log(`${tierConfig.remaining.messagesThisMonth} messages remaining this month`);
```

For full details on tiers, quotas, security model, and handling limits, see [Membership Tiers](./MembershipTiers.md).



## Step 6: Optional Features

The embed client supports several optional features that can be enabled via script attributes or JavaScript configuration. All features default to `false` (disabled).

### Feature Summary

| Feature | Script Attribute | JS Option | Description |
|---------|------------------|-----------|-------------|
| Context Bubbles | `context-bubbles` | `contextBubbles` | Shows RAG document sources as clickable tags |
| Product Recommendations | `product-recommendations` | `productRecommendations` | Displays product cards in AI responses |
| Toggleable Widget | `toggleable` | `toggleable` | Chat appears as floating button that expands on click |
| Metrics | `metrics` | `metrics` | Enables usage metrics tracking |
| Help Requests | `help-requests` | `helpRequests` | Allows users to request human assistance |
| Notifications | `notifications` | `notifications` | Enables notification features |
| Quick Menu | `quick-menu` | `quickMenu` | Shows hover actions on messages (copy, emoji, read aloud) |
| Debug Mode | `debug` | `debug` | Enables console logging for debugging |
| Custom CSS | `css-src` | `cssSrc` | URL to custom CSS for theming |

---

### Context Bubbles

When enabled, context bubbles display which documents were used to answer the user's question. Each source appears as a clickable tag showing the file name with a file-type icon.

**What it shows:**
- File names from your RAG knowledge base
- File type icons (PDF, DOCX, TXT, etc.)
- Hover dropdown with:
  - Vector ID
  - Token count
  - Content preview

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  context-bubbles
></script>
```

**JavaScript Usage:**
```javascript
const { DivinciChat } = window.DIVINCI_AI;

const chat = new DivinciChat({
  releaseId: "YOUR_RELEASE_ID",
  contextBubbles: true,
});

document.getElementById("chat-container").appendChild(chat.iframe);
```

---

### Product Recommendations

When enabled, the AI can display product cards inline with its responses. Products are matched semantically from your product catalog using RAG.

**What it shows:**
- Product name and image
- Price (if available)
- Clickable cards linking to product pages
- Hover popover with full product details

**Requirements:**
- A product catalog must be uploaded to your RAG vector store
- Products should include: name, URL, image URL, price, description

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  product-recommendations
></script>
```

**JavaScript Usage:**
```javascript
const chat = new DivinciChat({
  releaseId: "YOUR_RELEASE_ID",
  productRecommendations: true,
});
```

---

### Toggleable Widget Mode

Instead of embedding as a full-page chat, the toggleable mode renders a floating button (typically bottom-right) that expands into the chat interface when clicked.

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  toggleable
></script>
```

**JavaScript Usage:**
```javascript
const chat = new DivinciChat({
  releaseId: "YOUR_RELEASE_ID",
  toggleable: true,
});

// The widget handles its own rendering - no need to append iframe

// Control the widget programmatically
chat.ui.openChat();    // Open the chat
chat.ui.closeChat();   // Close the chat
chat.ui.toggleChat();  // Toggle open/closed
chat.ui.isOpen;        // Check if open (boolean)

// Listen for toggle events
chat.ui.onToggle.on((isOpen) => {
  console.log("Chat is now:", isOpen ? "open" : "closed");
});
```

---

### Metrics Tracking

Enables usage metrics collection for analytics purposes.

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  metrics
></script>
```

**JavaScript Usage:**
```javascript
const chat = new DivinciChat({
  releaseId: "YOUR_RELEASE_ID",
  metrics: true,
});
```

---

### Help Requests

Enables a button allowing users to request human assistance when the AI cannot adequately answer their question.

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  help-requests
></script>
```

**JavaScript Usage:**
```javascript
const chat = new DivinciChat({
  releaseId: "YOUR_RELEASE_ID",
  helpRequests: true,
});
```

---

### Notifications

Enables notification features for the chat interface.

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  notifications
></script>
```

**JavaScript Usage:**
```javascript
const chat = new DivinciChat({
  releaseId: "YOUR_RELEASE_ID",
  notifications: true,
});
```

---

### Quick Menu

When enabled, a Quick Menu overlay appears when users hover over chat messages. This provides quick actions for interacting with messages.

**What it shows:**
- **Copy Message** - Copy the message content to clipboard
- **Emoji Reactions** - Add emoji reactions to messages (persisted for authenticated users)
- **Read Aloud** - Text-to-speech for assistant messages (browser support required)

**Features:**
- Appears on hover over any message bubble
- Keyboard accessible (Escape to close emoji picker)
- Dark mode support via CSS variables
- Responsive design for smaller embeds

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  quick-menu
></script>
```

**JavaScript Usage:**
```javascript
const chat = new DivinciChat({
  releaseId: "YOUR_RELEASE_ID",
  quickMenu: true,
});
```

**Notes:**
- Emoji reactions are only persisted for authenticated users (anonymous chats show the picker but don't save reactions)
- Read Aloud uses the browser's SpeechSynthesis API and may not be available in all browsers
- The menu automatically hides when the mouse leaves the message area

---

### Combining Multiple Features

You can enable multiple features simultaneously:

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  divinci-external-user
  context-bubbles
  product-recommendations
  quick-menu
  toggleable
  debug
></script>
```

**JavaScript Usage:**
```javascript
const chat = new DivinciChat({
  releaseId: "YOUR_RELEASE_ID",
  externalUser: true,
  contextBubbles: true,
  productRecommendations: true,
  quickMenu: true,
  toggleable: true,
  debug: true,
});
```

---

### Custom CSS Theming

Apply custom styles to the embed client:

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  css-src="https://yoursite.com/custom-chat-theme.css"
></script>
```

**JavaScript Usage:**
```javascript
const chat = new DivinciChat({
  releaseId: "YOUR_RELEASE_ID",
  cssSrc: "https://yoursite.com/custom-chat-theme.css",
});
```

---

### Debug Mode

Enable debug logging to help troubleshoot integration issues:

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  debug
></script>
```

This will log detailed information to the browser console including:
- Configuration loading
- Message bridge communication
- Authentication events
- State changes

---

### Custom Global Variable Name

By default, the embed script exposes `window.DIVINCI_AI`. You can customize this:

**Script Tag Usage:**
```html
<script
  src="https://embed.divinci.ai/embed-script.js"
  divinci-release-id="YOUR_RELEASE_ID"
  data-global-name="MyCustomChat"
></script>

<script>
  // Access via custom name
  const { DivinciChat } = window.MyCustomChat;
</script>
```

---

### Complete Configuration Reference

**Script Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `divinci-release-id` | string | (required) | Your release ID |
| `divinci-external-user` | boolean/string | `false` | Enable external auth, or pass JWT token directly |
| `css-src` | string | - | URL to custom CSS file |
| `debug` | boolean | `false` | Enable debug logging |
| `toggleable` | boolean | `false` | Render as floating widget |
| `context-bubbles` | boolean | `false` | Show RAG source documents |
| `product-recommendations` | boolean | `false` | Show product cards |
| `metrics` | boolean | `false` | Enable metrics tracking |
| `help-requests` | boolean | `false` | Enable help request button |
| `notifications` | boolean | `false` | Enable notifications |
| `quick-menu` | boolean | `false` | Show hover actions on messages |
| `data-global-name` | string | `DIVINCI_AI` | Custom global variable name |

**JavaScript Options (DivinciChat constructor):**

```typescript
interface CreateDivinciChatOptions {
  releaseId: string;           // Required
  cssSrc?: string;             // Custom CSS URL
  debug?: boolean;             // Default: false
  externalUser?: boolean;      // Default: false
  productRecommendations?: boolean;  // Default: false
  toggleable?: boolean;        // Default: false
  metrics?: boolean;           // Default: false
  helpRequests?: boolean;      // Default: false
  notifications?: boolean;     // Default: false
  contextBubbles?: boolean;    // Default: false
  quickMenu?: boolean;         // Default: false
}
```
