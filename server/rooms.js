import { randomBytes, randomInt } from 'node:crypto';
import { payout, total } from '../src/game.js';

const emptyBets = () => Array(6).fill(0);
const fail = message => { throw new Error(message); };
export class Rooms {
 constructor({now = Date.now, roll = () => Array.from({length:3}, () => randomInt(6))} = {}) {
  this.rooms = new Map(); this.now = now; this.roll = roll;
 }
 create(name) {
  if (this.rooms.size >= 1000) fail('The server is busy. Please try again later.');
  let code;
  do { code = randomBytes(3).toString('hex').toUpperCase(); } while (this.rooms.has(code));
  const room = {code, players:[], phase:'betting', round:1, dice:null, updated:this.now()};
  this.rooms.set(code,room);
  try { return this.join(code,name); } catch (error) { this.rooms.delete(code); throw error; }
 }
 join(code,name) {
  const room = this.get(code);
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 20) fail('Enter a name between 1 and 20 characters.');
  if (room.phase !== 'betting') fail('A round is in progress. Join after it finishes.');
  if (room.players.length >= 4) fail('This room is full (4 players maximum).');
  if (room.players.some(p=>p.name.toLowerCase()===name.trim().toLowerCase())) fail('That name is already in this room. Choose another name.');
  const player = {id:randomBytes(8).toString('hex'), token:randomBytes(24).toString('hex'), name:name.trim(), balance:50000, bets:emptyBets(), ready:false, next:false, seen:this.now(), online:true, result:null};
  room.players.push(player);room.updated=this.now();
  return {token:player.token, code:room.code};
 }
 get(code) {
  if(typeof code !== 'string') fail('Enter a valid room code.');
  const room=this.rooms.get(code.trim().toUpperCase());
  if(!room) fail('Room not found. Check the code or create a new room.');
  return room;
 }
 authenticate(code,token) {
  const room=this.get(code),player=room.players.find(p=>p.token===token);
  if(!player) fail('Your seat is no longer available. Please join again.');
  player.seen=this.now();player.online=true;room.updated=this.now();
  return {room,player};
 }
 update(room) {
  const now=this.now();
  for(const p of room.players) if(now-p.seen>25000){p.online=false;p.ready=false;}
  // Keep room management available when the original host loses connection.
  if(room.players.length && !room.players[0].online){
   const index=room.players.findIndex(p=>p.online);
   if(index>0){const [host]=room.players.splice(index,1);room.players.unshift(host);}
  }
  if(room.phase==='rolling' && now>=room.revealAt){
   room.dice=this.roll();room.phase='results';
   for(const p of room.players){const stake=total(p.bets),returned=payout(p.bets,room.dice);p.balance+=returned;p.result={stake,returned,net:returned-stake};p.next=false;}
  }
  if(room.phase==='results' && room.players.length && room.players.every(p=>p.next)){
   room.phase='betting';room.round++;room.dice=null;
   for(const p of room.players){p.bets=emptyBets();p.ready=false;p.result=null;}
  }
 }
 view(code,token) {
  const {room,player}=this.authenticate(code,token);this.update(room);
  return {code:room.code,you:player.id,host:room.players[0]?.id,phase:room.phase,round:room.round,dice:room.dice,
   players:room.players.map(p=>({id:p.id,name:p.name,balance:p.balance,ready:p.ready,next:p.next,online:p.online,result:p.result,...(p.id===player.id?{bets:p.bets}:{})}))};
 }
 action(code,token,action,data={}) {
  const {room,player}=this.authenticate(code,token);this.update(room);
  if(action==='leave'){
   if(room.phase==='rolling') fail('Please wait for the dice to be revealed before leaving.');
   room.players=room.players.filter(p=>p!==player);
   if(!room.players.length)this.rooms.delete(room.code);
   else {if(room.phase==='betting')room.players.forEach(p=>p.ready=false);this.update(room);}
   return {left:true};
  }
  if(action==='remove'){
   if(room.players[0]!==player || room.phase==='rolling')fail('Only the host can remove an offline player between rolls.');
   const other=room.players.find(p=>p.id===data.id);
   if(!other || other.online || other===player)fail('Only offline players can be removed.');
   room.players=room.players.filter(p=>p!==other);
   if(room.phase==='betting')room.players.forEach(p=>p.ready=false);
  }else if(action==='next'){
   if(room.phase!=='results')fail('Wait for the result.');player.next=true;
  }else{
   if(room.phase!=='betting')fail('Betting is closed for this round.');
   if(action==='unready')player.ready=false;
   else if(action==='ready'){
    if(total(player.bets)===0)fail('Place a bet before getting ready.');player.ready=true;
   }else{
    if(player.ready)fail('Choose Edit bets before changing your bet.');
    if(action==='bet'){
     if(!Number.isInteger(data.index)||data.index<0||data.index>5||![100,500,1000,5000].includes(data.amount))fail('Invalid bet.');
     if(total(player.bets)+data.amount>player.balance)fail('Not enough riel. Choose a smaller chip.');
     player.bets[data.index]+=data.amount;
    }else if(action==='clear')player.bets=emptyBets();
    else if(action==='refill'){
     if(player.balance>=100)fail('Refills are available when your balance is below 100 riel.');
     player.balance=50000;
    }else fail('Unknown action.');
   }
   if(room.players.length>=2 && room.players.every(p=>p.online&&p.ready)){
    room.phase='rolling';room.revealAt=this.now()+1800;
    for(const p of room.players)p.balance-=total(p.bets);
   }
  }
  return this.view(code,token);
 }
 cleanup(){for(const [code,room] of this.rooms){this.update(room);if(this.now()-room.updated>600000)this.rooms.delete(code);}}
}
