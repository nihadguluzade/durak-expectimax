export function cloneBoard(board: Array<any>) {
  let newArr = [];
  for (let i = 0; i < board.length; i++) {
    newArr[i] = board[i];
  }
  return newArr;
}