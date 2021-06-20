export function cloneArray(board: Array<any>) {
  let newArr = [];
  for (let i = 0; i < board.length; i++) {
    newArr[i] = board[i];
  }
  return newArr;
}

export function shuffle(array: Array<any>): Array<any> {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}