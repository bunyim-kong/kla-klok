import React,{useEffect,useRef} from 'react';
import SymbolIcon from './SymbolIcon';
import {symbols} from './game';
const money=n=>new Intl.NumberFormat('en').format(n)+' ៛';
export default function ResultPopup({result,dice,onClose,children}){
 const dialog=useRef();
 useEffect(()=>{dialog.current.showModal();return()=>dialog.current?.close()},[]);
 const title=result.net>0?'You won!':result.net<0?'Not this time':'An even round';
 return <dialog ref={dialog} className="result-dialog" onCancel={event=>{event.preventDefault();onClose()}}>
  <span className="eyebrow">ROUND COMPLETE</span><h2>{title}</h2>
  <div className="result-dice">{dice.map((d,i)=><SymbolIcon key={i} id={symbols[d][0]} label={symbols[d][2]}/>)}</div>
  <strong className={'result-amount '+(result.net<0?'loss':'')}>{result.net>0?'+':''}{money(result.net)}</strong>
  <p>{result.net<0?'A fresh round brings another chance.':result.net===0?'Your total return equals your bet.':'Your winnings are in your balance.'}</p>
  <div className="result-summary"><span>Bet: {money(result.stake)}</span><span>Returned: {money(result.returned)}</span></div>
  {children}<button className="play" autoFocus onClick={onClose}>Back to the table</button>
 </dialog>
}
