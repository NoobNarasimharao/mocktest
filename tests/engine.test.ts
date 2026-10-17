import {describe,it,expect,vi} from 'vitest';
import data from '../src/data/questions.json';
import type {Question,Settings} from '../src/types';
import {answered,grade,mistakes,score} from '../src/lib/scoring';
import {createAttempt,eligible,finish,move,remaining,shuffle,toggleMark} from '../src/lib/testEngine';
import {validAttempt,read,write} from '../src/lib/storage';
import {pagesBase} from '../src/lib/base';
const bank=data as Question[];
const settings:Settings={mode:'Full mock',weeks:Array.from({length:12},(_,i)=>i+1),count:20,minutes:0,shuffle:false,shuffleOptions:false};
describe('source bank',()=>{
 it('accounts for all questions and excludes the source conflict',()=>{expect(bank).toHaveLength(141);expect(bank.filter(q=>q.verified)).toHaveLength(140);expect(new Set(bank.map(q=>q.id)).size).toBe(141);expect(bank.find(q=>q.id==='week-11-q2')?.verified).toBe(false);});
 it('preserves matching, numerical, six-option and text-only red keys',()=>{expect(bank.find(q=>q.id==='week-5-q6')?.options).toHaveLength(4);expect(bank.filter(q=>q.type==='numerical')).toHaveLength(3);expect(bank.find(q=>q.id==='week-2-q2')?.options).toHaveLength(6);expect(bank.find(q=>q.id==='week-12-q8')?.correctAnswers).toEqual(['b','d','e']);expect(bank.find(q=>q.id==='week-9-q10')?.correctAnswers).toEqual(['a','b','d','f']);});
});
describe('scoring',()=>{
 it('scores single and matching choices',()=>{expect(grade(bank[0],['c'])).toBe('correct');expect(grade(bank[0],['a'])).toBe('incorrect');expect(grade(bank[24],['d'])).toBe('correct');});
 it('requires the exact multi-select set regardless of order',()=>{const q=bank[6];expect(grade(q,['d','c','a'])).toBe('correct');expect(grade(q,['a','c'])).toBe('incorrect');expect(grade(q,['a','b','c','d'])).toBe('incorrect');expect(grade(q,['a','a','c','d'])).toBe('incorrect');});
 it('normalizes finite decimal numerical answers with exact source tolerance',()=>{const q=bank.find(q=>q.type==='numerical')!;for(const s of ['2','2.0',' 2 ','2e0'])expect(grade(q,s)).toBe('correct');for(const s of ['2.001','NaN','Infinity','0x2'])expect(grade(q,s)).toBe('incorrect');expect(grade(q,'')).toBe('unanswered');expect(grade(q,' ')).toBe('unanswered');expect(grade({...q,tolerance:0.01},'2.005')).toBe('correct');});
 it('handles blanks and calculates result denominators',()=>{expect(answered([])).toBe(false);expect(answered('0')).toBe(true);const a=createAttempt(bank,{...settings,weeks:[1]});a.answers={[a.ids[0]]:['c'],[a.ids[1]]:['b']};const s=score(a,bank);expect(s).toMatchObject({correct:1,incorrect:1,unanswered:10,total:12,accuracy:50});expect(s.percentage).toBeCloseTo(100/12);});
 it('updates mistakes after later correct attempts and preserves skipped mistakes',()=>{const a=createAttempt(bank,{...settings,weeks:[1]});a.answers={[a.ids[0]]:['a']};const b={...a,id:'later',answers:{[a.ids[0]]:['c']}};expect(mistakes([finish(a,1000)],bank)).toEqual([a.ids[0]]);expect(mistakes([finish(a,1000),finish(b,2000)],bank)).toEqual([]);});
});
describe('test lifecycle',()=>{
 it('filters weeks and never selects unresolved questions',()=>{expect(eligible(bank,{...settings,weeks:[11]})).toHaveLength(10);expect(createAttempt(bank,settings).ids).toHaveLength(140);});
 it('selects unique random questions and caps count',()=>{const a=createAttempt(bank,{...settings,mode:'Random practice',count:5});expect(a.ids).toHaveLength(5);expect(new Set(a.ids).size).toBe(5);expect(createAttempt(bank,{...settings,mode:'Random practice',weeks:[12],count:100}).ids).toHaveLength(10);expect(()=>createAttempt(bank,{...settings,weeks:[]})).toThrow();});
 it('shuffles copies with stable option IDs',()=>{const input=['a','b','c'];expect(shuffle(input,()=>0)).not.toEqual(input);expect(input).toEqual(['a','b','c']);const a=createAttempt(bank,{...settings,shuffleOptions:true});expect([...a.optionOrder[a.ids[0]]].sort()).toEqual(['a','b','c','d']);});
 it('persists answers through navigation and toggles review independently',()=>{const a=createAttempt(bank,settings);a.answers[a.ids[0]]=['c'];const b=move(toggleMark(a),1);expect(b.answers[a.ids[0]]).toEqual(['c']);expect(b.marked).toEqual([a.ids[0]]);expect(b.visited).toHaveLength(2);expect(toggleMark(move(b,0)).marked).toEqual([]);expect(move(b,-10).index).toBe(0);});
 it('uses timestamps, clamps timer at zero, locks completion idempotently',()=>{const a=createAttempt(bank,{...settings,minutes:1},[],1000);expect(remaining(a,31000)).toBe(30);expect(remaining(a,99000)).toBe(0);const done=finish(a,99000);expect(done.elapsed).toBe(60);expect(finish(done,100000)).toEqual(done);});
 it('validates saved states and rejects corruption',()=>{const a=createAttempt(bank,settings);expect(validAttempt(JSON.parse(JSON.stringify(a)),bank)).toBe(true);for(const bad of [null,{}, {...a,index:999},{...a,ids:['unknown']},{...a,marked:['unknown']},{...a,optionOrder:{}},{...a,elapsed:-1},{...a,answers:{[a.ids[0]]:['unknown']}}])expect(validAttempt(bad,bank)).toBe(false);});
 it('round trips saved progress and survives unavailable storage',()=>{const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)});const a=createAttempt(bank,settings);expect(write('active',a)).toBe(true);expect(read('active')).toEqual(a);vi.stubGlobal('localStorage',{getItem:()=>{throw Error();},setItem:()=>{throw Error();}});expect(read('active')).toBe(null);expect(write('active',a)).toBe(false);vi.unstubAllGlobals();});
 it('supports Pages project and root URLs',()=>{expect(pagesBase('owner/mocktest')).toBe('/mocktest/');expect(pagesBase('owner/owner.github.io')).toBe('./');expect(pagesBase()).toBe('./');});
});
