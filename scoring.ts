import { LETTERS } from './tiles'
import { BOARD_BONUSES } from './board'

const scoreMap = new Map<string, number>()
LETTERS.forEach(l => scoreMap.set(l.char, l.score))

export function letterScore(char: string): number {
  if(!char) return 0
  return scoreMap.get(char) ?? 0
}

/**
 * Compute scores for all words formed by a placement
 */
export function computeScoreForAllWords(placed: {index:number,char:string}[], boardLetters: (string|null)[]) {
  if(placed.length===0) return { total:0, breakdown: [] }
  const placedSet = new Set(placed.map(p=>p.index))

  const computeWordScore = (indices:number[]) => {
    let wordMult = 1
    let sum = 0
    indices.forEach(idx=>{
      const isNew = placedSet.has(idx)
      const ch = isNew ? (placed.find(p=>p.index===idx)!.char) : boardLetters[idx]
      let ls = letterScore(ch)
      if(isNew){
        const bonus = BOARD_BONUSES[idx]
        if(bonus==='DL') ls *= 2
        if(bonus==='TL') ls *= 3
        if(bonus==='DW') wordMult *= 2
        if(bonus==='TW') wordMult *= 3
      }
      sum += ls
    })
    return sum * wordMult
  }

  // basic logic similar to moveValidation.extractWords
  const indices = placed.map(p=>p.index).sort((a,b)=>a-b)
  const rows = indices.map(i=>Math.floor(i/15))
  const cols = indices.map(i=>i%15)
  const allSameRow = rows.every(r=>r===rows[0])
  const words: {word:string, indices:number[], score:number}[] = []

  const placedMap = new Map<number,string>()
  placed.forEach(p=>placedMap.set(p.index, p.char))

  const buildWordAt = (r:number, c:number, horizontal:boolean) => {
    const idxAt = (rr:number,cc:number)=> rr*15+cc
    let startR=r, startC=c
    while(true){
      const nr = horizontal ? startR : startR-1
      const nc = horizontal ? startC-1 : startC
      if(nr<0||nc<0||nr>14||nc>14) break
      const idx = idxAt(nr,nc)
      const ch = placedMap.get(idx) ?? boardLetters[idx]
      if(!ch) break
      startR = nr; startC = nc
    }
    let wr=startR, wc=startC
    const chars=[]; const inds=[]
    while(true){
      if(wr<0||wc<0||wr>14||wc>14) break
      const idx = idxAt(wr,wc)
      const ch = placedMap.get(idx) ?? boardLetters[idx]
      if(!ch) break
      chars.push(ch); inds.push(idx)
      if(horizontal) wc++ else wr++
    }
    return { word: chars.join(''), indices: inds }
  }

  if(allSameRow){
    const r = rows[0]; const minc = Math.min(...cols); const maxc = Math.max(...cols)
    let startC=minc; while(startC>0 && (placedMap.has(r*15+(startC-1)) || boardLetters[r*15+(startC-1)])) startC--
    let endC=maxc; while(endC<14 && (placedMap.has(r*15+(endC+1)) || boardLetters[r*15+(endC+1)])) endC++
    const mainIndices=[]; const chars=[]
    for(let c=startC;c<=endC;c++){ const idx=r*15+c; const ch = placedMap.get(idx) ?? boardLetters[idx]; chars.push(ch); mainIndices.push(idx) }
    words.push({ word: chars.join(''), indices: mainIndices, score: computeWordScore(mainIndices) })
    for(const p of placed){
      const rr = Math.floor(p.index/15), cc = p.index%15
      const w = buildWordAt(rr,cc,false)
      if(w.indices.length>1){
        const exists = words.some(x=>x.indices.length===w.indices.length && x.indices[0]===w.indices[0])
        if(!exists) words.push({ word: w.word, indices: w.indices, score: computeWordScore(w.indices) })
      }
    }
  } else {
    const c = cols[0]; const minr = Math.min(...rows); const maxr = Math.max(...rows)
    let startR=minr; while(startR>0 && (placedMap.has((startR-1)*15+c) || boardLetters[(startR-1)*15+c])) startR--
    let endR=maxr; while(endR<14 && (placedMap.has((endR+1)*15+c) || boardLetters[(endR+1)*15+c])) endR++
    const mainIndices=[]; const chars=[]
    for(let r=startR;r<=endR;r++){ const idx=r*15+c; const ch = placedMap.get(idx) ?? boardLetters[idx]; chars.push(ch); mainIndices.push(idx) }
    words.push({ word: chars.join(''), indices: mainIndices, score: computeWordScore(mainIndices) })
    for(const p of placed){
      const rr = Math.floor(p.index/15), cc = p.index%15
      const w = buildWordAt(rr,cc,true)
      if(w.indices.length>1){
        const exists = words.some(x=>x.indices.length===w.indices.length && x.indices[0]===w.indices[0])
        if(!exists) words.push({ word: w.word, indices: w.indices, score: computeWordScore(w.indices) })
      }
    }
  }

  const total = words.reduce((s,w)=>s+w.score,0)
  const bingo = placed.length===7 ? 50 : 0
  return { total: total + bingo, breakdown: words, bingo }
}

