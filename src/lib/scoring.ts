import type { Answer, Attempt, Question } from '../types';
export function answered(a:Answer|undefined):boolean {return Array.isArray(a)?a.length>0:typeof a==='string'&&a.trim()!=='';}
export function grade(q:Question,a:Answer|undefined):'correct'|'incorrect'|'unanswered' {
  if(!answered(a)) return 'unanswered';
  if(!q.verified) return 'incorrect';
  if(q.type==='numerical') {
    const n=typeof a==='string'&&/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(a.trim())?Number(a):NaN;
    return Number.isFinite(n)&&q.acceptedAnswers.some(v=>Math.abs(v-n)<=q.tolerance)?'correct':'incorrect';
  }
  return Array.isArray(a)&&new Set(a).size===a.length&&a.length===q.correctAnswers.length&&a.every(x=>q.correctAnswers.includes(x))?'correct':'incorrect';
}
export function score(attempt:Attempt,bank:Question[]) {
  const rows=attempt.ids.map(id=>{const q=bank.find(q=>q.id===id)!;return {q,status:grade(q,attempt.answers[id])};});
  const correct=rows.filter(r=>r.status==='correct').length, incorrect=rows.filter(r=>r.status==='incorrect').length;
  return {rows,correct,incorrect,unanswered:rows.length-correct-incorrect,total:rows.length,percentage:rows.length?correct/rows.length*100:0,accuracy:correct+incorrect?correct/(correct+incorrect)*100:0};
}
export function mistakes(history:Attempt[],bank:Question[]):string[] {
  const set=new Set<string>();
  [...history].sort((a,b)=>a.finishedAt!-b.finishedAt!).forEach(a=>score(a,bank).rows.forEach(({q,status})=>{if(status==='incorrect')set.add(q.id);if(status==='correct')set.delete(q.id);}));
  return [...set];
}
