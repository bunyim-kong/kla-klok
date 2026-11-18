import {test} from 'node:test';
import assert from 'node:assert/strict';
import {payout,total} from './game.js';
test('matching stakes are returned plus one prize per matching die',()=>{
 assert.equal(payout([100,0,0,0,0,0],[0,1,2]),200);
 assert.equal(payout([100,0,0,0,0,0],[0,0,2]),300);
 assert.equal(payout([100,0,0,0,0,0],[0,0,0]),400);
 assert.equal(payout([100,0,0,0,0,0],[1,2,3]),0);
});
test('multiple selections settle independently',()=>{assert.equal(payout([100,200,300,0,0,0],[0,1,1]),800);assert.equal(total([100,200,300]),600)});
