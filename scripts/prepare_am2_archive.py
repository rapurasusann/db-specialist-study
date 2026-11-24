"""Download official AM2 PDFs and produce review-only extraction files.
Usage: python scripts/prepare_am2_archive.py --out <directory>
Dependency: pymupdf. Never modifies the application or publishes generated data.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import urlparse
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/am2-archive-sources-2016-2024.json"
Q = re.compile(r"(?m)^[ \t]*問[ \t]*([0-9０-９]{1,2})(?=[ \t　]|$)")
CHOICE = re.compile(r"(?m)^[ \t]*([アイウエ])[ \t　]+")
LETTERS = "アイウエ"

def get_pdf(url):
    if urlparse(url).hostname != "www.ipa.go.jp":
        raise ValueError("not IPA")
    with urlopen(Request(url, headers={"User-Agent": "DBStudy archive preparation"}), timeout=60) as res:
        if urlparse(res.geturl()).hostname != "www.ipa.go.jp":
            raise ValueError("unexpected redirect")
        data = res.read(30_000_001)
    if len(data) > 30_000_000 or not data.startswith(b"%PDF-"):
        raise ValueError("invalid PDF")
    return data

def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def prepare(row, out):
    year = row["year"]
    dest = out / str(year)
    dest.mkdir(parents=True, exist_ok=True)
    evidence = {}
    texts = {}
    for kind in ("question", "answer"):
        data = get_pdf(row[kind + "Url"])
        (dest / (kind + ".pdf")).write_bytes(data)
        evidence[kind] = {"sha256": hashlib.sha256(data).hexdigest(), "url": row[kind + "Url"]}
        with pymupdf.open(stream=data, filetype="pdf") as doc:
            pages = [p.get_text(sort=True) for p in doc]
            evidence[kind]["pages"] = len(pages)
            texts[kind] = "\n".join(pages)
            for i, page in enumerate(doc):
                # Review images only, not final application assets.
                page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False).save(dest / f"{kind}-{i+1:02}.png")
        (dest / (kind + ".txt")).write_text(texts[kind], encoding="utf-8")
    raw = texts["question"]
    hits = list(Q.finditer(raw))
    questions = {}
    for idx, hit in enumerate(hits):
        num = int(hit.group(1))
        if not 1 <= num <= 25:
            continue
        body = raw[hit.end():hits[idx+1].start() if idx+1 < len(hits) else len(raw)].strip()
        marks = list(CHOICE.finditer(body))
        candidate = {"raw": body, "needsReview": True}
        if "".join(m.group(1) for m in marks) == LETTERS:
            candidate["stem"] = body[:marks[0].start()].strip()
            candidate["options"] = {m.group(1):body[m.end():marks[j+1].start() if j+1<len(marks) else len(body)].strip() for j,m in enumerate(marks)}
        questions.setdefault(str(num), []).append(candidate)
    report = {"year":year, "source":row["source"], "evidence":evidence, "answers":row["answers"], "questions":questions,
              "missingNumbers":[n for n in range(1,26) if str(n) not in questions],
              "duplicateNumbers":[n for n,v in questions.items() if len(v)!=1],
              "status":"review-only", "requiredReview":"Check each stem, option, diagram/table, page break, answer and source against PDF. Do not publish this extraction."}
    write_json(dest / "review.json", report)
    return {"year":year,"detected":len(questions),"missing":report["missingNumbers"],"duplicates":report["duplicateNumbers"]}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--out",required=True,type=Path)
    p.add_argument("--year",type=int,choices=range(2016,2025))
    a=p.parse_args()
    out=a.out.resolve()
    if out==ROOT or ROOT in out.parents:
        raise SystemExit("Choose output outside repository to avoid accidentally committing unreviewed files")
    out.mkdir(parents=True,exist_ok=True)
    data=json.loads(MANIFEST.read_text(encoding="utf-8"))
    rows=[r for r in data["years"] if a.year is None or r["year"]==a.year]
    if len(rows)!=(1 if a.year else 9):
        raise SystemExit("unexpected manifest count")
    results=[]
    for row in rows:
        try:
            results.append(prepare(row,out))
        except Exception as e:
            results.append({"year":row["year"],"error":str(e)})
    write_json(out/"summary.json",results)
    print(json.dumps(results,ensure_ascii=False,indent=2))
    if any("error" in r or r["missing"] or r["duplicates"] for r in results):
        raise SystemExit(2)
if __name__=="__main__":
    main()
