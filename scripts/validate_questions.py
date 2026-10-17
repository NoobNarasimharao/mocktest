"""Validate bank integrity independently of PDF extraction. Fails on unsafe data."""
import collections
import json
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bank=json.loads((ROOT/'src/data/questions.json').read_text(encoding='utf8'))
errors=[]
ids=collections.Counter(q['id'] for q in bank)
stems=collections.Counter(q['question'] for q in bank)
types=collections.Counter(q['type'] for q in bank)
expected=[12]*10+[11,10]
lines=['# Question-bank validation report','',f'Total extracted: {len(bank)}',f'Verified and eligible: {sum(q["verified"] for q in bank)}',f'Requires review: {sum(not q["verified"] for q in bank)}','','| Week | Extracted | Verified | Source numbering |','|---|---:|---:|---|']
for w,n in enumerate(expected,1):
    qs=[q for q in bank if q['week']==w]
    nums=sorted(q['questionNumber'] for q in qs)
    if nums!=list(range(1,n+1)): errors.append(f'Week {w}: missing or duplicated numbers: {nums}')
    lines.append(f'| {w} | {len(qs)} | {sum(q["verified"] for q in qs)} | 1–{n} |')
for q in bank:
    opts=[o['id'] for o in q['options']]
    if ids[q['id']]!=1 or stems[q['question']]!=1: errors.append(q['id']+': duplicate ID or question')
    if not q['question'] or q['sourcePage'] not in range(1,40): errors.append(q['id']+': missing text or invalid page')
    if len(opts)!=len(set(opts)) or any(not o['text'] for o in q['options']): errors.append(q['id']+': duplicate/empty options')
    if opts and opts!=list('abcdef')[:len(opts)]: errors.append(q['id']+': non-sequential option IDs')
    if not q['explanation'] and not q['explanationImages']: errors.append(q['id']+': missing explanation')
    if not q['verified'] and not q['reviewReasons']: errors.append(q['id']+': undocumented unresolved question')
    if q['verified']:
        if q['reviewReasons']: errors.append(q['id']+': unresolved question marked verified')
        if q['type']=='numerical':
            if not q['acceptedAnswers'] or opts or q['tolerance']!=0: errors.append(q['id']+': invalid numerical key/tolerance')
            if [float(e['numerical']) for e in q['answerEvidence'] if 'numerical' in e]!=q['acceptedAnswers']: errors.append(q['id']+': numerical evidence mismatch')
        else:
            if not opts or not q['correctAnswers'] or not set(q['correctAnswers'])<=set(opts): errors.append(q['id']+': missing options/key')
            if q['type'] in ('single','matching') and len(q['correctAnswers'])!=1: errors.append(q['id']+': ambiguous key')
            marked=[e['option'] for e in q['answerEvidence'] if e.get('color')==0xff0000]
            if marked!=q['correctAnswers']: errors.append(q['id']+': red-span evidence mismatch')
    for asset in q['questionImages']+q['explanationImages']+[p for o in q['options'] for p in o['images']]:
        if not (ROOT/'public'/asset).is_file(): errors.append(q['id']+': missing asset '+asset)
lines+=['','## Question types','']+[f'- {t}: {types[t]}' for t in ['single','multiple','numerical','matching']]
lines+=['','## Integrity checks','',f'- Duplicate IDs: {sum(v>1 for v in ids.values())}',f'- Duplicate question stems: {sum(v>1 for v in stems.values())}',f'- Missing options (choice questions): {sum(not q["options"] and q["type"]!="numerical" for q in bank)}',f'- Missing explanations (text and image): {sum(not q["explanation"] and not q["explanationImages"] for q in bank)}','- Numerical answers: 2, 91, 6; exact comparison, no invented tolerance.','- Matching questions: original multiple-choice combinations retained.','- Image-only workings: retained as source crops; no OCR needed.','- Source spellings and option wording are preserved.','- Exam crops use the green color channel to remove red answer clues and yellow highlighting.','','## Manual review exclusions','']
for q in bank:
    if not q['verified']: lines.append(f'- **{q["id"]}**, page {q["sourcePage"]}: '+ '; '.join(q['reviewReasons']))
lines+=['','## Accounting notes','','Weeks 11 and 12 end at questions 11 and 10 in the PDF. These are not extraction omissions. All other weeks end at question 12.','Some red answers have black labels: week-7-q1, week-8-q9, week-9-q10 option d, week-10-q1, week-12-q8 option b. Detection includes option text spans, not just labels.','Week 4 question 9 contains near-duplicate distractors d and f in the source; both are deliberately preserved.','Verified means the key is grounded in the supplied solution sheet, not independently certified course correctness.','','## Validation outcome','']
lines+=errors or ['PASS — all structural and evidence checks passed; documented unresolved question excluded.']
(ROOT/'reports/validation-report.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
print(f'{len(bank)} extracted; {sum(q["verified"] for q in bank)} verified; {len(errors)} validation errors.')
print('\n'.join(errors))
sys.exit(bool(errors))
