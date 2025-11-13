
# How to Embed
## Step 1: Setting Up in the web client
Inside of your workspace
1. Create a release
2. Create an API key, add your site to the allowed origins



## Step 2: Getting the user token to pass to the client
> In your server, at some point you will need to trade the user information for a JWT token to pass to the client.
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
  // otherwise the user will be controlled by divinci's internalauth
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
