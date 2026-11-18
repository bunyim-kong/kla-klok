export const symbols = [ ['tiger','🐅','Tiger','ខ្លា'], ['gourd','🍐','Gourd','ឃ្លោក'], ['rooster','🐓','Rooster','មាន់'], ['shrimp','🦐','Shrimp','បង្កង'], ['crab','🦀','Crab','ក្តាម'], ['fish','🐟','Fish','ត្រី'] ];
export const total = bets => bets.reduce((a,b)=>a+b,0);
export function payout(bets, dice) {
  return bets.reduce((sum,bet,index)=>{const matches=dice.filter(d=>d===index).length;return sum+(matches ? bet*(matches+1):0)},0);
}
export function rollDice(){
  return Array.from({length:3},()=>{let value;const buffer=new Uint32Array(1); do {crypto.getRandomValues(buffer);value=buffer[0]} while(value>=4294967292);return value%6});
}
