export type Question = {id:string;week:number;questionNumber:number;type:'single'|'multiple'|'numerical'|'matching';question:string;options:{id:string;text:string;images:string[]}[];correctAnswers:string[];acceptedAnswers:number[];tolerance:number;explanation:string;sourcePage:number;verified:boolean;reviewReasons:string[];questionImages:string[];explanationImages:string[]};
export type Answer = string[] | string;
export type Mode = 'Full mock'|'Weekly practice'|'Random practice'|'Mistake practice'|'Revision';
export type Settings = {mode:Mode;weeks:number[];count:number;minutes:number;shuffle:boolean;shuffleOptions:boolean};
export type Attempt = {version:1;id:string;settings:Settings;ids:string[];answers:Record<string,Answer>;marked:string[];visited:string[];revealed:string[];optionOrder:Record<string,string[]>;index:number;startedAt:number;endAt:number|null;elapsed:number;resumedAt:number|null;finishedAt:number|null};
export type Preferences = {theme:'dark'|'light';shuffle:boolean;shuffleOptions:boolean;minutes:number};
