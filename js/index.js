var actualPlayer = "O";
var board = [ [0, 0, 0], [0, 0, 0], [0, 0, 0] ];
var n = 3;
var winner = "";
var draw = false;
var mode = 1;
var states = {};
var bot = null;

var humanPlayer = "O";
var botPlayer = "X";


window.onload = function(){
  $('.reload').on("click", function(){
    winner = "";
    draw = false;
    board = math.zeros([n, n]);
    $('table td').html("");
    $('table td').removeClass("playerX").removeClass("playerO");
  });

  getLearnedStates();

  $('table td').each(function(i){
    $(this).on("click", function(){
      if(winner != "" || !canMove(i)) return;

      //Human vs Human
      if(mode == 0){
        applyMove(i);
        $(this).html(actualPlayer);
        $(this).addClass("player" + actualPlayer);

        if(isGameOver(actualPlayer)){
          if(draw){
            $('.title_container h3').html("¡Empate!");
          }else{
            $('.title_container h3').html(`¡Gano <span class="player${actualPlayer}">${actualPlayer}</span>!`);
          }
          winner = actualPlayer;
          return;
        }

        if(actualPlayer == "X")
        actualPlayer = "O";
        else
        actualPlayer = "X";

        $('.title_container h3').html(`Juega <span class="player${actualPlayer}">${actualPlayer}</span>`);
      }else{
        if(humanPlayer != actualPlayer) return;

        applyMove(i);
        $(this).html(actualPlayer);
        $(this).addClass("player" + actualPlayer);

        if(isGameOver(actualPlayer)){
          if(draw){
            $('.title_container h3').html("¡Empate!");
          }else{
            $('.title_container h3').html(`¡Gano <span class="player${actualPlayer}">${actualPlayer}</span>!`);
          }
          winner = actualPlayer;
          if(winner == botPlayer)
            bot.onReward(1);
          else
            bot.onReward(-1);

          setLearnedStates();
          getLearnedStates();
          return;
        }

        if(actualPlayer == "X")
          actualPlayer = "O";
        else
          actualPlayer = "X";

        $('.title_container h3').html(`Juega <span class="player${actualPlayer}">${actualPlayer}</span>`);
        setTimeout(botMove(), 1000);
      }

    });
  });
}

function resetBoard(){
  board = math.zeros([n, n]);
}

function canMove(val){
  x = val % n;
  y = math.floor(val / n);
  return board[y][x] == 0 ? true : false;
}

function applyMove(val){
  x = val % n;
  y = math.floor(val / n);
  board[y][x] = actualPlayer;
}

function botMove(){
  move = bot.selectMove(board);
  x = move[1];
  y = move[0];
  board[y][x] = actualPlayer;

  ind = y*n + x;
  $('table td').eq(ind).html(actualPlayer);
  $('table td').eq(ind).addClass("player" + actualPlayer);

  if(isGameOver(actualPlayer)){
    if(draw){
      $('.title_container h3').html("¡Empate!");
    }else{
      $('.title_container h3').html(`¡Gano <span class="player${actualPlayer}">${actualPlayer}</span>!`);
    }
    winner = actualPlayer;
    if(winner == botPlayer)
      bot.onReward(1);
    else
      bot.onReward(-1);

    setLearnedStates();
    getLearnedStates();
    return;
  }

  if(actualPlayer == "X")
    actualPlayer = "O";
  else
    actualPlayer = "X";

  $('.title_container h3').html(`Juega <span class="player${actualPlayer}">${actualPlayer}</span>`);
}

function isGameOver(sym){
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

    draw = cont == board.length ? true : false;
    return draw;
}

function getLearnedStates(){
  $.getJSON( "js/learnX.json", function(data){
    bot = new Agent('X', 0.20, 0.01, 0.5, 0.01);
    bot.states = data;
    bot.setExplorationRate(-1);
  });
}

function setLearnedStates(){
  parametros = "data=" + JSON.stringify(bot.states, null, 4);

  $.ajax({
    type: "POST",
    url: 'php/save_data.php',
    cache: false,
    data: parametros,
    success: function (responseText) {
      console.log(responseText);
    }
  });
}
