import {useEffect,useRef,useState} from 'react';
const key='kla-klok-room';
function stored(){try{return JSON.parse(sessionStorage.getItem(key))}catch{return null}}
async function request(path,method='GET',data,token){
 const response=await fetch('/api/'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(8000)});
 const value=await response.json();if(!response.ok)throw new Error(value.error||'Unable to reach the room.');return value;
}
export function useRoom(){
 const [session,setSession]=useState(stored),[room,setRoom]=useState(null),[error,setError]=useState(''),[pending,setPending]=useState(false),[connected,setConnected]=useState(false);
 const lock=useRef(false),revision=useRef(0);
 useEffect(()=>{
  try{if(session)sessionStorage.setItem(key,JSON.stringify(session));else sessionStorage.removeItem(key)}catch{}
  if(!session){setRoom(null);setConnected(false);return;}
  let cancelled=false,timer;
  async function poll(){
   const version=revision.current;
   try{const value=await request('rooms/'+session.code,'GET',undefined,session.token);if(!cancelled&&version===revision.current&&!lock.current){setRoom(value);setConnected(true);setError('')}}
   catch(error){if(!cancelled){setConnected(false);setError(error.message)}}
   if(!cancelled)timer=setTimeout(poll,900);
  }
  poll();return()=>{cancelled=true;clearTimeout(timer)};
 },[session]);
 async function enter(mode,name,code){
  if(lock.current)return;lock.current=true;setPending(true);setError('');
  try{const value=await request(mode,'POST',{name,code});setSession(value)}catch(error){setError(error.message)}finally{lock.current=false;setPending(false)}
 }
 async function act(action,data={}){
  if(lock.current||!session)return;lock.current=true;revision.current++;setPending(true);setError('');
  try{const value=await request('rooms/'+session.code,'POST',{action,...data},session.token);if(value.left){setSession(null);setRoom(null)}else{setRoom(value);setConnected(true)}}
  catch(error){setError(error.message)}finally{lock.current=false;revision.current++;setPending(false)}
 }
 function forget(){setSession(null);setRoom(null);setError('')}
 return {session,room,error,pending,connected,enter,act,forget};
}
