"""Extract native text, red option keys and lossless layout crops; never infer keys.

Usage: python scripts/extract_questions.py path/to/source.pdf
"""
import hashlib
import json
import re
import sys
from pathlib import Path
import pymupdf as fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/question-assets'

def clean(text):
    return re.sub(r'\s+', ' ', text.replace('\u200b', '')).strip()

def extract(path):
    doc = fitz.open(path)
    anchors = []
    week = 0
    for pi, page in enumerate(doc):
        for b in page.get_text('dict')['blocks']:
            for line in b.get('lines', []):
                text = clean(''.join(s['text'] for s in line['spans']))
                wm = re.match(r'Week[- ](\d+)', text)
                if wm:
                    week = int(wm[1])
                qm = re.match(r'^(\d+)\.\s*(.*)', text)
                if qm and line['bbox'][0] < 110:
                    anchors.append(dict(week=week, number=int(qm[1]), page=pi, y=line['bbox'][1]))
    OUT.mkdir(parents=True, exist_ok=True)
    bank = []
    evidence = []
    for ix, a in enumerate(anchors):
        end = anchors[ix+1] if ix+1 < len(anchors) else dict(page=len(doc)-1, y=doc[-1].rect.height)
        regions = []
        markers = []
        for pi in range(a['page'], end['page']+1):
            top = a['y']-1 if pi == a['page'] else 0
            bottom = end['y']-2 if pi == end['page'] else doc[pi].rect.height
            if bottom <= top:
                continue
            regions.append((pi, top, bottom))
            for b in doc[pi].get_text('dict')['blocks']:
                for line in b.get('lines', []):
                    if not top <= line['bbox'][1] < bottom:
                        continue
                    t = clean(''.join(s['text'] for s in line['spans']))
                    if re.match(r'^Week[- ]\d+', t):
                        # Exclude next week's heading from preceding explanation.
                        regions[-1] = (pi, top, line['bbox'][1]-2)
                    kind = re.match(r'^([a-f])\.\s*(.*)', t)
                    if kind and line['bbox'][0] < 145:
                        markers.append((pi, line['bbox'][1]-1, 'option', kind[1], line))
                    elif t.startswith('Explanation:'):
                        markers.append((pi, line['bbox'][1]-1, 'explanation', '', line))
                    elif t.startswith('Answer (numerical):'):
                        markers.append((pi, line['bbox'][1]-1, 'answer', '', line))
        markers.sort(key=lambda x:(x[0], x[1]))
        ident = f"week-{a['week']}-q{a['number']}"

        def section(start, stop, name, force_image=False):
            texts, images = [], []
            for pi, top, bottom in regions:
                if not start[0] <= pi <= stop[0]:
                    continue
                y0 = max(top, start[1]) if pi == start[0] else top
                y1 = min(bottom, stop[1]) if pi == stop[0] else bottom
                if y1-y0 < 2:
                    continue
                rect = fitz.Rect(70, y0, doc[pi].rect.width-48, y1)
                text = doc[pi].get_text(clip=rect, sort=True)
                texts.append(text)
                has_math = any(ord(c)>0x390 and not (0x2000<=ord(c)<=0x206f) for c in text)
                has_image = any(fitz.Rect(im['bbox']).intersects(rect) for im in doc[pi].get_image_info())
                if force_image or has_math or has_image:
                    pix = doc[pi].get_pixmap(matrix=fitz.Matrix(2,2), clip=rect, alpha=False)
                    im = Image.frombytes('RGB', [pix.width,pix.height], pix.samples)
                    # All ink is uniformly black: source red answers cannot leak in exam crops.
                    # Green channel maps red/black ink to black and yellow highlights to white.
                    im = im.getchannel('G').point(lambda v: 0 if v < 180 else 255)
                    from PIL import ImageChops
                    bbox = ImageChops.invert(im).getbbox()
                    if bbox: im = im.crop(bbox)
                    filename = f'{ident}-{name}-{pi+1}.png'
                    im.save(OUT/filename, optimize=True)
                    images.append('question-assets/'+filename)
            return clean(' '.join(texts)), images

        beginning = (a['page'], a['y']-1)
        ending = (end['page'], end['y']-2)
        first = markers[0][:2] if markers else ending
        stem, stem_images = section(beginning, first, 'question', a['week'] in (3,5) and a['number'] in (1,6))
        stem = re.sub(r'^\d+\.\s*', '', stem)
        options, keys, proofs = [], [], []
        explanation, explanation_images, numerical = '', [], []
        for mi, marker in enumerate(markers):
            pi,y,kind,oid,line = marker
            stop = markers[mi+1][:2] if mi+1<len(markers) else ending
            content, images = section((pi,y), stop, oid or kind, kind=='explanation')
            if kind=='option':
                content = re.sub(r'^[a-z]\.\s*', '', content)
                options.append(dict(id=oid,text=content,images=images))
                red_spans = [s for s in line['spans'] if s['color'] == 0xff0000 and clean(s['text'])]
                if red_spans:
                    keys.append(oid)
                    proofs.append(dict(option=oid,page=pi+1,color=0xff0000,text=' '.join(s['text'] for s in red_spans),bbox=list(line['bbox'])))
            elif kind=='explanation':
                explanation = re.sub(r'^Explanation:\s*','',content)
                explanation_images = images
            else:
                match = re.match(r'Answer \(numerical\):\s*([-+]?\d+(?:\.\d+)?)\s*$', content)
                if match:
                    numerical = [float(match[1])]
                    proofs.append(dict(numerical=match[1],page=pi+1,text=content,bbox=list(line['bbox'])))
        typ = 'numerical' if numerical else 'matching' if stem.lower().startswith('match ') else 'multiple' if 'select all' in stem.lower() else 'single'
        issues = []
        if ident == 'week-11-q2':
            issues.append('Source contradiction: option d (Accountability) is red, but the explanation explicitly names option c (Robustness, security, and safety). Excluded pending source correction.')
        if typ=='numerical' and options: issues.append('Numerical question unexpectedly has options')
        if typ!='numerical' and (not keys or not options): issues.append('Missing explicit red answer key or options')
        if typ in ('single','matching') and len(keys)!=1: issues.append('Ambiguous number of marked answers')
        if not explanation and not explanation_images: issues.append('Missing explanation')
        q = dict(id=ident,week=a['week'],questionNumber=a['number'],type=typ,question=stem,options=options,correctAnswers=keys,acceptedAnswers=numerical,tolerance=0,explanation=explanation,sourcePage=a['page']+1,verified=not issues,reviewReasons=issues,questionImages=stem_images,explanationImages=explanation_images,answerEvidence=proofs)
        bank.append(q)
        evidence.append(dict(id=ident,markers=[dict(page=m[0]+1,y=m[1],kind=m[2],option=m[3]) for m in markers]))
    (ROOT/'src/data/questions.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2),encoding='utf8')
    metadata = dict(sourceFilename=Path(path).name,sourceSha256=hashlib.sha256(Path(path).read_bytes()).hexdigest(),pages=len(doc),questions=len(bank),extraction='PyMuPDF native spans; red option labels RGB ff0000; explicit numerical answer lines',questionBoundaries=evidence)
    (ROOT/'reports/extraction-evidence.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
    print(f'Extracted {len(bank)} questions from {len(doc)} pages.')
    for w in range(1,13):
        qs=[q for q in bank if q['week']==w]
        print(w, len(qs), 'verified',sum(q['verified'] for q in qs))
    for q in bank:
        if not q['verified']: print(q['id'],q['reviewReasons'])

if __name__=='__main__':
    extract(sys.argv[1])
