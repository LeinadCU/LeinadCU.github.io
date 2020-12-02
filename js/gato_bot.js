class Board{
  constructor(tam, psym){
    this.tam = tam;
    this.board = this.resetBoard(tam);
    this.stale = false;

    this.psym = psym;
    this.bsym = psym == 'X' ? 'O' : 'X';
    this.winner = null;
  }

  resetBoard(n){
    this.board = math.zeros([n, n]);
    this.winner = null;
  }

  displayBoard(board){
    console.log('\n');
		console.log(board[0][0] + '|' + board[0][1] + '|' + board[0][2]);
		console.log("-----");
		console.log(board[1][0] + '|' + board[1][1] + '|' + board[1][2]);
		console.log("-----");
		console.log(board[2][0] + '|' + board[2][1] + '|' + board[2][2]);
		console.log('\n');
  }

  isGameOver(board, sym){
    for(var i = 0; i < board.length; i++){
      var row = 0; var col = 0;
      for(var j = 0; j < board.length; j++){
        if(board[i][j] == sym) row = row + 1;
        if(board[j][i] == sym) col = col + 1;
      }
      if(row == board.length || col == board.length) return true;
    }

    var diagr = 0; var diagl = 0;
    for(var i = 0; i < board.length; i++){
      if(board[i][i] == sym) diagr = diagr + 1;
      if(board[i][board.length - i - 1] == sym) diagl = diagl + 1;
    }
    if(diagr == board.length || diagl == board.length) return true;

    var cont = 0;
    for(var i = 0; i < board.length; i++){
      if(board[i].indexOf(0) == -1) cont = cont + 1;
    }

    this.stale = cont == board.length ? true : false;
    return this.stale;
  }

  playMove(x, y, sym){
    this.board[x][y] = sym;
    if(this.isGameOver(this.board, sym)){
      if(this.stale)
        this.winner = 0;
      else
        this.winner = sym;
    }
    //this.displayBoard(this.board);
  }
}

class Agent{
  constructor(sym, exploration_rate, decay, learning_rate, discount){
    this.sym = sym;
    this.states = {};
    this.states_order = [];
    this.exploration_rate = exploration_rate;
    this.decay = decay;
    this.learning_rate = learning_rate;
    this.discount = discount;
  }

  setExplorationRate(rate){
    this.exploration_rate = rate;
  }

  setState(board, action){
    var stateKey = this.serializeBoard(board);
    this.states_order.push([stateKey, action]);
  }

  setAction(board, index, val){
    var x = index[0];
    var y = index[1];
    board[x][y] = val;
  }

  getAction(board, index){
    var x = index[0];
    var y = index[1];
    return board[x][y];
  }

  serializeBoard(board){
    var serial = "";
    var lineal = math.flatten(board);
    math.forEach(lineal, function(val){
      serial = serial + `${val}`;
    });
    return serial;
  }

  temporalDifferenceLearning(reward, newStateKey, stateKey){
    var oldState = getOnDict(this.states, stateKey, math.zeros([3, 3]));
    this.setExplorationRate(math.max([this.exploration_rate - this.decay, 0.3]));
    var tdl = math.multiply(reward, this.states[newStateKey]);
    tdl = math.subtract(tdl, oldState);
    tdl = math.multiply(this.learning_rate, tdl);
    return tdl;
  }

  onReward(reward){
    if(this.states_order.length == 0) return undefined;

    console.log("Rewarding!");
    var stateAction = this.states_order.pop();
    var newStateKey = stateAction[0];
    var newAction = stateAction[1];

    this.states[newStateKey] = math.zeros([3, 3]);
    this.setAction(this.states[newStateKey], newAction, reward);

    var board, stateKey, action;
    while(this.states_order.length > 0){
      stateAction = this.states_order.pop();
      stateKey = stateAction[0];
      action = stateAction[1];

      reward *= this.discount;
      if(isOnDict(this.states, stateKey)){
        board = this.temporalDifferenceLearning(reward, newStateKey, stateKey);
        reward += this.getAction(board, action);
        this.setAction(this.states[stateKey], action, reward);
      }else{
        this.states[stateKey] = math.zeros([3, 3]);
        board = this.temporalDifferenceLearning(reward, newStateKey, stateKey);
        reward += this.getAction(board, action);
        this.setAction(this.states[stateKey], action, reward);
      }
      newStateKey = stateKey;
      newAction = action;
    }
  }

  selectMove(board){
    var stateKey = this.serializeBoard(board);
    var prob = math.random();
    var exploration = prob < this.exploration_rate;

    var action;
    if(exploration || !isOnDict(this.states, stateKey)){
      console.log("Exploring");
      action = this.exploreBoard(board);
    }else{
      console.log("Exploit");
      action = this.exploitBoard(board, stateKey);
    }
    this.setState(board, action);
    return action;
  }

  exploreBoard(board){
    var moves = [];
    for(var i = 0; i < board.length; i++){
      for(var j = 0; j < board.length; j++){
        if(board[i][j] == 0) moves.push([i, j]);
      }
    }

    var tempBoard, rand, selected, stateKey;
    while(moves.length > 0){
      tempBoard = math.clone(board);
      rand = Math.floor(Math.random() * moves.length);
      selected = moves[rand];

      tempBoard[selected[0]][selected[1]] = this.sym;

      stateKey = this.serializeBoard(tempBoard);
      if(!isOnDict(this.states, stateKey)) break;

      moves.splice(rand, 1);
    }

    return selected;
  }

  exploitBoard(board, stateKey){
    var state = this.states[stateKey];

    var best_values = [];
    for(var i = 0; i < board.length; i++){
      for(var j = 0; j < board.length; j++){
        if(board[i][j] == 0)
          best_values.push(state[i][j]);
      }
    }

    console.log(state);
    var best = [];
    var maxvalue = math.max(math.flatten(best_values));
    for(var i = 0; i < board.length; i++){
      for(var j = 0; j < board.length; j++){
        if(board[i][j] == 0 && state[i][j] == maxvalue)
          best.push([i, j]);
      }
    }

    var rand = Math.floor(Math.random() * best.length);
    return best[rand];
  }
}

function getOnDict(dict, key, val){
  var result = dict[key];
  return result !== undefined ? result : val;
}

function isOnDict(dict, key){
  var result = dict[key];
  return result !== undefined ? true : false;
}
