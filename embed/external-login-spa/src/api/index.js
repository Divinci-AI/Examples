import { apiLogin, apiMe, apiAuthRefresh, apiLogout } from "./auth";
import { apiDivinciJWT } from "./divinci";

export const API = {
  auth: {
    login: apiLogin,
    me: apiMe,
    refresh: apiAuthRefresh,
    logout: apiLogout
  },
  divinci: {
    getJWT: apiDivinciJWT,
  }
};
