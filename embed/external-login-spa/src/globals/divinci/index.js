import { useEffect, useRef } from "react";
import { PROMISED_MEMO_STATE, usePromiseMemo } from "../../utils/promise-memo";
import { useAuth } from "../auth";
import { apiDivinciRelease, apiDivinciJWT } from "../../api/divinci";
const { DivinciChat } = window.DIVINCI_AI;

export function useDivinciChat(){
  const auth = useAuth();
  const { state, error, value: chat } = usePromiseMemo(async ()=>{
    const { releaseId } = await apiDivinciRelease();
    return new DivinciChat({
      releaseId,
      externalLogin: true,
      toggleable: true,

      debug: true,
    });
  }, []);

  const activeUser = useRef();
  useEffect(()=>{
    if(!auth.token) return;
    if(!chat) return;
    activeUser.current = auth.token;
    Promise.resolve().then(async ()=>{
      const { jwt } = await apiDivinciJWT({ authToken: auth.token });
      if(activeUser.current === auth.token){
        await chat.auth.login(jwt);
      }
    });
    return ()=>{
      if(activeUser.current === auth.token){
        chat.auth.logout();
      }
      activeUser.current = null;
    };
  }, [auth.token, chat]);

  if(state === PROMISED_MEMO_STATE.FAILURE){
    return { error };
  }
  return { chat };
}
