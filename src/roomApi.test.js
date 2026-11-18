import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readRoomResponse} from './roomApi.js';

test('HTML fallback and hosting errors show a useful server error',async()=>{
 for(const status of [200,404,502]){
  const response=new Response('<!doctype html><title>Not found</title>',{status,headers:{'Content-Type':'text/html'}});
  await assert.rejects(readRoomResponse(response),/multiplayer server is unavailable/);
 }
});
test('valid API responses and API error messages are preserved',async()=>{
 assert.deepEqual(await readRoomResponse(Response.json({code:'ABC123'})),{code:'ABC123'});
 await assert.rejects(readRoomResponse(Response.json({error:'Room is full'},{status:400})),/Room is full/);
});
test('malformed JSON does not expose parser errors',async()=>{
 await assert.rejects(readRoomResponse(new Response('invalid',{headers:{'Content-Type':'application/json'}})),/invalid response/);
});
