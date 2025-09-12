import { useRef, useEffect, useState } from "react";

export const PROMISED_MEMO_STATE = {
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
};

export function usePromiseMemo(fn, deps){
  const active = useRef(-1);
  const [value, setValue] = useState({
    state: PROMISED_MEMO_STATE.LOADING,
    error: null,
    value: null,
  });
  useEffect(()=>{
    const id = Date.now();
    active.current = id;
    setValue({
      state: PROMISED_MEMO_STATE.LOADING,
      error: null,
      value: null,
    });
    Promise.resolve().then(async function(){
      try {
        const value = await fn();
        if(active.current !== id) return;
        setValue({
          state: PROMISED_MEMO_STATE.SUCCESS,
          error: null,
          value,
        });
      }catch(e){
        if(active.current !== id) return;
        setValue({
          state: PROMISED_MEMO_STATE.FAILURE,
          error: e,
          value: null,
        });
      }
    });
    return ()=>{
      active.current = -1;
    };
  }, deps);
  return value;
}

