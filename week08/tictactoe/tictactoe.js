var pattern = [
  [0, 1, 0],
  [0, 2, 0],
  [0, 0, 0]
]

function show() {
  const board = document.getElementById('board')
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const cell = document.createElement('div')
      cell.classList.add('cell')
      cell.innerText = pattern[i][j] === 2
        ? '⚫'
        : pattern[i][j] === 1
          ? '⚪'
          : ''
      board.appendChild(cell)
    }
    const br = document.createElement('br')
    board.appendChild(br)
  }
}

show()