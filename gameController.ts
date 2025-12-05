import { createBag, drawTiles } from './bag'
import { computeScoreForAllWords } from './scoring'
import { validatePlacement } from './moveValidation'

export function startGame() {
  const bag = createBag()
  const players = [
    { name: 'Player 1', rack: drawTiles(bag,7), score: 0 },
    { name: 'Player 2', rack: drawTiles(bag,7), score: 0 }
  ]
  const board = Array(225).fill(null)
  return { bag, players, board, currentPlayer:0 }
}

export function playMove(state:any, placed:{index:number,char:string}[]) {
  const val = validatePlacement(placed, state.board)
  if(!val.valid) return { ok:false, message: val.message }
  const result = computeScoreForAllWords(placed, state.board)
  state.players[state.currentPlayer].score += result.total
  placed.forEach(p=> state.board[p.index] = p.char)
  const rack = state.players[state.currentPlayer].rack
  placed.forEach(p=>{
    const idx = rack.indexOf(p.char)
    if(idx>=0) rack.splice(idx,1)
  })
  const need = 7 - rack.length
  const newTiles = drawTiles(state.bag, need)
  rack.push(...newTiles)
  state.currentPlayer = (state.currentPlayer + 1) % state.players.length
  return { ok:true, points: result.total, words: result.breakdown, bingo: result.bingo }
}
