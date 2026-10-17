import type {Answer,Question} from '../types';
import {grade} from '../lib/scoring';
export function SourceImages({paths,label}:{paths:string[];label:string}) {return <>{paths.map((p,i)=><img className="source-image" key={p} src={import.meta.env.BASE_URL+p} alt={`${label}${paths.length>1?` (part ${i+1})`:''}`} loading="lazy"/>)}</>;}
export function QuestionView({q,answer,onAnswer,order,reveal=false}:{q:Question;answer?:Answer;onAnswer?:(a:Answer)=>void;order?:string[];reveal?:boolean}) {
  const selected=Array.isArray(answer)?answer:[];
  const options=(order??q.options.map(o=>o.id)).map(id=>q.options.find(o=>o.id===id)!);
  return <div className="question-view">
    <div className="eyebrow">Week {q.week} <span>·</span> {q.type==='multiple'?'Select all that apply':q.type==='numerical'?'Numerical answer':q.type==='matching'?'Choose the matching combination':'Single answer'}</div>
    <h2 className={q.questionImages.length?'sr-only':'question-text'}>{q.question}</h2>
    <SourceImages paths={q.questionImages} label={q.question}/>
    {q.type==='matching'&&<p className="muted">Select the option that correctly matches every pair.</p>}
    {q.type==='numerical'?<label className="numeric-label">Your numerical answer<input aria-label="Your numerical answer" type="number" step="any" value={typeof answer==='string'?answer:''} disabled={reveal} onChange={e=>onAnswer?.(e.target.value)} placeholder="Enter a number"/></label>:<fieldset className="options"><legend className="sr-only">Answer options</legend>{options.map(o=><label key={o.id} className={`option ${selected.includes(o.id)?'selected':''} ${reveal&&q.correctAnswers.includes(o.id)?'correct-option':''} ${reveal&&selected.includes(o.id)&&!q.correctAnswers.includes(o.id)?'incorrect-option':''}`}>
      <input type={q.type==='multiple'?'checkbox':'radio'} name={q.id} aria-label={`Option ${o.id.toUpperCase()}: ${o.text}`} checked={selected.includes(o.id)} disabled={reveal} onChange={()=>onAnswer?.(q.type==='multiple'?(selected.includes(o.id)?selected.filter(x=>x!==o.id):[...selected,o.id]):[o.id])}/>
      <span className="option-letter">{o.id.toUpperCase()}</span><span className="option-copy">{o.images.length?<><span className="sr-only">{o.text}</span><SourceImages paths={o.images} label={o.text}/></>:o.text}</span>
      {reveal&&q.correctAnswers.includes(o.id)&&<span className="answer-tag">Correct</span>}
    </label>)}</fieldset>}
    {reveal&&<section className="explanation"><div className={`status ${grade(q,answer)}`}>{grade(q,answer)}</div><p><strong>Correct answer:</strong> {q.type==='numerical'?q.acceptedAnswers.join(' or '):q.correctAnswers.map(x=>x.toUpperCase()).join(', ')}</p><p><strong>Your answer:</strong> {Array.isArray(answer)?answer.map(x=>x.toUpperCase()).join(', ')||'Unanswered':answer||'Unanswered'}</p><h3>From the solution sheet</h3>{q.explanation&&<p>{q.explanation}</p>}<details><summary>View original solution layout</summary><SourceImages paths={q.explanationImages} label={`Original solution for week ${q.week}, question ${q.questionNumber}`}/></details><small>Source: RSAI 2026 · Week {q.week} · PDF page {q.sourcePage}</small></section>}
  </div>;
}
