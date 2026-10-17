import type {Attempt,Question,Settings} from '../types';
export function shuffle<T>(items:T[],random= Math.random):T[] {const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function eligible(bank:Question[],settings:Settings,errors:string[]=[]) {return bank.filter(q=>q.verified&&settings.weeks.includes(q.week)&&(settings.mode!=='Mistake practice'||errors.includes(q.id)));}
export function createAttempt(bank:Question[],settings:Settings,errors:string[]=[],now=Date.now()):Attempt {
  let qs=eligible(bank,settings,errors);
  if(settings.mode==='Random practice')qs=shuffle(qs).slice(0,Math.min(Math.max(1,settings.count),qs.length));
  if(settings.shuffle)qs=shuffle(qs);
  if(!qs.length)throw new Error('No verified questions match this selection.');
  return {version:1,id:crypto.randomUUID(),settings:{...settings},ids:qs.map(q=>q.id),answers:{},marked:[],visited:[qs[0].id],revealed:[],optionOrder:Object.fromEntries(qs.map(q=>[q.id,(settings.shuffleOptions?shuffle(q.options):q.options).map(o=>o.id)])),index:0,startedAt:now,endAt:settings.minutes>0?now+settings.minutes*60000:null,elapsed:0,resumedAt:now,finishedAt:null};
}
export function remaining(a:Attempt,now=Date.now()){return a.endAt===null?null:Math.max(0,Math.ceil((a.endAt-now)/1000));}
export function duration(a:Attempt,now=Date.now()){return a.elapsed+(a.resumedAt===null?0:Math.max(0,(Math.min(now,a.endAt??now)-a.resumedAt)/1000));}
export function finish(a:Attempt,now=Date.now()):Attempt {return a.finishedAt?a:{...a,finishedAt:now,elapsed:duration(a,now),resumedAt:null};}
export function move(a:Attempt,index:number):Attempt {const i=Math.max(0,Math.min(a.ids.length-1,index));return {...a,index:i,visited:[...new Set([...a.visited,a.ids[i]])]};}
export function toggleMark(a:Attempt):Attempt {const id=a.ids[a.index];return {...a,marked:a.marked.includes(id)?a.marked.filter(x=>x!==id):[...a.marked,id]};}
