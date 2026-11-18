import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Rooms} from './rooms.js';
function setup(count=2){let time=1000;const rooms=new Rooms({now:()=>time,roll:()=>[0,0,1]});const a=rooms.create('Dara'),players=[a];for(let i=1;i<count;i++)players.push(rooms.join(a.code,'Friend '+i));return {rooms,players,advance:ms=>time+=ms,act:(i,action,data)=>rooms.action(a.code,players[i].token,action,data),view:i=>rooms.view(a.code,players[i].token)};}
for(const count of [2,3,4])test(`${count} players wait for everyone and settle once`,()=>{
 const s=setup(count);
 for(let i=0;i<count;i++){s.act(i,'bet',{index:i===0?0:5,amount:1000});s.act(i,'ready');if(i<count-1)assert.equal(s.view(0).phase,'betting');}
 assert.equal(s.view(0).phase,'rolling');assert.equal(s.view(0).dice,null);
 assert.throws(()=>s.act(0,'bet',{index:0,amount:100}),/closed/);
 s.advance(1800);const result=s.view(0);assert.deepEqual(result.dice,[0,0,1]);assert.equal(result.players[0].balance,52000);assert.equal(result.players[1].balance,49000);
 assert.equal(s.view(0).players[0].balance,52000);
 for(let i=0;i<count;i++){s.act(i,'next');if(i<count-1)assert.equal(s.view(0).phase,'results');}
 assert.equal(s.view(0).phase,'betting');assert.equal(s.view(0).round,2);assert.deepEqual(s.view(0).players[0].bets,[0,0,0,0,0,0]);
});
test('validates authentication, room size, bets, balance and readiness',()=>{
 const s=setup(4),code=s.players[0].code;
 assert.throws(()=>s.rooms.view(code,'bad'),/seat/);assert.throws(()=>s.rooms.join(code,'Fifth'),/full/);
 assert.throws(()=>s.act(0,'bet',{index:-1,amount:100}),/Invalid/);assert.throws(()=>s.act(0,'bet',{index:0,amount:-100}),/Invalid/);
 assert.throws(()=>s.act(0,'ready'),/Place a bet/);
 for(let i=0;i<10;i++)s.act(0,'bet',{index:0,amount:5000});
 assert.throws(()=>s.act(0,'bet',{index:0,amount:100}),/Not enough/);
 s.act(0,'ready');assert.throws(()=>s.act(0,'clear'),/Edit bets/);s.act(0,'unready');s.act(0,'clear');
 const two=setup();assert.throws(()=>two.rooms.join(two.players[0].code,' dara '),/already/);
 assert.equal('token' in s.view(0).players[0],false);assert.equal('bets' in s.view(0).players[1],false);
});
test('offline seats can be removed and stale rooms expire',()=>{
 const s=setup(3);s.act(1,'bet',{index:1,amount:100});s.act(1,'ready');s.advance(26000);
 assert.equal(s.view(0).players[1].online,false);assert.equal(s.view(0).players[1].ready,false);
 s.act(0,'remove',{id:s.view(0).players[1].id});assert.equal(s.view(0).players.length,2);assert.throws(()=>s.view(1),/seat/);
 s.act(0,'leave');assert.equal(s.view(2).host,s.view(2).you);
 s.advance(600001);s.rooms.cleanup();assert.throws(()=>s.view(2),/not found/);
});
