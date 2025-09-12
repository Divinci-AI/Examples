require("dotenv").config();

module.exports = {
  port: process.env.EXAMPLE_SPA_PORT,
  sessionSecret: "spa-test-secret",
  divinci: {
    embedScriptUrl: "http://localhost:8081/embed-script.js",
    releaseId: "68c33a5add69d6d6cd9aa6d4",

    apiUrl: "http://localhost:9080",
    apiKey: "divinci_mffwjdue_5694cp9y1_e0ee6b5c5cef19601b3fc8edccbf9f799aa4db4f592d40e0a3db672f1fcc223b",
  }
};
