const config = require("../config");

const DIVINCI_EMBED = {
  embedScriptUrl: config.divinci.embedScriptUrl,
  releaseId: config.divinci.releaseId,
  displayLoggedOutChat: true,
};

module.exports = {
  error: null,
  divinciDisplay: true,
  divinciEmbed: DIVINCI_EMBED,
  escapeHTMLAttribute: (str)=>{
    if(typeof str !== "string") return str;
    return str
      .replace(/\\/g, "\\\\")  // Escape backslashes first
      .replace(/"/g, "\\\"");   // Then escape quotes
  }
};
