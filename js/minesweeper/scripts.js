var Minesweeper = (function() {
  var difficulties = {
    beginner: { width: 9, height: 9, numOfMines: 7 },
    intermediate: { width: 16, height: 16, numOfMines: 40 },
    expert: { width: 30, height: 16, numOfMines: 99 },
  };
  var mineBgColor = '#EF4836';
  var revealBgColor = '#ABB7B7';
  var hideBgColor = '#666';
  var infoNumDigits = 3;
  var timerInterval = undefined;

  var win = function() {
    return numOfRevealCells == difficulty.width * difficulty.height - difficulty.numOfMines;
  };

  var initApp = function() {
    difficulty = difficulties.beginner;   // Set difficulty
    lvlListener();
    init();
  }

  var init = function() {

    toCheckStack = new Array();
    mines = new Array();
    numOfRevealCells = 0;

    minesLeft = getNumOfMines();
    updateMinesDisplay();
    time = 0;
    updateTimeDisplay();

    Board.init(getWidth(), getHeight());
    cellElems = Board.getCellElems();
    generateMines();

    timer();
    moveListener();
    restartListener();
  };

  var lvlListener = function() {
    var lvlNames = Object.keys(difficulties);
    lvlNames.forEach(function(lvl) {
      console.log(lvl);
      document.getElementById(lvl).addEventListener('click', function() {
        console.log(lvl);
        difficulty = difficulties[lvl];
        restart();
      });
    });
  };

  var restartListener = function() {
    document.getElementById('restart-btn').addEventListener('click', restart);
  };

  var restart = function() {
    hideMsg();
    clearTimer();

    Board.removeCells();
    init();
  };

  var updateMinesDisplay = function() {
    if(minesLeft >= 0) {
      document.getElementById('mines').innerHTML = padZero(infoNumDigits, minesLeft);
    } else {
      document.getElementById('mines').innerHTML = '-' + padZero(infoNumDigits - 1, minesLeft * (-1));
    }
  };

  var flag = function(cellElem) {
    var cellObj = Board.getCellObjFromElem(cellElem);

    if(cellObj.flag) {
      cellObj.flag = false;
      cellElem.innerHTML = '';
      Board.getCellObjFromElem(cellElem).reveal = false;
      minesLeft++;
    } else {
      cellObj.flag = true;
      cellElem.innerHTML = 'F';
      Board.getCellObjFromElem(cellElem).reveal = true;
      minesLeft--;
    }
    updateMinesDisplay();
  };


  var timer = function() {
    // create events
    document.getElementById('board').addEventListener('mousedown', function(e) {
      // remove event
      document.getElementById('board').removeEventListener(e.type, arguments.callee);

      if(started) startTimer();
    });
  };

  var startTimer = function(e) {
    if(timerInterval) return; // fix multiple timers running

    timerInterval = window.setInterval(function(){
      time++;
      updateTimeDisplay();
    }, 1000);
  };

  var updateTimeDisplay = function() {
    document.getElementById('time').innerHTML = padZero(infoNumDigits, time);
  };

  var padZero = function(totalDigits, num) {
    var paddedNumStr = num;
    for(var i = 1; i <= totalDigits; i++) {
      // Num has i digits
      if(num / Math.pow(10, i) < 1) {
        // Pad (totalDigits - i) number of zero
        for (var j = 0; j < totalDigits - i; j++) {
          paddedNumStr = '0' + paddedNumStr;
        }
        return paddedNumStr;
      }
    }
  };


  var moveListener = function() {
    started = true;
    // var cellElems = Board.cellElems;
    for(cellElem of cellElems) {
      cellElem.addEventListener('mousedown', clickAction);
    }
  };

  var clickAction = function(ev) {
    if(ev.which == 3) {
      flag(this);
    } else {
      if(!Board.getCellObjFromElem(this).reveal) {
        if(!revealCells(this)) {
          gameOver();
        }

      }
    }
  };


  var explodeAll = function() {
    for(mine of mines) {
      // var mine = mines[i];
      var mineElem = document.getElementById(Board.cellId(mine[0], mine[1]));
      explode(mineElem);
    }
  };


  var explode = function(mineElem) {
    mineElem.style.backgroundColor = mineBgColor;
  };


  // Return true if no explosion, otherwise false
  var revealCells = function(cellElem) {

    var cellObj = Board.getCellObjFromElem(cellElem);

    if(cellObj.isMine) {
      explodeAll();
      return false;
    }

    revealCell(cellObj);

    // Show num of mines or reveal more cells
    if(cellObj.mines > 0) {
      cellElem.innerHTML = cellObj.mines;
    } else {
      revealNeighbors(cellElem);
    }

    if(win()) winGame();

    return true;
  };

  var gameOver = function() {
    document.getElementById('msg').innerHTML = 'Game Over!';
    stopGame();
  };

  var winGame = function() {
    document.getElementById('msg').innerHTML = 'You Win!';
    stopGame();
  };

  var stopGame = function() {
    started = false;
    for(cellElem of cellElems) {
      cellElem.removeEventListener('mousedown', clickAction);
    }
    showMsg();
    clearTimer();
  };

  var clearTimer = function() {
    clearInterval(timerInterval);
    timerInterval = null;
  };

  var showMsg = function() {
    document.getElementById('slide').style.left = '-100%';
  };

  var hideMsg = function() {
    document.getElementById('slide').style.left = '0';
  };

  var revealCell = function(cellObj) {
    cellObj.reveal = true;
    Board.getCellElemFromObj(cellObj).style.backgroundColor = revealBgColor;
    numOfRevealCells++;
  };


  var hideCell = function(cellObj) {
    cellObj.reveal = false;
    Board.getCellElemFromObj(cellObj).style.backgroundColor = hideBgColor;
  };

  var revealNeighbors = function(cellElem) {
    var cellObj = Board.getCellObjFromElem(cellElem);;

    toCheckStack = toCheckStack.concat(neighborsToCheck(cellObj));

    while(toCheckStack.length > 0) {
      var cell = toCheckStack.pop();

      revealCells(Board.getCellElemFromObj(cell));
    }

  };

  // Find neightbors that are not revealed yet
  var neighborsToCheck = function(cell) {
    var stack = new Array();
    var neighbors = Board.getNeighbors(cell);

    for(i in neighbors) {
      var cell = neighbors[i];
      if(!cell.reveal && !cell.inStack) {
        stack.push(cell);
        cell.inStack = true;
      }
    }

    return stack;
  };


  var show = function() {
    var cells = Board.cellElems;
    for(var i = 0; i < cells.length; i++) {
      var cellObj = Board.getCellObjFromElem(cells[i]);

      if(cellObj.isMine) {
        explode(cells[i]);
      } else {
        cells[i].innerHTML = cellObj.mines;
      }
    }

  };

  var generateMines = function() {
    for (var i = 0; i < getNumOfMines(); i++) {
      var randX, randY;

      do {
        randX = Math.floor(Math.random() * getWidth());
        randY = Math.floor(Math.random() * getHeight());

      } while(cellIsMine(randX, randY));

      putMine(randX, randY);
      mines.push([randX, randY]);
    }
  };

  var putMine = function (x, y) {
    var cell = Board.getCell(x, y);
    cell.isMine = true;
    cell.mines = 1;

    incrementNeighborMinesNum(cell);
  };

  var incrementNeighborMinesNum = function (cell) {
    var neighbors = Board.getNeighbors(cell);

    for (x in neighbors) {
      neighbors[x].mines++;
    }
  };

  var cellIsMine = function(x, y) {
    return Board.getCell(x, y).isMine;
  };

  var getWidth = function() {
    return difficulty.width;
  };

  var getHeight = function() {
    return difficulty.height;
  };

  var getNumOfMines = function() {
    return difficulty.numOfMines;
  };



  /*----------------------------------------------------
  Board
  -----------------------------------------------------*/
  var Board = (function() {
    var init = function(w, h) {
      container = document.getElementById('board');
      width = w;
      height = h;
      cells = new Array(width);
      createCells();
      draw();
      cellElems = document.getElementsByClassName('cell');
    };

    var draw = function() {
      for (var i = 0; i < width; i++) {
        // Create column container
        var col = document.createElement('div');
        col.className = 'col';
        container.appendChild(col);

        // Put cells in current column
        for (var j = 0; j < height; j++) {
          var cell = document.createElement('div');
          cell.className = 'cell';
          cell.id = 'cell-' + i + '-' + j;
          container.childNodes[i].appendChild(cell);
        }
      }
    };

    var removeCells = function() {
      while(container.hasChildNodes()) {
        container.removeChild(container.lastChild);
      }
    };

    var getCell = function(x, y) {
      return cells[x][y];
    }

    var createCells = function() {
      // Create empty arrays
      for (var i = 0; i < width; i++) {
        cells[i] = new Array(height);
      }

      // Fill each slot with a cell
      for (var i = 0; i < cells.length; i++) {
        for (var j = 0; j < cells[i].length; j++) {
          cells[i][j] = new Cell(i, j);
        }
      }
    };

    var getNeighbors = function(cell) {
      var neighbors = new Array(),
          x = cell.x,
          y = cell.y,
          xs = [x-1, x, x+1],
          ys = [y-1, y, y+1];

      for(var i in xs) {
        for(var j in ys) {
          // Put in neighbors array if not off the board
          if(xs[i] > -1 && xs[i] < width && ys[j] > -1 && ys[j] < height) {
            // Put in neighbors array if not current cell
            if(!(xs[i] == x && ys[j] == y)) {
              neighbors.push(getCell(xs[i], ys[j]));
            }
          }
        }
      }

      return neighbors;
    };


    var getCellElement = function (x, y) {
      return document.getElementById(Board.cellId(x, y));
    };

    var getCellElemFromObj = function (cellObj) {
      return document.getElementById(Board.cellId(cellObj.x, cellObj.y));
    };

    var getCellObjFromElem = function(cellElem) {
      var idElems = cellElem.id.split('-');
      var x = idElems[1];
      var y = idElems[2];

      return getCell(x, y);
    };

    var getCellElems = function() {
      return cellElems;
    };

    var cellId = function(x, y) {
      return 'cell-' + x + '-' + y;
    }


    return {
      init: init,
      getNeighbors: getNeighbors,
      getCell: getCell,
      getCellElement: getCellElement,
      getCellObjFromElem: getCellObjFromElem,
      getCellElemFromObj: getCellElemFromObj,
      getCellElems: getCellElems,
      cellId: cellId,
      removeCells: removeCells,
    }

  })();

  /*--------------------------------------------------
  Cell
  ---------------------------------------------------*/
  var Cell = function(x, y) {
    this.x = x;
    this.y = y;
    this.reveal = false;
    this.flag = false;
    this.mines = 0;
    this.inStack = false;
    this.isMine = false;

    return this;
  }


  return {
    initApp: initApp,
  }
})();


Minesweeper.initApp();