import { isValidWord } from './wordCheck'

function getRowCol(index: number) {
  return { row: Math.floor(index / 15), col: index % 15 }
}

function indexAt(row: number, col: number) {
  return row * 15 + col
}

/**
 * Extract all words formed by a placement (main + perpendicular)
 */
export function extractWords(placed: {index:number,char:string}[], existingLetters: (string|null)[]): { words: {word:string, indices:number[]}[], message?:string } {
  if(placed.length===0) return { words: [] }

  const indices = placed.map(p=>p.index).sort((a,b)=>a-b)
  const rows = indices.map(i=>Math.floor(i/15))
  const cols = indices.map(i=>i%15)
  const allSameRow = rows.every(r=>r===rows[0])
  const allSameCol = cols.every(c=>c===cols[0])
  if(!allSameRow && !allSameCol) return { words: [], message: 'Tiles must be in one row or one column' }

  const placedSet = new Set(placed.map(p=>p.index))
  const placedMap = new Map<number,string>()
  placed.forEach(p=>placedMap.set(p.index, p.char))

  const wordsFound: {word:string, indices:number[]}[] = []

  const buildWordAt = (r:number, c:number, horizontal:boolean) => {
    let startR = r, startC = c
    while(true){
      const nr = horizontal ? startR : startR - 1
      const nc = horizontal ? startC - 1 : startC
      const idx = indexAt(nr, nc)
      if(nr<0 || nc<0 || nr>14 || nc>14) break
      const ch = placedMap.get(idx) ?? existingLetters[idx]
      if(!ch) break
      startR = nr; startC = nc
    }
    let wr = startR, wc = startC
    const chars: string[] = []
    const indices: number[] = []
    while(true){
      if(wr<0 || wc<0 || wr>14 || wc>14) break
      const idx = indexAt(wr, wc)
      const ch = placedMap.get(idx) ?? existingLetters[idx]
      if(!ch) break
      chars.push(ch)
      indices.push(idx)
      if(horizontal) wc++ else wr++
    }
    return { word: chars.join(''), indices }
  }

  // main word + perpendicular words
  if(allSameRow){
    const r = rows[0]
    const minc = Math.min(...cols)
    const maxc = Math.max(...cols)
    let startC = minc
    while(startC>0){
      const idx = indexAt(r, startC-1)
      if(existingLetters[idx] || placedSet.has(idx)) startC-- 
      else break
    }
    let endC = maxc
    while(endC<14){
      const idx = indexAt(r, endC+1)
      if(existingLetters[idx] || placedSet.has(idx)) endC++
      else break
    }
    const mainChars=[]
    const mainIndices=[]
    for(let c=startC;c<=endC;c++){
      const idx = indexAt(r,c)
      const ch = placedMap.get(idx) ?? existingLetters[idx]
      if(!ch) return { words: [], message: 'Gap in main word' }
      mainChars.push(ch); mainIndices.push(idx)
    }
    wordsFound.push({ word: mainChars.join(''), indices: mainIndices })

    for(const p of placed){
      const rc = getRowCol(p.index)
      const w = buildWordAt(rc.row, rc.col, false)
      if(w.indices.length>1){
        const same = wordsFound.some(x=>x.indices.length===w.indices.length && x.indices[0]===w.indices[0])
        if(!same) wordsFound.push(w)
      }
    }
  } else {
    const c = cols[0]
    const minr = Math.min(...rows)
    const maxr = Math.max(...rows)
    let startR = minr
    while(startR>0){
      const idx = indexAt(startR-1,c)
      if(existingLetters[idx] || placedSet.has(idx)) startR--
      else break
    }
    let endR = maxr
    while(endR<14){
      const idx = indexAt(endR+1,c)
      if(existingLetters[idx] || placedSet.has(idx)) endR++
      else break
    }
    const mainChars=[]
    const mainIndices=[]
    for(let r=startR;r<=endR;r++){
      const idx = indexAt(r,c)
      const ch = placedMap.get(idx) ?? existingLetters[idx]
      if(!ch) return { words: [], message: 'Gap in main word' }
      mainChars.push(ch); mainIndices.push(idx)
    }
    wordsFound.push({ word: mainChars.join(''), indices: mainIndices })

    for(const p of placed){
      const rc = getRowCol(p.index)
      const w = buildWordAt(rc.row, rc.col, true)
      if(w.indices.length>1){
        const same = wordsFound.some(x=>x.indices.length===w.indices.length && x.indices[0]===w.indices[0])
        if(!same) wordsFound.push(w)
      }
    }
  }

  return { words: wordsFound }
}

/**
 * Validate placement
 */
export function validatePlacement(placed:{index:number,char:string}[], existingLetters: (string|null)[]): { valid: boolean, words: string[], message?:string } {
  if(placed.length===0) return { valid:false, words:[], message:'No tiles placed' }

  const boardEmpty = existingLetters.every(x=>!x)
  const centerIdx = 7*15+7
  if(boardEmpty && !placed.some(p=>p.index===centerIdx)){
    return { valid:false, words:[], message:'First move must cover center cell' }
  }

  const extracted = extractWords(placed, existingLetters)
  if(extracted.message) return { valid:false, words:[], message: extracted.message }

  if(!boardEmpty){
    let touchesExisting = false
    for(const p of placed){
      const r = Math.floor(p.index/15), c = p.index%15
      const neighbors = [
        (r>0) ? existingLetters[(r-1)*15+c] : null,
        (r<14) ? existingLetters[(r+1)*15+c] : null,
        (c>0) ? existingLetters[r*15+(c-1)] : null,
        (c<14) ? existingLetters[r*15+(c+1)] : null,
      ]
      if(neighbors.some(n=>n)) { touchesExisting = true; break }
    }
    if(!touchesExisting) return { valid:false, words:[], message:'Placed tiles must connect to existing words' }
  }

  for(const w of extracted.words){
    if(!isValidWord(w.word)) return { valid:false, words: extracted.words.map(x=>x.word), message:`Invalid word: ${w.word}` }
  }

  return { valid:true, words: extracted.words.map(x=>x.word) }
}
