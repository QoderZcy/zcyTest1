class MineSweeper {
    constructor() {
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.currentDifficulty = 'easy';
        this.board = [];
        this.gameState = 'waiting'; // waiting, playing, won, lost
        this.minesCount = 0;
        this.flagsCount = 0;
        this.revealedCount = 0;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        
        this.initializeDOM();
        this.initializeGame();
    }
    
    initializeDOM() {
        this.gameBoard = document.getElementById('game-board');
        this.minesCountElement = document.getElementById('mines-count');
        this.timerElement = document.getElementById('timer');
        this.gameStatusElement = document.getElementById('game-status');
        this.resetBtn = document.getElementById('reset-btn');
        
        // 绑定事件
        this.resetBtn.addEventListener('click', () => this.initializeGame());
        
        // 难度选择器事件
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.difficulty-btn.active').classList.remove('active');
                e.target.classList.add('active');
                this.currentDifficulty = e.target.dataset.difficulty;
                this.initializeGame();
            });
        });
    }
    
    initializeGame() {
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.minesCount = config.mines;
        this.flagsCount = 0;
        this.revealedCount = 0;
        this.firstClick = true;
        this.gameState = 'waiting';
        this.timer = 0;
        
        this.clearTimer();
        this.updateDisplay();
        this.createBoard();
        this.renderBoard();
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }
    
    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.minesCount) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // 不在第一次点击的位置和周围放置地雷
            if ((Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1) || 
                this.board[row][col].isMine) {
                continue;
            }
            
            this.board[row][col].isMine = true;
            minesPlaced++;
        }
        
        this.calculateNeighborMines();
    }
    
    calculateNeighborMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].neighborMines = this.countNeighborMines(row, col);
                }
            }
        }
    }
    
    countNeighborMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (this.isValidCell(newRow, newCol) && this.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        
        const grid = document.createElement('div');
        grid.className = 'grid';
        grid.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.createCellElement(row, col);
                grid.appendChild(cell);
            }
        }
        
        this.gameBoard.appendChild(grid);
    }
    
    createCellElement(row, col) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        cell.addEventListener('click', (e) => this.handleCellClick(row, col, e));
        cell.addEventListener('contextmenu', (e) => this.handleRightClick(row, col, e));
        
        this.updateCellDisplay(cell, row, col);
        return cell;
    }
    
    updateCellDisplay(cellElement, row, col) {
        const cell = this.board[row][col];
        
        // 清除所有状态类
        cellElement.className = 'cell';
        cellElement.textContent = '';
        
        if (cell.isFlagged) {
            cellElement.classList.add('flagged');
            cellElement.textContent = '🚩';
        } else if (cell.isRevealed) {
            cellElement.classList.add('revealed');
            
            if (cell.isMine) {
                cellElement.classList.add('mine');
                cellElement.textContent = '💣';
                if (this.gameState === 'lost') {
                    cellElement.classList.add('mine-exploded');
                }
            } else if (cell.neighborMines > 0) {
                cellElement.classList.add(`number-${cell.neighborMines}`);
                cellElement.textContent = cell.neighborMines;
            }
        }
    }
    
    handleCellClick(row, col, event) {
        event.preventDefault();
        
        if (this.gameState === 'won' || this.gameState === 'lost') {
            return;
        }
        
        const cell = this.board[row][col];
        
        if (cell.isFlagged || cell.isRevealed) {
            return;
        }
        
        if (this.firstClick) {
            this.placeMines(row, col);
            this.firstClick = false;
            this.gameState = 'playing';
            this.startTimer();
        }
        
        this.revealCell(row, col);
        this.updateBoard();
        this.checkGameState();
    }
    
    handleRightClick(row, col, event) {
        event.preventDefault();
        
        if (this.gameState === 'won' || this.gameState === 'lost') {
            return;
        }
        
        const cell = this.board[row][col];
        
        if (cell.isRevealed) {
            return;
        }
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flagsCount--;
        } else {
            cell.isFlagged = true;
            this.flagsCount++;
        }
        
        this.updateBoard();
        this.updateDisplay();
    }
    
    revealCell(row, col) {
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) {
            return;
        }
        
        cell.isRevealed = true;
        this.revealedCount++;
        
        if (cell.isMine) {
            this.gameState = 'lost';
            this.revealAllMines();
            return;
        }
        
        // 如果是空白格子，自动揭示周围格子
        if (cell.neighborMines === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (this.isValidCell(newRow, newCol)) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
    }
    
    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col].isMine) {
                    this.board[row][col].isRevealed = true;
                }
            }
        }
    }
    
    updateBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cellElement => {
            const row = parseInt(cellElement.dataset.row);
            const col = parseInt(cellElement.dataset.col);
            this.updateCellDisplay(cellElement, row, col);
        });
    }
    
    checkGameState() {
        const totalCells = this.rows * this.cols;
        const nonMineCells = totalCells - this.minesCount;
        
        if (this.gameState === 'lost') {
            this.clearTimer();
            this.gameStatusElement.textContent = '游戏失败！点击重新开始';
            this.gameStatusElement.className = 'game-status lost';
        } else if (this.revealedCount === nonMineCells) {
            this.gameState = 'won';
            this.clearTimer();
            
            // 自动标记剩余的雷
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.board[row][col].isMine && !this.board[row][col].isFlagged) {
                        this.board[row][col].isFlagged = true;
                        this.flagsCount++;
                    }
                }
            }
            
            this.gameStatusElement.textContent = '恭喜获胜！';
            this.gameStatusElement.className = 'game-status won';
            this.updateBoard();
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        this.minesCountElement.textContent = this.minesCount - this.flagsCount;
        this.timerElement.textContent = this.timer.toString().padStart(3, '0');
        
        if (this.gameState === 'waiting') {
            this.gameStatusElement.textContent = '点击开始游戏';
            this.gameStatusElement.className = 'game-status';
        } else if (this.gameState === 'playing') {
            this.gameStatusElement.textContent = '游戏进行中...';
            this.gameStatusElement.className = 'game-status playing';
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateDisplay();
        }, 1000);
    }
    
    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new MineSweeper();
});