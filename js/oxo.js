import * as HLP from './helpers/helpers.js';

const VERSION = 'V3.0';
const GAME_DATA = new WeakMap();
const ID = Object.freeze({
  ROOT: HLP.uuidv4(),
  OXO: HLP.uuidv4(),
  NOUGHT: HLP.uuidv4(),
  CROSS: HLP.uuidv4(),
  BOARD_NULL: HLP.uuidv4(),
  PICKER: HLP.uuidv4(),
  BOARD: HLP.uuidv4(),
  SCORE: HLP.uuidv4(),
  COMMAND: HLP.uuidv4(),
  WIDGET: HLP.uuidv4(),
  VERSION: HLP.uuidv4(),
  GIT: HLP.uuidv4()
});
const PLAYERS = [ID.NOUGHT, ID.CROSS];
const SUFFIX = Object.freeze({
  SYMBOL: 'sym',
  CURRENT_PLAYER_HL: 'hlcp',
  CURRENT_PLAYER_MARKER: 'cp',
  WIN: 'win',
  LOSE: 'lose',
  DRAW: 'draw',
  ICON: 'icn',
  HUMAN: 'hum',
  CPU: 'cpu',
  TEXT: 'txt'
});
const CPU_BEHAVIOUR = Object.freeze({
  RANDOM: 'Will behave randomly with no strategy',
  MINIMAX: 'Will maximise chances of not losing',
  SCHIZOPHRENIA: 'Will change behaviour each round'
});
const CONFIG = Object.freeze({
  PICKER_SYMBOL_PADDING: 0.3,
  SCORE_COMMAND_SVG_AREA_PROPORTION: 0.3,
  WIDGET_PROPORTION: 0.1,
  SCORE_PROPORTION: 0.7,
  BOARD_PADDING: 0.1,
  BOARD_SYMBOL_PADDING: 0.1,
  SCORE_PADDING: 0.1,
  SCORE_MARKER_PADDING: 0.5,
  SCORE_SYMBOL_PADDING: 0.4,
  SCORE_ICON_PADDING: 0.2,
  COMMAND_ICON_PADDING: 0.7,
  WIDGET_PADDING: 0.1,
  ABSIG_ICON_PADDING: 0.1,
  MAX_DEPTH: 8
});
const CSS = Object.freeze({
  ROOT: 'root',
  OXO: 'oxo',
  GRID: 'grid',
  GRIDITEM: 'griditem',
  SVG: 'svg',
  PICKER: 'picker',
  BEHAVIOUR: 'behave',
  BOARD: 'board',
  SCORE: 'score',
  COMMANDS: 'commands',
  WIDGETS: 'widgets',
  LINES: 'lines',
  RECTS: 'rects',
  SYMBOLS: 'symbols',
  FREE: 'free',
  USED: 'used',
  WINNER: 'winner',
  MARKERS: 'markercp',
  ICONS: 'icons',
  TEXT: 'text',
  VERSION: 'version',
  GIT: 'git',
  HIDDEN: 'hidden'
});
const CSS_VARS = Object.freeze({
  OXOLINEWIDTH: '--oxoLineWidth'
});
const DATASET = Object.freeze({
  BOARD_POSITION: HLP.uuidv4_string(),
  ACTION: HLP.uuidv4_string(),
  VALUE: HLP.uuidv4_string()
});
const ACTIONS = Object.freeze({
  PUT_SYMBOL: HLP.uuidv4(),
  EXIT_GAME: HLP.uuidv4(),
  RESET_GAME: HLP.uuidv4(),
  PICK_SYMBOL: HLP.uuidv4(),
  PICK_BEHAVIOUR: HLP.uuidv4(),
  GOTO_GIT: HLP.uuidv4(),
  GOTO_CHANGE_LOG: HLP.uuidv4()
});
const URL = Object.freeze({
  DEFAULT_EXIT: 'https://www.google.com',
  CHANGE_LOG: 'https://github.com/triglyph/oxo/blob/master/changelog.md',
  TRIGLYPH: 'https://triglyph.github.io'
})

export class OXO{
  constructor(hostDOMElement, boardSize=3, callbackOnExit=undefined) {
    let board = resetBoard(boardSize, ID.BOARD_NULL); //Game board
    let scores = resetScores(PLAYERS); //Player scores
    let playerInfo = createPlayerInfo(); //Game state information about players
    GAME_DATA.set(this, {data: {board, scores, playerInfo, callbackOnExit}});
    
    //Draw game components
    draw(hostDOMElement, computeBoardSize(board));

    //Apply event listeners
    applyEventListener(this, board.length);
  }

  get cpuBehaviour() {
    return CPU_BEHAVIOUR;
  }

  handleEvent(evt) {
    this['on' + evt.type + 'Handler'](evt);
  }

  onclickHandler(evt) {
    evt.preventDefault();
    const TARGET = evt.currentTarget;
    const DATA = GAME_DATA.get(this).data;
    const ACTION = TARGET.dataset[DATASET.ACTION];

    if (ACTION == ACTIONS.PICK_SYMBOL) {
      //Strip eventlistener from symbol picker slots
      document.getElementById(ID.CROSS + ACTIONS.PICK_SYMBOL).removeEventListener('click', this);
      document.getElementById(ID.NOUGHT + ACTIONS.PICK_SYMBOL).removeEventListener('click', this);

      //Get player info
      DATA.playerInfo.human = TARGET.dataset[DATASET.VALUE]; //Picked symbol is human player
      DATA.playerInfo.cpu = PLAYERS.filter(val => val != DATA.playerInfo.human)[0]; //Unpicked symbol is CPU player
      DATA.playerInfo.currentPlayer = Math.random() < 0.5 ? DATA.playerInfo.human : DATA.playerInfo.cpu; //Randomly pick who goes first

      //Show/Hide elements
      document.getElementById(ACTIONS.PICK_SYMBOL + SUFFIX.TEXT).classList.add(CSS.HIDDEN); //Hide the symbol picker text
      document.getElementById(ACTIONS.PICK_BEHAVIOUR + SUFFIX.TEXT).classList.remove(CSS.HIDDEN) //Show the CPU behaviour picker text
      document.getElementById(ACTIONS.PICK_SYMBOL + SUFFIX.SYMBOL).classList.add(CSS.HIDDEN); //Hide the symbols on the picker
      document.getElementById(ACTIONS.PICK_BEHAVIOUR + SUFFIX.CPU).classList.remove(CSS.HIDDEN); //Show the CPU behaviour options on the picker
      document.getElementById(DATA.playerInfo.human + SUFFIX.HUMAN).classList.remove(CSS.HIDDEN); //Show the human icon in the score area track for the chosen symbol
      document.getElementById(DATA.playerInfo.cpu + SUFFIX.CPU).classList.remove(CSS.HIDDEN); //Show the cpu icon in the score area track for the unchosen symbol
      showCurrentPlayer(DATA.playerInfo.currentPlayer, PLAYERS.filter(val => val != DATA.playerInfo.currentPlayer)[0]); //Highlight & mark current player in score area

      //Update game state
      GAME_DATA.set(this, {data: DATA});
    } else if (ACTION == ACTIONS.PICK_BEHAVIOUR) {
      //Strip eventlistener from behaviour picker slots
      Object.entries(CPU_BEHAVIOUR).forEach(([key, val]) => {
        document.getElementById(ACTIONS.PICK_BEHAVIOUR + key).removeEventListener('click', this)
      });

      //Get behaviour info
      DATA.playerInfo.cpuBehaviour = TARGET.dataset[DATASET.VALUE];

      //Show/Hide elements
      document.getElementById(ID.PICKER).classList.add(CSS.HIDDEN); //Hide the whole picker area
      document.getElementById(ID.BOARD).classList.remove(CSS.HIDDEN); //Show the board
      document.getElementById(ID.SCORE).classList.remove(CSS.HIDDEN); //Show the scores
      document.getElementById(ID.COMMAND).classList.remove(CSS.HIDDEN); //Show the commands
      document.getElementById(ID.WIDGET).classList.remove(CSS.HIDDEN); //Show the widgets

      //Update game state
      GAME_DATA.set(this, {data: DATA});

      //If current player is CPU, take CPU action
      checkCPUTurn(DATA.playerInfo, DATA.board);
    } else if (ACTION == ACTIONS.EXIT_GAME) {
      //Wipe game data
      GAME_DATA.set(this, undefined);
      if (DATA.callbackOnExit) {
        //Execute callback if it exists
        DATA.callbackOnExit();
      } else {
        //Redirect to a page
        location.href = URL.DEFAULT_EXIT;
      }
    } else if (ACTION == ACTIONS.RESET_GAME) {
      if (!checkBoardState(DATA.board, PLAYERS, ID.BOARD_NULL)) {
        //Withdrawing from active game equates to a loss
        DATA.scores = updateScores(DATA.playerInfo.cpu, PLAYERS, ID.BOARD_NULL, DATA.scores);
        writeScore(PLAYERS, DATA.scores);
      }
      DATA.board = resetBoard(computeBoardSize(DATA.board), ID.BOARD_NULL, true); //Wipe board state
      clearBoard(DATA.board.length); //Hide all the symbols, reset the CSS on the positions
      applyEventListenerBoardPositions(this, DATA.board.length); //Reapply the event listeners
      DATA.playerInfo.currentPlayer = Math.random() < 0.5 ? DATA.playerInfo.human : DATA.playerInfo.cpu; //Randomly pick who goes first
      showCurrentPlayer(DATA.playerInfo.currentPlayer, PLAYERS.filter(val => val != DATA.playerInfo.currentPlayer)[0]); //Highlight & mark current player in score area
      //Update game state
      GAME_DATA.set(this, {data: DATA});
      //If current player is CPU, take CPU action
      checkCPUTurn(DATA.playerInfo, DATA.board);
    } else if (ACTION == ACTIONS.PUT_SYMBOL) {
      //Strip the eventlistener
      TARGET.removeEventListener('click', this);

      //Alter position behaviour
      TARGET.classList.replace(CSS.FREE, CSS.USED);

      //Show/Hide elements
      document.getElementById(DATA.playerInfo.currentPlayer + SUFFIX.SYMBOL + TARGET.dataset[DATASET.BOARD_POSITION]).classList.remove(CSS.HIDDEN);

      //Update the board state
      DATA.board[TARGET.dataset[DATASET.BOARD_POSITION]] = DATA.playerInfo.currentPlayer;

      //Check the board state for a winner
      let winner = checkBoardState(DATA.board, PLAYERS, ID.BOARD_NULL);
      if (winner) {
        highlightWinningPositions(DATA.board, PLAYERS);
        DATA.scores = updateScores(winner, PLAYERS, ID.BOARD_NULL, DATA.scores);
        writeScore(PLAYERS, DATA.scores);
        //Update game state
        GAME_DATA.set(this, {data: DATA});
      } else {
        //Swap to next player
        DATA.playerInfo.currentPlayer = swapPlayer(DATA.playerInfo.currentPlayer, DATA.playerInfo.human, DATA.playerInfo.cpu);
        //Update game state
        GAME_DATA.set(this, {data: DATA});
        //If current player is CPU, take CPU action
        checkCPUTurn(DATA.playerInfo, DATA.board);
      }
    } else if (ACTION == ACTIONS.GOTO_CHANGE_LOG) {
      window.open(URL.CHANGE_LOG);
    } else if (ACTION == ACTIONS.GOTO_GIT) {
      window.open(URL.TRIGLYPH);
    }
  }
}

function resetBoard(boardSize, emptyValue) {
  if (boardSize < 3) {
    boardSize = 3;
  } else if (boardSize > 5) {
    boardSize = 5;
  }
  let board = new Array(Math.pow(boardSize, 2)); //A x A sized board, default minimum 3 x 3, default maximum 5 x 5
  board.fill(emptyValue);
  return board;
}

function resetScores(players) {
  return players.reduce((accumulator, currentValue) => {
    accumulator[currentValue] = {win: 0, draw: 0, lose: 0};
    return accumulator;
  }, {});
}

function updateScores(winner, players, emptyValue, currentScores) {
  players.forEach(player => {
    if (winner == player) {
      currentScores[player].win++;
    } else if (winner == emptyValue) {
      currentScores[player].draw++;
    } else {
      currentScores[player].lose++;
    }
  });
  return currentScores;
}

function createPlayerInfo() {
  let currentPlayer = undefined;
  let cpu = undefined;
  let human = undefined;
  let cpuBehaviour = undefined;
  return {currentPlayer, cpu, human, cpuBehaviour};
}

function checkBoardState(board, players, drawState) {
  let boardState = undefined;
  let boardSize = computeBoardSize(board);
  let availablePositions = board.filter(boardPosition => !players.includes(boardPosition)).length;

  //Check if at least one player has the minimum number of symbols for victory, on the board
  if (availablePositions > (2 * boardSize) - 1) {
    return boardState; //Exits the function
  }

  //Test diagonals
  [0, boardSize - 1].some(i => {
    let modifier = i == 0 ? 1 : -1;
    let diagonal = [...Array(boardSize).keys()].map(index => board[i + (index * (boardSize + modifier))]);
    boardState = checkState(diagonal, boardSize, players);
    return boardState; //Exits the some if truthy
  });
  
  //Test rows
  if (!boardState) {
    [...Array(boardSize).keys()].some(i => {
      let row = [...Array(boardSize).keys()].map(index => board[(i * boardSize) + index]);
      boardState = checkState(row, boardSize, players);
      return boardState; //Exits the some if truthy
    });
  }
  
  //Test columns
  if (!boardState) {
    [...Array(boardSize).keys()].some(i => {
      let column = [...Array(boardSize).keys()].map(index => board[i + (index * boardSize)]);
      boardState = checkState(column, boardSize, players);
      return boardState; //Exits the some if truthy
    });
  }

  if (availablePositions == 0 && !boardState) {
    return drawState; //Exits the function
  }
  
  return boardState; //Exits the function
}

function computeBoardSize(board) {
  return Math.round(Math.sqrt(board.length));  
}

function checkState(block, winCondition, players) {
  //If all parts of the block have the same value and that value is a player, return the player value
  return block.filter(position => position == block[0] && players.includes(position)).length == winCondition ? block[0] : undefined;
}

function checkCPUTurn(playerInfo, board) {
  if (playerInfo.currentPlayer == playerInfo.cpu) {
    let pickedPosition = cpuAction(board, ID.BOARD_NULL, playerInfo);
    //Call the click event on the CPU picked position
    document.getElementById(ACTIONS.PUT_SYMBOL + pickedPosition).dispatchEvent(new Event('click'));
  }  
}

function cpuAction(board, emptyValue, playerInfo, overideBehaviour = undefined) {
  let behaviour = overideBehaviour ? overideBehaviour : playerInfo.cpuBehaviour;
  if (behaviour == CPU_BEHAVIOUR.RANDOM) {
    //Pick a random empty board position
    let availableIndices = board.map((position, index) => position == emptyValue ? index : -1).filter(idx => idx != -1);
    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
  } else if (behaviour == CPU_BEHAVIOUR.MINIMAX) {
    if (board.filter(position => position == emptyValue).length == board.length) {
      //put it in the top left corner...
      return 0;
    } else {
      return minimax(board, playerInfo.cpu, playerInfo.human, playerInfo.cpu, emptyValue, 0);
    }
  } else if (behaviour == CPU_BEHAVIOUR.SCHIZOPHRENIA) {
    let behaviourChoices = Object.values(CPU_BEHAVIOUR).filter(value => value != behaviour);
    return cpuAction(board, emptyValue, playerInfo, behaviourChoices[Math.floor(Math.random() * behaviourChoices.length)]);
  }
}

function minimax(board, activePlayer, nextPlayer, maximizingPlayer, drawState, depth) {
  //Check if last move was winning
  let winner = checkBoardState(board, [activePlayer, nextPlayer], drawState);
  if (winner) {
    if (winner == maximizingPlayer) {
      return 1;
    } else if (winner == nextPlayer || winner == activePlayer) {
      return -1
    } else {
      return 0;
    }
  }

  if (depth > CONFIG.MAX_DEPTH) {
    return 0;
  }

  let availablePositions = board.reduce((accumulator, currentValue, positionIndex) => {
    if (currentValue == drawState) {
      accumulator.push(positionIndex);
    }
    return accumulator;
  }, []);

  let bestPosition = -1;
  let bestOutcome = activePlayer == maximizingPlayer ? -Infinity : Infinity;
  availablePositions.forEach(position => {
    let newBoard = [...board];
    newBoard[position] = activePlayer;
    let outcome = minimax(newBoard, nextPlayer, activePlayer, maximizingPlayer, drawState, depth + 1);
    if (depth == 0 && outcome > bestOutcome) {
      bestPosition = position
    }
    bestOutcome = activePlayer == maximizingPlayer ? Math.max(outcome, bestOutcome) : Math.min(outcome, bestOutcome);
  });
  if (depth > 0) {
    return bestOutcome;
  } else {
    return bestPosition;
  }
}

function draw(hostDOMElement, boardSize) {
  const VERTICAL = isVerticalOrientation(hostDOMElement.offsetWidth, hostDOMElement.offsetHeight);
  const ASPECT = getNearestAspect(hostDOMElement.offsetWidth, hostDOMElement.offsetHeight, VERTICAL);
  const LINE_WIDTH = getLineWidth(ASPECT);

  hostDOMElement.appendChild(createSVGElement(hostDOMElement.offsetWidth, hostDOMElement.offsetHeight, VERTICAL, ASPECT, LINE_WIDTH, boardSize));
}

function isVerticalOrientation(width, height) {
  return height > width;
}

function getNearestAspect(width, height, isVertical) {
  let ratio = isVertical ? height / width : width / height;
  let aspects = [
    {ratio: (4/3), w: 1024, h: 768},
    {ratio: (16/9), w: 960, h: 540},
    {ratio: (16/10), w: 1440, h: 900},
    {ratio: (5/4), w: 1280, h: 1024},
    {ratio: (21/9), w: 1280, h: 540},
    {ratio: (18.5/9), w: 1480, h: 720},
    {ratio: (19.5/9), w: 2436, h: 1125},
    {ratio: 2, w: 1440, h: 720},
    {ratio: (17/9), w: 1024, h: 540},
    {ratio: 1, w: 1024, h: 1024}
  ];
  let delta = aspects.map(aspect => Math.abs(ratio - aspect.ratio));
  let minDelta = delta.reduce((accumulator, currentValue) => {
    return currentValue < accumulator ? currentValue : accumulator;
  }, Infinity);
  let aspect = aspects[delta.indexOf(minDelta)];
  return {
    width: isVertical ? aspect.h : aspect.w,
    height: isVertical ? aspect.w : aspect.h
  }
}

function getLineWidth(aspect) {
  const HTML_STYLES = window.getComputedStyle(document.querySelector('html'));
  let lineRatio = parseFloat(HTML_STYLES.getPropertyValue(CSS_VARS.OXOLINEWIDTH)) / 100;
  return Math.sqrt((Math.pow(aspect.width, 2) + Math.pow(aspect.height, 2)) / 2) * lineRatio;
}

function createSVGElement(width, height, isVertical, aspect, lineWidth, boardSize) {
  const SVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  SVG.classList.add(CSS.SVG);
  SVG.setAttribute('width', width);
  SVG.setAttribute('height', height);
  let viewbox = '0 0 ' + aspect.width + ' ' + aspect.height;
  SVG.setAttribute('viewBox', viewbox);

  const AREAS = computeSVGAreas(aspect.width, aspect.height, isVertical);

  //Add the top level svg groups
  SVG.appendChild(createPicker(AREAS.picker));

  SVG.appendChild(createBoard(AREAS.board, boardSize, lineWidth));

  SVG.appendChild(createScore(AREAS.score));

  SVG.appendChild(createCommands(AREAS.command));

  SVG.appendChild(createWidgets(AREAS.widget));
  
  return SVG;
}

function computeSVGAreas(svgWidth, svgHeight, isVertical) {
  let refX1 = Math.floor(svgWidth * CONFIG.SCORE_COMMAND_SVG_AREA_PROPORTION);
  let refX2 = Math.ceil(svgWidth * CONFIG.SCORE_PROPORTION);
  let refX3 = Math.ceil(svgWidth * (1 - CONFIG.WIDGET_PROPORTION));
  let refY1 = Math.ceil(svgHeight * (1 - CONFIG.SCORE_COMMAND_SVG_AREA_PROPORTION));
  let refY2 = Math.ceil(svgHeight * CONFIG.SCORE_PROPORTION);
  let refY3 = Math.floor(svgHeight * (1 - CONFIG.WIDGET_PROPORTION));

  return {
    board: {
      topLeft: {
        x: isVertical ? 0 : refX1,
        y: 0
      },
      bottomRight: {
        x: isVertical ? refX3 : svgWidth,
        y: isVertical ? refY1 : refY3
      }
    },
    score: {
      topLeft: {
        x: 0,
        y: isVertical ? refY1 : 0
      },
      bottomRight: {
        x: isVertical ? refX2 : refX1,
        y: isVertical ? svgHeight : refY2
      }
    },
    command: {
      topLeft: {
        x: isVertical ? refX2 : 0,
        y: isVertical ? refY1 : refY2
      },
      bottomRight: {
        x: isVertical ? svgWidth : refX1,
        y: svgHeight
      }
    },
    widget: {
      topLeft: {
        x: isVertical ? refX3 : refX1,
        y: isVertical ? 0 : refY3
      },
      bottomRight: {
        x: svgWidth,
        y: isVertical ? refY1 : svgHeight
      }
    },
    picker: {
      topLeft: {
        x: 0,
        y: 0
      },
      bottomRight: {
        x: svgWidth,
        y: svgHeight
      }
    }
  };
}

function createPicker(area) {
  let picker  = createSVGGroup(ID.PICKER, CSS.PICKER)
  let pickerAreas = computePickerArea(area);
  //Text
  let txtA = createSVGText(pickerAreas.text.center.x, pickerAreas.text.center.y, 'Pick your symbol!');
  txtA.setAttribute('id', ACTIONS.PICK_SYMBOL + SUFFIX.TEXT);
  txtA.classList.add(CSS.TEXT);
  picker.appendChild(txtA)
  let txtB = createSVGText(pickerAreas.text.center.x, pickerAreas.text.center.y, 'Pick CPU behaviour!');
  txtB.setAttribute('id', ACTIONS.PICK_BEHAVIOUR + SUFFIX.TEXT);
  txtB.classList.add(CSS.TEXT, CSS.HIDDEN);
  picker.appendChild(txtB)
  //Symbols
  let sym = createSVGGroup(ACTIONS.PICK_SYMBOL + SUFFIX.SYMBOL, CSS.SYMBOLS);
  let cross = createCrossSymbol(pickerAreas.cross.topLeft.x, pickerAreas.cross.topLeft.y, pickerAreas.cross.bottomRight.x, pickerAreas.cross.bottomRight.y);
  cross.classList.remove(CSS.HIDDEN);
  sym.appendChild(cross);
  let nought = createNoughtSymbol(pickerAreas.nought.center.x, pickerAreas.nought.center.y, pickerAreas.nought.radius);
  nought.classList.remove(CSS.HIDDEN);
  sym.appendChild(nought);
  picker.appendChild(sym);
  //Overlay Rects
  let crossSlot = createSVGRect(pickerAreas.cross.topLeft.x, pickerAreas.cross.topLeft.y, pickerAreas.sideLength, pickerAreas.sideLength);
  crossSlot.setAttribute('id', ID.CROSS + ACTIONS.PICK_SYMBOL);
  crossSlot.dataset[DATASET.ACTION] = ACTIONS.PICK_SYMBOL;
  crossSlot.dataset[DATASET.VALUE] = ID.CROSS;
  crossSlot.classList.add(CSS.RECTS);
  picker.appendChild(crossSlot);
  let noughtSlot = createSVGRect(pickerAreas.nought.topLeft.x, pickerAreas.nought.topLeft.y, pickerAreas.sideLength, pickerAreas.sideLength);  
  noughtSlot.setAttribute('id', ID.NOUGHT + ACTIONS.PICK_SYMBOL);
  noughtSlot.dataset[DATASET.ACTION] = ACTIONS.PICK_SYMBOL;
  noughtSlot.dataset[DATASET.VALUE] = ID.NOUGHT;
  noughtSlot.classList.add(CSS.RECTS);
  picker.appendChild(noughtSlot);
  //AI Pick options
  let height = crossSlot.height.baseVal.value / Object.entries(CPU_BEHAVIOUR).length;
  let y = pickerAreas.cross.topLeft.y - (height / 2);
  let options = createSVGGroup(ACTIONS.PICK_BEHAVIOUR + SUFFIX.CPU, CSS.BEHAVIOUR, CSS.HIDDEN);
  Object.entries(CPU_BEHAVIOUR).forEach(([key, val]) => {
    y += height;
    let txt = createSVGText(pickerAreas.text.center.x, y, key + ': ' + val);
    txt.classList.add(CSS.TEXT);
    options.appendChild(txt);
    let rect = createSVGRect(area.topLeft.x, y - (height / 2), area.bottomRight.x - area.topLeft.x, height);
    rect.setAttribute('id', ACTIONS.PICK_BEHAVIOUR + key);
    rect.dataset[DATASET.ACTION] = ACTIONS.PICK_BEHAVIOUR;
    rect.dataset[DATASET.VALUE] = val;
    rect.classList.add(CSS.RECTS);
    options.appendChild(rect);
  });
  picker.appendChild(options);
  return picker;
}

function computePickerArea(containerArea) {
  let width = containerArea.bottomRight.x - containerArea.topLeft.x;
  let height = containerArea.bottomRight.y - containerArea.topLeft.y;
  let refLength = ((width > height ? height : width) / 2) * (1 - CONFIG.PICKER_SYMBOL_PADDING);
  let paddingX = ((width / 2) - refLength) / 2;
  let paddingY = ((height / 2) - refLength) / 2;
  return {
    text: {
      center: {
        x: containerArea.topLeft.x + (width / 2),
        y: containerArea.topLeft.y + (height / 4)
      }
    },
    cross: {
      topLeft: {
        x: containerArea.topLeft.x + paddingX,
        y: (height / 2) + paddingY
      },
      bottomRight: {
        x: containerArea.topLeft.x + (width / 2) - paddingX,
        y: containerArea.bottomRight.y - paddingY
      }
    },
    nought: {
      center: {
        x: containerArea.topLeft.x + (width / 2) + paddingX + (refLength / 2),
        y: (height / 2) + paddingY + (refLength / 2)
      },
      radius: refLength / 2,
      topLeft: {
        x: containerArea.topLeft.x + paddingX + (width / 2),
        y: (height / 2) + paddingY
      },
      bottomRight: {
        x: containerArea.bottomRight.x,
        y: containerArea.bottomRight.y
      }
    },
    sideLength: refLength
  }
}

function createBoard(area, boardSize, lineWidth) {
  let boardGroup = createSVGGroup(ID.BOARD, CSS.BOARD, CSS.HIDDEN);
  let boardArea = computeBoardArea(area);

  let lineCount = boardSize - 1;
  let refLength = ((boardArea.bottomRight.x - boardArea.topLeft.x) - (lineCount * lineWidth)) / (boardSize);

  //symbols
  boardGroup.appendChild(createBoardSymbols(boardArea, refLength, boardSize, lineWidth));
  //positions
  boardGroup.appendChild(createBoardPositions(boardArea, refLength, boardSize, lineWidth));
  //grid
  boardGroup.appendChild(createBoardGrid(boardArea, refLength, lineCount, lineWidth));
  return boardGroup;
}

function computeBoardArea(containerArea) {
  let width = containerArea.bottomRight.x - containerArea.topLeft.x;
  let height = containerArea.bottomRight.y - containerArea.topLeft.y;
  let isVertical = isVerticalOrientation(width, height);
  let refLength = (isVertical ? width : height) * (1 - CONFIG.BOARD_PADDING);
  let paddingX = (width - refLength) / 2;
  let paddingY = (height - refLength) / 2;
  return {
    topLeft: {
      x: Math.floor(containerArea.topLeft.x + paddingX),
      y: Math.floor(containerArea.topLeft.y + paddingY)
    },
    bottomRight: {
      x: Math.ceil(containerArea.bottomRight.x - paddingX),
      y: Math.ceil(containerArea.bottomRight.y - paddingY)
    }
  };
}

function createBoardSymbols(area, refLength, boardSize, lineWidth) {
  let padding = refLength * CONFIG.BOARD_SYMBOL_PADDING / 2;
  let reduceLength = refLength * (1 - CONFIG.BOARD_SYMBOL_PADDING)
  let symbols = createSVGGroup(undefined, CSS.SYMBOLS);
  [...Array(boardSize).keys()].forEach(column => {
    let leftX = area.topLeft.x + (column * (refLength + lineWidth)) + padding;
    let rightX = HLP.round(leftX + reduceLength, 2);
    let centerX = HLP.round(leftX + (reduceLength / 2), 2);
    leftX = HLP.round(leftX, 2);
    [...Array(boardSize).keys()].forEach(row => {
      let topY = area.topLeft.y + (row * (refLength + lineWidth)) + padding;
      let bottomY = HLP.round(topY + reduceLength, 2);
      let centerY = HLP.round(topY + (reduceLength / 2), 2);
      topY = HLP.round(topY, 2);
      let nought = createNoughtSymbol(centerX, centerY, HLP.round(reduceLength / 2, 2), (row * boardSize) + column);
      symbols.appendChild(nought);
      let cross = createCrossSymbol(leftX, topY, rightX, bottomY, (row * boardSize) + column);
      symbols.appendChild(cross);
    });
  });
  return symbols
}

function createBoardPositions(area, refLength, boardSize, lineWidth) {
  let positions = createSVGGroup(undefined, CSS.RECTS);
  [...Array(boardSize).keys()].forEach(column => {
    let x = HLP.round(area.topLeft.x + (column * (refLength + lineWidth)), 2);
    [...Array(boardSize).keys()].forEach(row => {
      let y = HLP.round(area.topLeft.y + (row * (refLength + lineWidth)), 2);
      let position = createSVGRect(x, y, HLP.round(refLength, 2), HLP.round(refLength, 2));
      position.setAttribute('id', ACTIONS.PUT_SYMBOL + ((row * boardSize) + column));
      position.dataset[DATASET.BOARD_POSITION] = (row * boardSize) + column;
      position.dataset[DATASET.ACTION] = ACTIONS.PUT_SYMBOL;
      position.classList.add(CSS.FREE);
      positions.appendChild(position);
    });
  });
  return positions
}

function createBoardGrid(area, refLength, lineCount, lineWidth) {
  let grid = createSVGGroup(undefined, CSS.LINES);
  [...Array(lineCount).keys()].forEach(line => {
    let x = HLP.round(area.topLeft.x + ((line + 1) * refLength) + (lineWidth * (line + 0.5)), 2);
    let y = HLP.round(area.topLeft.y + ((line + 1) * refLength) + (lineWidth * (line + 0.5)), 2);
    grid.appendChild(createSVGLine(x, area.topLeft.y, x, area.bottomRight.y)); //Vertical
    grid.appendChild(createSVGLine(area.topLeft.x, y, area.bottomRight.x, y)); //Horizontal
  });
  return grid;
}

function createScore(area) {
  let score = createSVGGroup(ID.SCORE, CSS.SCORE, CSS.HIDDEN);
  let scoreArea = computeScoreArea(area);

  //Current player highlights
  score.appendChild(createCurrentPlayerHighlight(scoreArea));
  //Current player marker
  score.appendChild(createCurrentPlayerMarkers(scoreArea.markers));
  //Lines
  score.appendChild(createScoreGrid(scoreArea));
  //Labels
  score.appendChild(createScoreLabels(scoreArea.labels));
  //Scores
  score.appendChild(createScoreValues(scoreArea.scores));
  //Symbols
  score.appendChild(createScoreSymbols(scoreArea.symbols));
  //Icons
  score.appendChild(createScoreIcons(scoreArea.icons));

  return score;
}

function computeScoreArea(containerArea) {
  let width = (containerArea.bottomRight.x - containerArea.topLeft.x) * (1 - CONFIG.SCORE_PADDING);
  let height = (containerArea.bottomRight.y - containerArea.topLeft.y) * (1 - CONFIG.SCORE_PADDING);
  let isVertical = isVerticalOrientation(width, height);
  let shortRefLength = (isVertical ? width : height) / 2.5;
  let longRefLength = (isVertical ? height : width) / 5.5;
  let refLength = longRefLength > shortRefLength ? shortRefLength : longRefLength;
  let paddingX = ((containerArea.bottomRight.x - containerArea.topLeft.x) - ((isVertical ? 2.5 : 5.5) * refLength)) / 2;
  let paddingY = ((containerArea.bottomRight.y - containerArea.topLeft.y) - ((isVertical ? 5.5 : 2.5) * refLength)) / 2;
  let refPoints = {
    x: [
      HLP.round(containerArea.topLeft.x + paddingX, 2),
      HLP.round(containerArea.topLeft.x + paddingX + (0.5 * refLength), 2),
      HLP.round(containerArea.topLeft.x + paddingX + (1.5 * refLength), 2),
      HLP.round(containerArea.topLeft.x + paddingX + (2.5 * refLength), 2),
      isVertical ? undefined : HLP.round(containerArea.topLeft.x + paddingX + (3.5 * refLength), 2),
      isVertical ? undefined : HLP.round(containerArea.topLeft.x + paddingX + (4.5 * refLength), 2),
      isVertical ? undefined : HLP.round(containerArea.topLeft.x + paddingX + (5.5 * refLength), 2),
    ],
    y: [
      HLP.round(containerArea.topLeft.y + paddingY, 2),
      HLP.round(containerArea.topLeft.y + paddingY + (0.5 * refLength), 2),
      HLP.round(containerArea.topLeft.y + paddingY + (1.5 * refLength), 2),
      HLP.round(containerArea.topLeft.y + paddingY + (2.5 * refLength), 2),
      isVertical ? HLP.round(containerArea.topLeft.y + paddingY + (3.5 * refLength), 2) : undefined,
      isVertical ? HLP.round(containerArea.topLeft.y + paddingY + (4.5 * refLength), 2) : undefined,
      isVertical ? HLP.round(containerArea.topLeft.y + paddingY + (5.5 * refLength), 2) : undefined,
    ]
  };

  return {
    refLength: refLength,
    isVertical: isVertical,
    labels: {
      win: {
        topLeft: {
          x: refPoints.x[isVertical ? 0 : 3],
          y: refPoints.y[isVertical ? 3 : 0]
        },
        bottomRight: {
          x: refPoints.x[isVertical ? 1 : 4],
          y: refPoints.y[isVertical ? 4 : 1]
        },
        text: 'W'
      },
      lose: {
        topLeft: {
          x: refPoints.x[isVertical ? 0 : 4],
          y: refPoints.y[isVertical ? 4 : 0]
        },
        bottomRight: {
          x: refPoints.x[isVertical ? 1 : 5],
          y: refPoints.y[isVertical ? 5 : 1]
        },
        text: 'L'
      },
      draw: {
        topLeft: {
          x: refPoints.x[isVertical ? 0 : 5],
          y: refPoints.y[isVertical ? 5 : 0]
        },
        bottomRight: {
          x: refPoints.x[isVertical ? 1 : 6],
          y: refPoints.y[isVertical ? 6 : 1]
        },
        text: 'D'
      }
    },
    symbols: {
      a: {
        topLeft: {
          x: refPoints.x[isVertical ? 1 : 2],
          y: refPoints.y[isVertical ? 2 : 1]
        },
        bottomRight: {
          x: refPoints.x[isVertical ? 2 : 3],
          y: refPoints.y[isVertical ? 3 : 2]
        }
      },
      b: {
        topLeft: {
          x: refPoints.x[2],
          y: refPoints.y[2]
        },
        bottomRight: {
          x: refPoints.x[3],
          y: refPoints.y[3]
        }
      }
    },
    icons: {
      a: {
        topLeft: {
          x: refPoints.x[1],
          y: refPoints.y[1]
        },
        bottomRight: {
          x: refPoints.x[2],
          y: refPoints.y[2]
        }
      },
      b: {
        topLeft: {
          x: refPoints.x[isVertical ? 2 : 1],
          y: refPoints.y[isVertical ? 1 : 2]
        },
        bottomRight: {
          x: refPoints.x[isVertical ? 3 : 2],
          y: refPoints.y[isVertical ? 2 : 3]
        }
      }
    },
    markers: {
      a: {
        topLeft: {
          x: refPoints.x[isVertical ? 1 : 0],
          y: refPoints.y[isVertical ? 0 : 1]
        },
        bottomRight: {
          x: refPoints.x[isVertical ? 2 : 1],
          y: refPoints.y[isVertical ? 1 : 2]
        }
      },
      b: {
        topLeft: {
          x: refPoints.x[isVertical ? 2 : 0],
          y: refPoints.y[isVertical ? 0 : 2]
        },
        bottomRight: {
          x: refPoints.x[isVertical ? 3 : 1],
          y: refPoints.y[isVertical ? 1 : 3]
        }
      }
    },
    scores: {
      win: {
        a: {
          topLeft: {
            x: refPoints.x[isVertical ? 1 : 3],
            y: refPoints.y[isVertical ? 3 : 1]
          },
          bottomRight: {
            x: refPoints.x[isVertical ? 2 : 4],
            y: refPoints.y[isVertical ? 4 : 2]
          }
        },
        b: {
          topLeft: {
            x: refPoints.x[isVertical ? 2 : 3],
            y: refPoints.y[isVertical ? 3 : 2]
          },
          bottomRight: {
            x: refPoints.x[isVertical ? 3 : 4],
            y: refPoints.y[isVertical ? 4 : 3]
          }
        }
      },
      lose: {
        a: {
          topLeft: {
            x: refPoints.x[isVertical ? 1 : 4],
            y: refPoints.y[isVertical ? 4 : 1]
          },
          bottomRight: {
            x: refPoints.x[isVertical ? 2 : 5],
            y: refPoints.y[isVertical ? 5 : 2]
          }
        },
        b: {
          topLeft: {
            x: refPoints.x[isVertical ? 2 : 4],
            y: refPoints.y[isVertical ? 4 : 2]
          },
          bottomRight: {
            x: refPoints.x[isVertical ? 3 : 5],
            y: refPoints.y[isVertical ? 5 : 3]
          }
        }
      },
      draw: {
        a: {
          topLeft: {
            x: refPoints.x[isVertical ? 1 : 5],
            y: refPoints.y[isVertical ? 5 : 1]
          },
          bottomRight: {
            x: refPoints.x[isVertical ? 2 : 6],
            y: refPoints.y[isVertical ? 6 : 2]
          }
        },
        b: {
          topLeft: {
            x: refPoints.x[isVertical ? 2 : 5],
            y: refPoints.y[isVertical ? 5 : 2]
          },
          bottomRight: {
            x: refPoints.x[isVertical ? 3 : 6],
            y: refPoints.y[isVertical ? 6 : 3]
          }
        }
      }
    }
  };
}

function createCurrentPlayerHighlight(area) {
  let hlcp = createSVGGroup(undefined, CSS.RECTS);
  let width = HLP.round(area.scores.draw.a.bottomRight.x - area.icons.a.topLeft.x, 2);
  let height = HLP.round(area.scores.draw.a.bottomRight.y - area.icons.a.topLeft.y, 2);
  let rectCross = createSVGRect(area.icons.a.topLeft.x, area.icons.a.topLeft.y, width, height);
  rectCross.setAttribute('id', ID.CROSS + SUFFIX.CURRENT_PLAYER_HL);
  rectCross.classList.add(CSS.HIDDEN);
  hlcp.appendChild(rectCross);
  let rectNought = createSVGRect(area.icons.b.topLeft.x, area.icons.b.topLeft.y, width, height);
  rectNought.setAttribute('id', ID.NOUGHT + SUFFIX.CURRENT_PLAYER_HL);
  rectNought.classList.add(CSS.HIDDEN);
  hlcp.appendChild(rectNought);
  return hlcp;
}

function createCurrentPlayerMarkers(areas) {
  let markers = createSVGGroup(undefined, CSS.MARKERS);
  markers.appendChild(createCurrentPlayerMarker(areas.a, ID.CROSS));
  markers.appendChild(createCurrentPlayerMarker(areas.b, ID.NOUGHT));
  return markers;
}

function createCurrentPlayerMarker(area, id) {
  let width = area.bottomRight.x - area.topLeft.x;
  let height = area.bottomRight.y - area.topLeft.y;
  let isVertical = isVerticalOrientation(width, height);
  let refLengthX = width * (1 - CONFIG.SCORE_MARKER_PADDING);
  let refLengthY = height * (1 - CONFIG.SCORE_MARKER_PADDING);
  let paddingX = (width - refLengthX) / 2;
  let paddingY = (height - refLengthY) / 2;
  let x1 = area.topLeft.x + paddingX;
  let x2 = HLP.round(x1 + (refLengthX * (isVertical ? 1 : 0.5)), 2);
  let x3 = HLP.round(x1 + (refLengthX * (isVertical ? 0 : 1)), 2);
  x1 = HLP.round(x1, 2);
  let y1 = area.topLeft.y + paddingY;
  let y2 = HLP.round(y1 + (refLengthY * (isVertical ? 0.5 : 1)), 2);
  let y3 = HLP.round(y1 + (refLengthY * (isVertical ? 1 : 0)), 2);
  y1 = HLP.round(y1, 2);
  let marker = createSVGTriangle(x1, y1, x2, y2, x3, y3);
  marker.setAttribute('id', id + SUFFIX.CURRENT_PLAYER_MARKER);
  marker.classList.add(CSS.HIDDEN);
  return marker;
}

function createScoreGrid(areas) {
  let grid = createSVGGroup(undefined, CSS.LINES);
  grid.appendChild(
    createSVGLine(
      areas.icons.b.topLeft.x,
      areas.icons.b.topLeft.y + (areas.isVertical ? areas.refLength / 4 : 0),
      areas.isVertical ? areas.symbols.b.topLeft.x : areas.symbols.b.bottomRight.x - (areas.refLength / 4),
      areas.isVertical ? areas.symbols.b.bottomRight.y - (areas.refLength / 4) : areas.symbols.b.topLeft.y
    )
  );
  grid.appendChild(
    createSVGLine(
      areas.isVertical ? areas.symbols.b.topLeft.x : areas.symbols.b.bottomRight.x + (areas.refLength / 4),
      areas.isVertical ? areas.symbols.b.bottomRight.y + (areas.refLength / 4) : areas.symbols.b.topLeft.y,
      areas.isVertical ? areas.scores.draw.b.topLeft.x : areas.scores.draw.b.bottomRight.x - (areas.refLength / 4),
      areas.isVertical ? areas.scores.draw.b.bottomRight.y - (areas.refLength / 4) : areas.scores.draw.b.topLeft.y
    )
  );
  grid.appendChild(
    createSVGLine(
      areas.scores.lose.a.topLeft.x + (areas.isVertical ? (areas.refLength / 4) : 0),
      areas.scores.lose.a.topLeft.y + (areas.isVertical ? 0 : (areas.refLength / 4)),
      areas.isVertical ? areas.scores.lose.b.bottomRight.x - (areas.refLength / 4) : areas.scores.lose.b.topLeft.x,
      areas.isVertical ? areas.scores.lose.b.topLeft.y : areas.scores.lose.b.bottomRight.y - (areas.refLength / 4)
    )
  );
  grid.appendChild(
    createSVGLine(
      areas.scores.draw.a.topLeft.x + (areas.isVertical ? (areas.refLength / 4) : 0),
      areas.scores.draw.a.topLeft.y + (areas.isVertical ? 0 : (areas.refLength / 4)),
      areas.isVertical ? areas.scores.draw.b.bottomRight.x - (areas.refLength / 4) : areas.scores.draw.b.topLeft.x,
      areas.isVertical ? areas.scores.draw.b.topLeft.y : areas.scores.draw.b.bottomRight.y - (areas.refLength / 4)
    )
  );
  return grid;
}

function createScoreLabels(areas) {
  let labels = createSVGGroup(undefined, CSS.TEXT);
  labels.appendChild(createScoreText(areas.win));
  labels.appendChild(createScoreText(areas.lose));
  labels.appendChild(createScoreText(areas.draw));
  return labels;
}

function createScoreValues(areas) {
  let scores = createSVGGroup(undefined, CSS.TEXT);
  scores.appendChild(createScoreText(areas.win.a, '0', ID.CROSS + SUFFIX.WIN));
  scores.appendChild(createScoreText(areas.win.b, '0', ID.NOUGHT + SUFFIX.WIN));
  scores.appendChild(createScoreText(areas.lose.a, '0', ID.CROSS + SUFFIX.LOSE));
  scores.appendChild(createScoreText(areas.lose.b, '0', ID.NOUGHT + SUFFIX.LOSE));
  scores.appendChild(createScoreText(areas.draw.a, '0', ID.CROSS + SUFFIX.DRAW));
  scores.appendChild(createScoreText(areas.draw.b, '0', ID.NOUGHT + SUFFIX.DRAW));
  return scores;
}

function createScoreText(area, txt =  undefined, id = undefined) {
  let x = area.topLeft.x + ((area.bottomRight.x - area.topLeft.x) / 2);
  let y = area.topLeft.y + ((area.bottomRight.y - area.topLeft.y) / 2);
  let label = createSVGText(x, y, txt ? txt : area.text);
  if (id) {
    label.setAttribute('id', id);
  }
  return label;
}

function createScoreSymbols(areas) {
  let symbols = createSVGGroup(undefined, CSS.SYMBOLS);
  let width = areas.a.bottomRight.x - areas.a.topLeft.x;
  let refLength = width * (1 - CONFIG.SCORE_SYMBOL_PADDING);
  let padding = (width - refLength) / 2;
  let radius = HLP.round(refLength / 2, 2);
  let cross = createCrossSymbol(HLP.round(areas.a.topLeft.x + padding, 2), HLP.round(areas.a.topLeft.y + padding, 2), HLP.round(areas.a.bottomRight.x - padding, 2), HLP.round(areas.a.bottomRight.y - padding, 2));
  cross.classList.remove(CSS.HIDDEN);
  symbols.appendChild(cross);
  let nought = createNoughtSymbol(HLP.round(areas.b.topLeft.x + (width / 2), 2), HLP.round(areas.b.topLeft.y + (width / 2), 2), radius);
  nought.classList.remove(CSS.HIDDEN);
  symbols.appendChild(nought);
  return symbols;
}

function createScoreIcons(areas) {
  let icons = createSVGGroup(undefined, CSS.ICONS);
  let width = areas.a.bottomRight.x - areas.a.topLeft.x;
  let refLength = width * (1 - CONFIG.SCORE_ICON_PADDING);
  let padding = (width - refLength) / 2;
  icons.appendChild(createHumanIcon(areas.a.topLeft.x + padding, areas.a.topLeft.y + padding, areas.a.bottomRight.x - padding, areas.a.bottomRight.y - padding, ID.CROSS));
  icons.appendChild(createHumanIcon(areas.b.topLeft.x + padding, areas.b.topLeft.y + padding, areas.b.bottomRight.x - padding, areas.b.bottomRight.y - padding, ID.NOUGHT));
  icons.appendChild(createCPUIcon(areas.a.topLeft.x + padding, areas.a.topLeft.y + padding, areas.a.bottomRight.x - padding, areas.a.bottomRight.y - padding, ID.CROSS));
  icons.appendChild(createCPUIcon(areas.b.topLeft.x + padding, areas.b.topLeft.y + padding, areas.b.bottomRight.x - padding, areas.b.bottomRight.y - padding, ID.NOUGHT));
  return icons;
}

function createCommands(area) {
  let commands = createSVGGroup(ID.COMMAND, CSS.COMMANDS, CSS.HIDDEN);
  let commandArea = computeCommandArea(area);
  //Exit button
  let exitIcon = createExitIcon(commandArea.exit.topLeft.x, commandArea.exit.topLeft.y, commandArea.exit.bottomRight.x, commandArea.exit.bottomRight.y);
  exitIcon.setAttribute('id', ACTIONS.EXIT_GAME);
  exitIcon.dataset[DATASET.ACTION] = ACTIONS.EXIT_GAME;
  commands.appendChild(exitIcon);
  //Reset button
  let resetIcon = createResetIcon(commandArea.reset.topLeft.x, commandArea.reset.topLeft.y, commandArea.reset.bottomRight.x, commandArea.reset.bottomRight.y);
  resetIcon.setAttribute('id', ACTIONS.RESET_GAME);
  resetIcon.dataset[DATASET.ACTION] = ACTIONS.RESET_GAME;
  commands.appendChild(resetIcon);
  return commands;
}

function computeCommandArea(containerArea) {
  let width = containerArea.bottomRight.x - containerArea.topLeft.x;
  let height = containerArea.bottomRight.y - containerArea.topLeft.y;
  let isVertical = isVerticalOrientation(width, height);
  return {
    exit: {
      topLeft: {
        x: containerArea.topLeft.x,
        y: containerArea.topLeft.y
      },
      bottomRight: {
        x: isVertical ? containerArea.bottomRight.x : containerArea.topLeft.x + (width / 2),
        y: isVertical ? containerArea.topLeft.y + (height / 2) : containerArea.bottomRight.y
      }
    },
    reset: {
      topLeft: {
        x: isVertical ? containerArea.topLeft.x : containerArea.topLeft.x + (width / 2),
        y: isVertical ? containerArea.topLeft.y + (height / 2) : containerArea.topLeft.y
      },
      bottomRight: {
        x: containerArea.bottomRight.x,
        y: containerArea.bottomRight.y
      }
    }
  }
}

function createWidgets(area) {
  let widgets = createSVGGroup(ID.WIDGET, CSS.WIDGETS, CSS.HIDDEN);
  let widgetAreas = computeWidgetArea(area);
  //Version w/ changelog
  let ver = createVersionWidget(widgetAreas.version, widgetAreas.widgetRadius);
  ver.setAttribute('id', ID.VERSION);
  ver.dataset[DATASET.ACTION] = ACTIONS.GOTO_CHANGE_LOG;
  widgets.appendChild(ver);
  //triglyph link to GIT
  let git = createGitWidget(widgetAreas.git, widgetAreas.widgetRadius);
  git.setAttribute('id', ID.GIT);
  git.dataset[DATASET.ACTION] = ACTIONS.GOTO_CHANGE_LOG;
  widgets.appendChild(git);
  return widgets;
}

function computeWidgetArea(containerArea) {
  let width = containerArea.bottomRight.x - containerArea.topLeft.x;
  let height = containerArea.bottomRight.y - containerArea.topLeft.y;
  let isVertical = isVerticalOrientation(width, height);
  let refLength = isVertical ? width : height;
  let radius = 0.1 * refLength;
  return {
    widgetRadius: radius,
    version: {
      topLeft: {
        x: containerArea.bottomRight.x - refLength,
        y: containerArea.bottomRight.y - refLength
      },
      bottomRight: {
        x: containerArea.bottomRight.x,
        y: containerArea.bottomRight.y
      }
    },
    git: {
      topLeft: {
        x: containerArea.bottomRight.x - ((isVertical ? 1 : 2) * refLength),
        y: containerArea.bottomRight.y - ((isVertical ? 2 : 1) * refLength)
      },
      bottomRight: {
        x: containerArea.bottomRight.x - (isVertical ? 0 : refLength),
        y: containerArea.bottomRight.y - (isVertical ? refLength : 0)
      }
    }
  };
}

function createVersionWidget(area, cornerRadius) {
  let width = (area.bottomRight.x - area.topLeft.x) * (1 - CONFIG.WIDGET_PADDING);
  let padding = (area.bottomRight.x - area.topLeft.x - width) / 2
  let widget = createBaseWidget(area.topLeft.x + padding, area.topLeft.y + padding, area.bottomRight.x - padding, area.bottomRight.y - padding, cornerRadius);
  widget.classList.add(CSS.VERSION);
  widget.appendChild(createSVGText(area.topLeft.x + padding + (width / 2), area.topLeft.y + padding + (width / 2), VERSION));
  return widget;
}

function createGitWidget(area, cornerRadius) {
  let width = (area.bottomRight.x - area.topLeft.x) * (1 - CONFIG.WIDGET_PADDING);
  let padding = (area.bottomRight.x - area.topLeft.x - width) / 2
  let widget = createBaseWidget(area.topLeft.x + padding, area.topLeft.y + padding, area.bottomRight.x - padding, area.bottomRight.y - padding, cornerRadius);
  widget.classList.add(CSS.GIT);
  widget.appendChild(createAbsigIcon(area.topLeft.x + padding, area.topLeft.y + padding, area.bottomRight.x - padding, area.bottomRight.y - padding));
  return widget;
}

function createSVGGroup(id, ...classes) {
  const GROUP = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  if (id) {
    GROUP.setAttribute('id', id);
  }
  if (classes) {
    GROUP.classList.add(...classes);
  }
  return GROUP;
}

function createSVGLine(x1, y1, x2, y2) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  return line
}

function createSVGRect(x, y, width, height, rx, ry) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  rect.setAttribute('width', width);
  rect.setAttribute('height', height);
  if (rx) {
    rect.setAttribute('rx', rx);
  }
  if (ry) {
    rect.setAttribute('ry', ry);
  }
  return rect;
}

function createSVGCircle(x, y, radius) {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', x);
  circle.setAttribute('cy', y);
  circle.setAttribute('r', radius);
  return circle;
}

function createSVGTriangle(x1, y1, x2, y2, x3, y3) {
  const points = x1 + ',' + y1 + ' ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3;
  const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  triangle.setAttribute('points', points);
  return triangle;
}

function createSVGText(x, y, txt) {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', x);
  text.setAttribute('y', y);
  text.setAttribute('dominant-baseline', 'middle');
  text.setAttribute('text-anchor', 'middle');
  text.appendChild(document.createTextNode(txt));
  return text;
}

function createSVGPath(pathdef, id) {
  let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathdef);
  if (id) {
    path.setAttribute('id', id);
  }
  return path;
}

function createNoughtSymbol(centerX, centerY, radius, position) {
  let nought = createSVGCircle(centerX, centerY, radius);
  if (position !== undefined) {
    nought.setAttribute('id', ID.NOUGHT + SUFFIX.SYMBOL + position);
  }
  nought.classList.add(CSS.HIDDEN);
  return nought
}

function createCrossSymbol(leftX, topY, rightX, bottomY, position) {
  let cross = createSVGGroup(undefined, CSS.HIDDEN);
  if (position !== undefined) {
    cross.setAttribute('id', ID.CROSS + SUFFIX.SYMBOL + position);
  }
  let line1 = createSVGLine(leftX, topY, rightX, bottomY);
  let line2 = createSVGLine(rightX, topY, leftX, bottomY);
  cross.appendChild(line1);
  cross.appendChild(line2);
  return cross;
}

function createHumanIcon(leftX, topY, rightX, bottomY, idRoot) {
  const icon = createSVGGroup(undefined);
  icon.classList.add(CSS.HIDDEN);
  const r = 2 * (bottomY - topY) / 7
  const R = (3 * r / 2);
  const xc = leftX + ((rightX - leftX) / 2);
  const xl = xc - R;
  const xr = xc + R;
  const yc = topY + r;
  icon.appendChild(createSVGCircle(xc, yc, r)); //Head
  const pathdef = 'M ' + xl + ' ' + bottomY + ' A ' + R + ' ' + R + ' 0 1 1 ' + xr + ' ' + bottomY;
  icon.appendChild(createSVGPath(pathdef)); //Body
  icon.setAttribute('id', idRoot + SUFFIX.HUMAN);
  return icon;
}

function createCPUIcon(leftX, topY, rightX, bottomY, idRoot) {
  const icon = createSVGGroup(undefined);
  icon.classList.add(CSS.HIDDEN);
  const r = 2 * (bottomY - topY) / 7
  const R = (3 * r / 2);
  const xc = leftX + ((rightX - leftX) / 2);
  const xlh = xc - r;
  const xlb = xc - (1.25 * R);
  const xrb = xc + (1.25 * R);
  const ytb = topY + (2 * r);
  icon.appendChild(createSVGRect(xlh, topY, 2 * r, 2 * r)); //Head
  const pathdef = 'M ' + xlb + ' ' + bottomY + ' V ' + ytb + ' H ' + xrb + ' V ' + bottomY;
  icon.appendChild(createSVGPath(pathdef)); //Body
  icon.setAttribute('id', idRoot + SUFFIX.CPU);
  return icon;
}

function createExitIcon(leftX, topY, rightX, bottomY) {
  let height = (bottomY - topY) * (1 - CONFIG.COMMAND_ICON_PADDING);
  let width = height / 2;
  let paddingX = (rightX - leftX - width) / 2;
  let paddingY = (bottomY - topY - height) / 2;
  let x1 = leftX + paddingX;
  let x2 = HLP.round(x1 + width, 2);
  let x3 = x1 + (0.4 * width);
  let x4 = HLP.round(x3 + width, 2);
  let x5 = HLP.round(x3 + (0.8 * width), 2);
  x1 = HLP.round(x1, 2);
  x3 = HLP.round(x3, 2);
  let y1 = topY + paddingY;
  let y2 = y1 + (height / 2);
  let y3 = HLP.round(y2 + (height / 10), 2);
  let y4 = HLP.round(y1 + height, 2);
  let y5 = HLP.round(y2 - (height / 10), 2);
  y1 = HLP.round(y1, 2);
  y2 = HLP.round(y2, 2);
  let pathdef = "M " + x2 + " " + y3 + " V " + y4 + " H " + x1 + " V " + y1 + " H " + x2 + " V " + y5 + " M " + x3 + " " + y2 + " H " + x4 + " M " + x5 + " " + y5 + " L " + x4 + " " + y2 + " L " + x5 + " " + y3;
  let icon = createSVGPath(pathdef, ACTIONS.EXIT_GAME);
  icon.classList.add(CSS.ICONS);
  return icon;
}

function createResetIcon(leftX, topY, rightX, bottomY) {
  let height = (bottomY - topY) * (1 - CONFIG.COMMAND_ICON_PADDING);
  let width = (rightX - leftX) * (1 - CONFIG.COMMAND_ICON_PADDING);
  let refLength = width > height ? height : width;
  let paddingX = (rightX - leftX - refLength) / 2;
  let paddingY = (bottomY - topY - refLength) / 2;
  let r = refLength / 2;
  let alpha = 20;
  let cx = leftX + paddingX + r;
  let cy = topY + paddingY + r;
  let x1 = HLP.round(cx + (Math.sin(305 * Math.PI / 180) * r), 2);
  let x2 = cx + (Math.sin(335 * Math.PI / 180) * r);
  let x3 = HLP.round(x2 + (Math.sin(alpha * Math.PI / 180) * (r / 5)), 2);
  let x4 = HLP.round(x2 + (Math.sin((alpha + 90) * Math.PI / 180) * (r / 5)), 2);
  let y1 = HLP.round(cy - (Math.cos(305 * Math.PI / 180) * r), 2);
  let y2 = cy - (Math.cos(335 * Math.PI / 180) * r);
  let y3 = HLP.round(y2 - (Math.cos(alpha * Math.PI / 180) * (r / 5)), 2);
  let y4 = HLP.round(y2 - (Math.cos((alpha + 90) * Math.PI / 180) * (r / 5)), 2);
  r = HLP.round(r, 2);
  x2 = HLP.round(x2, 2);
  y2 = HLP.round(y2, 2);
  let pathdef = 'M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 1 0 ' + x2 + ' ' + y2 + ' M ' + x3 + ' ' + y3 + ' L ' + x2 + ' ' + y2 + ' L ' + x4 + ' ' + y4;
  let icon = createSVGPath(pathdef, ACTIONS.RESET_GAME);
  icon.classList.add(CSS.ICONS);
  return icon;
}

function createBaseWidget(leftX, topY, rightX, bottomY, cornerRadius) {
  let widget = createSVGGroup(undefined);
  widget.appendChild(createSVGRect(leftX, topY, rightX - leftX, bottomY - topY, cornerRadius, cornerRadius))
  return widget;
}

function createAbsigIcon(leftX, topY, rightX, bottomY) {
  let icon = createSVGGroup(undefined);
  let refLength = (rightX - leftX) * (1 - CONFIG.ABSIG_ICON_PADDING);
  let triangleHeight = 2 * refLength / 3;
  let sideLength = triangleHeight * 2 / Math.sqrt(3);
  let paddingX = (rightX - leftX - sideLength) / 2
  let paddingY = (bottomY - topY - refLength) / 2;
  //upper triangle
  let x1 = leftX + paddingX;
  let x2 = x1 + (sideLength / 2);
  let x3 = x1 + sideLength;
  let y1 = topY + paddingY;
  let y2 = y1 + triangleHeight;
  icon.appendChild(createSVGTriangle(x1, y1, x2, y2, x3, y1));
  //lower triangle
  let x4 = x1 + (sideLength / 6);
  let x5 = x3 - (sideLength / 6);
  let y3 = bottomY - paddingY;
  let y4 = y3 - triangleHeight;
  let pathdef = 'M ' + x4 + ' ' + y3 + ' H ' + x1 + ' L ' + x2 + ' ' + y4 + ' L ' + x3 + ' ' + y3 + ' H ' + x5;
  icon.appendChild(createSVGPath(pathdef));
  //outer circle
  icon.appendChild(createSVGCircle(x2, ((bottomY - topY) / 2) + topY, (refLength / 2) * (1 - CONFIG.ABSIG_ICON_PADDING)));
  //inner dot
  let dot = createSVGCircle(x2, ((bottomY - topY) / 2) + topY, (refLength / 2) * CONFIG.ABSIG_ICON_PADDING);
  dot.setAttribute('fill', 'black')
  icon.appendChild(dot);
  //lower circle
  icon.appendChild(createSVGCircle(x2, ((y3 - y4) / 2) + y4, (triangleHeight / 2)));
  //upper half-circle
  pathdef = 'M ' + x1 + ' ' + y1 + ' A ' + (triangleHeight / 2) + ' ' + (triangleHeight / 2) + ' 0 0 0 ' + x3 + ' ' + y1;
  icon.appendChild(createSVGPath(pathdef));
  return icon;
}

function applyEventListener(listener, positionCount) {
  document.getElementById(ID.CROSS + ACTIONS.PICK_SYMBOL).addEventListener('click', listener); //X on the picker sceen
  document.getElementById(ID.NOUGHT + ACTIONS.PICK_SYMBOL).addEventListener('click', listener); //O on the picker sceen
  Object.entries(CPU_BEHAVIOUR).forEach(([key, val]) => {
    document.getElementById(ACTIONS.PICK_BEHAVIOUR + key).addEventListener('click', listener); //CPU beahviour option
  });
  document.getElementById(ACTIONS.EXIT_GAME).addEventListener('click', listener); //Exit game command
  document.getElementById(ACTIONS.RESET_GAME).addEventListener('click', listener); //Reset game command
  document.getElementById(ID.VERSION).addEventListener('click', listener); //Go to changelog on git
  document.getElementById(ID.GIT).addEventListener('click', listener); //Go to triglyph home page on git
  applyEventListenerBoardPositions(listener, positionCount); //Board positions
}

function applyEventListenerBoardPositions(listener, positionCount) {
  [...Array(positionCount).keys()].forEach(position => {
    document.getElementById(ACTIONS.PUT_SYMBOL + position).addEventListener('click', listener);
  });
}

function clearBoard(positions) {
  [...Array(positions).keys()].forEach(position => {
    document.getElementById(ID.NOUGHT + SUFFIX.SYMBOL + position).classList.add(CSS.HIDDEN);
    document.getElementById(ID.CROSS + SUFFIX.SYMBOL + position).classList.add(CSS.HIDDEN);
    document.getElementById(ACTIONS.PUT_SYMBOL + position).classList.remove(CSS.USED, CSS.WINNER);
    document.getElementById(ACTIONS.PUT_SYMBOL + position).classList.add(CSS.FREE);
  });
}

function writeScore(players, scores) {
  players.forEach(player => {
    document.getElementById(player + SUFFIX.WIN).textContent = scores[player].win;
    document.getElementById(player + SUFFIX.DRAW).textContent = scores[player].draw;
    document.getElementById(player + SUFFIX.LOSE).textContent = scores[player].lose;
  });
}

function swapPlayer(current, human, cpu) {
  let newCurrent = current == human ? cpu : human;
  showCurrentPlayer(newCurrent, current);
  return newCurrent;
}

function showCurrentPlayer(current, previous) {
  document.getElementById(current + SUFFIX.CURRENT_PLAYER_MARKER).classList.remove(CSS.HIDDEN);
  document.getElementById(current + SUFFIX.CURRENT_PLAYER_HL).classList.remove(CSS.HIDDEN);
  document.getElementById(previous + SUFFIX.CURRENT_PLAYER_MARKER).classList.add(CSS.HIDDEN);
  document.getElementById(previous + SUFFIX.CURRENT_PLAYER_HL).classList.add(CSS.HIDDEN);
}

function highlightWinningPositions(board, players) {
  let boardSize = computeBoardSize(board);
  let boardState = undefined;

  //Test diagonals
  [0, boardSize - 1].some(i => {
    let modifier = i == 0 ? 1 : -1;
    let indicis = [...Array(boardSize).keys()].map(index => i + (index * (boardSize + modifier)));
    let diagonal = indicis.map(index => board[index]);
    boardState = checkState(diagonal, boardSize, players) ? indicis : undefined;
    return boardState; //Exits the some if truthy
  });
  
  //Test rows
  if (!boardState) {
    [...Array(boardSize).keys()].some(i => {
      let indicis = [...Array(boardSize).keys()].map(index => (i * boardSize) + index);
      let row = indicis.map(index => board[index]);
      boardState = checkState(row, boardSize, players) ? indicis : undefined;
      return boardState; //Exits the some if truthy
    });
  }
  
  //Test columns
  if (!boardState) {
    [...Array(boardSize).keys()].some(i => {
      let indicis = [...Array(boardSize).keys()].map(index => i + (index * boardSize));
      let column = indicis.map(index => board[index]);
      boardState = checkState(column, boardSize, players) ? indicis : undefined;
      return boardState; //Exits the some if truthy
    });
  }

  if (boardState) {
    boardState.forEach(index => document.getElementById(ACTIONS.PUT_SYMBOL + index).classList.replace(CSS.USED, CSS.WINNER));
  }
}

let rootElement = HLP.divfactory(CONFIG.ROOT, undefined, CSS.ROOT, CSS.GRID)
document.body.appendChild(rootElement);
let oxoContainer = HLP.divfactory(CONFIG.OXO, undefined, CSS.GRIDITEM, CSS.OXO);
rootElement.appendChild(oxoContainer);
const objOXO = new OXO(oxoContainer);