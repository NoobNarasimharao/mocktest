import type {Attempt,Question} from '../types';
export const PREFIX='rsai-2026:';
export function read(key:string):unknown {try {return JSON.parse(localStorage.getItem(PREFIX+key)??'null');}catch{return null;}}
export function write(key:string,value:unknown):boolean {try{localStorage.setItem(PREFIX+key,JSON.stringify(value));return true;}catch{return false;}}
export function validAttempt(value:unknown,bank:Question[]):value is Attempt {
  if(!value||typeof value!=='object')return false;
  const a=value as Attempt;
  if(a.version!==1||typeof a.id!=='string'||!Array.isArray(a.ids)||!a.ids.length||new Set(a.ids).size!==a.ids.length||!a.ids.every(id=>bank.some(q=>q.id===id&&q.verified)))return false;
  if(!Number.isInteger(a.index)||a.index<0||a.index>=a.ids.length||!a.settings||!['Full mock','Weekly practice','Random practice','Mistake practice','Revision'].includes(a.settings.mode)||!Array.isArray(a.settings.weeks)||!a.settings.weeks.every(w=>Number.isInteger(w)&&w>=1&&w<=12)||!Number.isFinite(a.settings.count)||!Number.isFinite(a.settings.minutes)||a.settings.minutes<0)return false;
  if(!Number.isFinite(a.startedAt)||!Number.isFinite(a.elapsed)||a.elapsed<0||!(a.endAt===null||Number.isFinite(a.endAt)&&a.endAt>=a.startedAt)||!(a.finishedAt===null||Number.isFinite(a.finishedAt))||!(a.resumedAt===null||Number.isFinite(a.resumedAt)))return false;
  if(![a.marked,a.visited,a.revealed].every(xs=>Array.isArray(xs)&&xs.every(id=>a.ids.includes(id)))||!a.answers||typeof a.answers!=='object'||!a.optionOrder)return false;
  return a.ids.every(id=>{const q=bank.find(q=>q.id===id)!;const ans=a.answers[id],order=a.optionOrder[id];return Array.isArray(order)&&order.length===q.options.length&&new Set(order).size===order.length&&order.every(o=>q.options.some(x=>x.id===o))&&(ans===undefined||(q.type==='numerical'?typeof ans==='string':Array.isArray(ans)&&new Set(ans).size===ans.length&&ans.every(o=>q.options.some(x=>x.id===o))&&(q.type==='multiple'||ans.length<=1)));});
}
export function loadHistory(bank:Question[]):Attempt[]{const h=read('history');return Array.isArray(h)?h.filter(a=>validAttempt(a,bank)&&a.finishedAt!==null):[];}
export function clearData(){for(const key of ['active','history','preferences'])localStorage.removeItem(PREFIX+key);}
