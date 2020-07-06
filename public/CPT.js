var socket; //variable for socket connection
var ids = []; //array for connected clietns
var bothGameModes = []; //array for all connected clients game modes
//varaiblles in chrage of multiplayer game aspects
var clientServerData = {
  gamemode: 0,
  id: 0,
  previous: 0,
  paddle1Y: 200,
  paddle2Y: 200,
  ballX: 0,
  ballY: 0,
  ballSpeedX:0,
  ballSpeedY: 0,
  p1Up: false,
  p1Down: false,
  p2Up: false,
  p2Down: false,
  player1Score: 0,
  player2Score: 0,
  angle: 0,
  pause: false,
  winner: 0,
  multiplayerWaiting: false,
}
//varaiblles in chrage of singleplayer game aspects
var clientData = {
  paddle1Y: 200,
  paddleSpeed: 7,
  ballX: 250,
  ballY: 250,
  ballSpeedX: -4,
  ballSpeedY: 2,
  playerScore: 0,
  computerScore: 0,
  computerPaddleY: 200,
  computerPaddleX: 460,
  angle: 0,
  pause: false,
  diff: 0,
  winner: 0,
}



function setup() {
  createCanvas(500, 500);//creates the canvas
  socket = io();//checks for connection to the server
  //socket = io('http://localhost:3000');
  //calls functions when messages are recieved from server
  socket.on('sendData', returnData);
  socket.on('sendLooping', returnLooping);
  socket.on('removeUser', removeUser);
  socket.on('updatedGamemodes', updatedGamemodes);
  socket.on('paddle1Collision', paddle1Collision);
  socket.on('paddle2Collision', paddle2Collision);
}


function draw() {
  //resets the singlepayer gameboard
  if (clientServerData.previous != clientServerData.gamemode && clientServerData.gamemode == 1)
  {
    clientData.computerPaddleY = 200;//centers the computer paddle
    clientData.paddle1Y = 200;//centers the player paddle
    clientData.computerScore = 0;//resets the computer score
    clientData.playerScore = 0;//resets the player score
    clientData.ballX = 250;//centers the ball in x
    clientData.ballY = 250;//centers the ball in y
    clientData.angle = random(-PI/4, PI/4) //chooses random angle for ball
    clientData.ballSpeedX = 5 * cos(clientData.angle);
    clientData.ballSpeedY = 5 * sin(clientData.angle);
    if (random(2) < 1)
    {
      clientData.ballSpeedX *= -1;
    }
  }
  //updates the current gamemode and sends it to the server
  if(clientServerData.gamemode != clientServerData.previous)
  {
    changingGamemode();
  }
  //draws the main screen
  if (clientServerData.gamemode == 0)
  {

    background(0);//sets the background to black

    //creates the pong text
    fill(255);
    textSize(150);
    text("Pong", 60, 170);

    //creates the singleplayer button
    rect(145, 250, 100, 50);
    textSize(20);
    textStyle(BOLD);
    fill(0);
    text("Single", 168, 285);

    //creates the multiplayer button
    fill(255);
    rect(250, 250, 100, 50);
    textSize(18);
    textStyle(BOLD);
    fill(0);
    text("Multiplayer", 253, 285)

    //creates the instructions button
    fill(255);
    rect(145, 305, 205, 50);
    textSize(30);
    textStyle(BOLD);
    fill(0);
    text("Instructions", 163, 345)
  }
  //draws the singleplayer gameboard
  if (clientServerData.gamemode == 1)
  {
    edges();//checks if the ball is hitting the edges
    ball();//call the ball movemnt function
    background(0);//sets the background to black
    strokeWeight(6);
    stroke(255);
    line(250, 0, 250, height);
    noStroke();
    fill(255);
    rect(20, clientData.paddle1Y, 20, 100);//draws the player paddle
    rect(clientData.computerPaddleX, clientData.computerPaddleY, 20, 100);//draws the computer paddle
    //draws the pause button
    fill(255);
    rect(50, 20, 40, 40);
    fill(0);
    rect(55, 25, 10, 30);
    rect(75, 25, 10, 30);

    fill(255);
    textStyle(NORMAL);
    textSize(60);
    text(clientData.playerScore, 150, 450);//draws player score
    text(clientData.computerScore, 300, 450);//draws computer score
    ellipse(clientData.ballX, clientData.ballY, 50, 50);

    singleplayerPaddleMovement();//in charge of player paddle movement
    computerPaddleMovement();//in charge of computer paddle movement

    //check collision with player paddle
    if (collisionCheck(40, clientData.paddle1Y, 20, 100))
    {
      if (clientData.ballX > 40)//condition so the ball doesn't glitch through paddle
      {
        clientData.diff = clientData.ballY - (clientData.paddle1Y - 100/2);//calculates the distance between the ball y and the top of the paddle
        clientData.angle = map(clientData.diff, 0, 100, -radians(45), radians(45));//using the map function I change the range of the diff variable from 0 to the height of the paddle to -45 degrees and 45 degrees
        clientData.ballSpeedX = 5 * cos(clientData.angle);//makes the ballspeedX 5 * cos of the angle because of trigonometry rules
        clientData.ballSpeedY = 5 * sin(clientData.angle);//makes the ballspeedY 5 * sin of the angle because of trigonometry rules
        clientData.ballX = 40 + 25;//also making sure the ball doesn't glich into the paddle
      }
    }

    if (collisionCheck(width - 40, clientData.computerPaddleY, 20, 100))
    {
      if (clientData.ballX < 500 - 40) //condition so the ball doesn't glitch through paddle
      {
        clientData.angle = random(radians(135), radians(225));
        clientData.ballSpeedX = 5 * cos(clientData.angle);
        clientData.ballSpeedY = 5 * sin(clientData.angle);
        clientData.ballX = 500 - 40 - 25;
      }
    }


    //draws the pause menu
    if (clientData.pause)
    {
      fill(255);
      rect(100, 100, 300, 300);
      fill(0);
      rect(110, 110, 280, 100);//resume button rect
      rect(110, 290, 280, 100);//main menu button rect
      fill(255);
      textStyle(BOLD);
      textSize(60);
      text('RESUME', 120, 180);//resume button text
      textSize(45);
      text('MAIN MENU', 120, 355);//Main menu button text
    }

    if (clientData.playerScore >= 10)
    {
      clientData.winner = 1;//sets the variable of who win to be used in the game over screen
      clientServerData.gamemode = 5;//sets the gamemode to 3 to display the gameover screen
    }
    //checks if computer reached 10 points
    if (clientData.computerScore >= 10)
    {
      clientData.winner = 2;
      clientServerData.gamemode = 5;
    }
  }
  //draws the gameover screen in multiplayer
  if (clientServerData.gamemode == 3)
  {
    //if player one is the winner
    if (clientServerData.winner == 1)
    {
      background(0);
      textSize(60);
      textStyle(NORMAL);
      fill(255);
      text("Player 1 wins", 80, 200);//draws player 1 wins text
      rect(150, 300, 200, 50);//main menu button
      textSize(30);
      fill(0);
      text("Main Menu", 178, 335)
    }
    //if player two is the winner
    else if(clientServerData.winner == 2)
    {
      background(0);
      textSize(60);
      textStyle(NORMAL);
      fill(255);
      text("Player 2 wins", 80, 200);//draws player 2 wins text
      rect(150, 300, 200, 50);//main menu button
      textSize(30);
      fill(0);
      text("Main Menu", 178, 335);
    }
  }
  //draws the gameover screen in singleplayer
  if (clientServerData.gamemode == 5)
  {
    //if the user is the winner
    if (clientData.winner == 1)
    {
      background(0);
      textSize(70);
      textStyle(NORMAL);
      fill(255);
      text("You win", 120, 200);//draws you win for the user wins text
      rect(150, 300, 200, 50);
      textSize(30);
      fill(0);
      text("Main Menu", 178, 335)
    }
    //if the computer is the winner
    else if(clientData.winner == 2)
    {
      background(0);
      textSize(65);
      textStyle(NORMAL);
      text("Computer wins", 40, 200);//draws computer wins for the user wins text
    }
  }


  //draws the instructions screen.
  if (clientServerData.gamemode == 4)
  {
    background(0);
    fill(255);
    textStyle(BOLD);
    textSize(85);
    text("Instructions", 10, 100);//title on the screen
    textStyle(NORMAL);
    textSize(20);
    //the whole instructions of them game
    text("-Move your paddle with the up and down arrow keys \n\n-Hit the ball with your paddle to prevent it from going in \nyour net.\n\n-First person to get 10 ponts wins!!", 10, 160);
    rect(150, 400, 200, 50);//main menu button
    textSize(30);
    fill(0);
    text("Main Menu", 178, 435);
  }
  //if there is only one person playing multiplayer
  if (ids.length < 2 && clientServerData.gamemode == 2)
  {
    waitingForOther();//function that draws waiting for other player
  }
  //draws the multiplayer gameboard
  else if (ids.length >= 2 && bothGameModes[0] == 2 && bothGameModes[1] == 2 && clientServerData.gamemode == 2)
  {
    clientServerData.multiplayerWaiting = false;
    background(0);
    strokeWeight(6);
    stroke(255);
    line(250, 0, 250, height);//draws line in the middle that seperates the two sides
    noStroke();
    fill(255);
    rect(20, clientServerData.paddle1Y, 20, 100);//draws player 1 paddle
    rect(width - 40, clientServerData.paddle2Y, 20, 100);//draws player 2 paddle
    textStyle(NORMAL);
    textSize(60);
    text(clientServerData.player1Score, 150, 450);//draws player 1 score
    text(clientServerData.player2Score, 300, 450);//draws player 2 score
    //draws the pause button
    fill(255);
    rect(50, 20, 40, 40);
    fill(0);
    rect(55, 25, 10, 30);
    rect(75, 25, 10, 30);

    fill(255);
    ellipse(clientServerData.ballX, clientServerData.ballY, 50, 50);//draws the ball
    multiplayerPaddle1Movement();//calls player 1 paddle movement
    multiplayerPaddle2Movement();//calls player 2 paddle movement
    //checks if a player is on the pause menu and draws the pause menu for that player only
    if (clientServerData.pause)
    {
      fill(255);
      rect(100, 100, 300, 300);
      fill(0);
      rect(110, 110, 280, 100);
      rect(110, 290, 280, 100);
      fill(255);
      textStyle(BOLD);
      textSize(60);
      text('RESUME', 120, 180);//resume button text
      textSize(45);
      text('MAIN MENU', 120, 355);//Main menu button text
    }
    //checks if player one reached 10 points
    if (clientServerData.player1Score >= 10)
    {
      clientServerData.winner = 1;//sets the variable of who win to be used in the game over screen
      clientServerData.gamemode = 3;//sets the gamemode to 3 to display the gameover screen

    }
    //checks if player two reached 10 points
    if (clientServerData.player2Score >= 10)
    {
      clientServerData.winner = 2;
      clientServerData.gamemode = 3;
    }
  }
  //if more than 1 player is connected but only one of them is playing multiplayer
  else if (ids.length >= 2)
  {
    //if player one is trying to play multiplayer but there is no player 2
    if (bothGameModes[0] == 2 && bothGameModes[1] != 2 && clientServerData.gamemode == 2)
    {
      waitingForOther();
    }
    //if player two is trying to play multiplayer but there is no player 1
    else if (bothGameModes[0] != 2 && bothGameModes[1] == 2 && clientServerData.gamemode == 2)
    {
      waitingForOther();
    }
  }
}



function changingGamemode() {
  socket.emit('changingGamemode', clientServerData);//emits message to server to notify it that the user is changing gamemodes
  clientServerData.previous = clientServerData.gamemode;//resets tje placeholder variable previous
}

//function that is executed when the 'updatedGamemodes' message comes from the server
function updatedGamemodes(loopingData) {
    //copies the array from the server containing all the client gamemodes into each client
    for (var i = 0; i < loopingData.gamemodes.length; i++)
    {
      bothGameModes[i] = loopingData.gamemodes[i];
    }
}

//function that is executed when the message 'sendData' is recieved from the server
function returnData(data) {
  if (data.users.length >= 2)
  {
    for(var i = 0; i < data.users.length; i++)
    {
      ids[i] = data.users[i];
    }
  }
  clientServerData.id = socket.id;
  bothGameModes.length = ids.length;
}

function returnLooping(loopingData) {
  if (clientServerData.gamemode == 2)
  {
    clientServerData.paddle1Y = loopingData.paddle1;
    clientServerData.paddle2Y = loopingData.paddle2;
    clientServerData.ballX = loopingData.ballX;
    clientServerData.ballY = loopingData.ballY;
    clientServerData.player1Score = loopingData.player1Score;
    clientServerData.player2Score = loopingData.player2Score;
  }

  if (socket.id == ids[0])
  {
    socket.emit('sendLooping1', clientServerData);
  }
  else if (socket.id == ids[1])
  {
    socket.emit('sendLooping2', clientServerData);
  }

  for (var i = 0; i < loopingData.gamemodes.length; i++)
  {
    bothGameModes[i] = loopingData.gamemodes[i];
  }
  //console.log(clientServerData);
}

function multiplayerPaddle1Movement() {
  if ((keyIsDown(UP_ARROW) && ids[0] == socket.id) && (keyIsDown(DOWN_ARROW) && ids[0] == socket.id))
  {
    clientServerData.p1Up = true;
    clientServerData.p1Down = true;
  }
  else if (keyIsDown(UP_ARROW) && ids[0] == socket.id)
  {
    clientServerData.p1Up = true;
    clientServerData.p1Down = false;
  }
  else if (keyIsDown(DOWN_ARROW) && ids[0] == socket.id)
  {
    clientServerData.p1Up = false;
    clientServerData.p1Down = true;
  }
  else
  {
    clientServerData.p1Up = false;
    clientServerData.p1Down = false;
  }
}

function multiplayerPaddle2Movement() {
  if ((keyIsDown(UP_ARROW) && ids[1] == socket.id) && (keyIsDown(DOWN_ARROW) && ids[1] == socket.id))
  {
    clientServerData.p2Up = true;
    clientServerData.p2Down = true;
  }
  else if (keyIsDown(UP_ARROW) && ids[1] == socket.id)
  {
    clientServerData.p2Up = true;
    clientServerData.p2Down = false;
  }
  else if (keyIsDown(DOWN_ARROW) && ids[1] == socket.id)
  {
    clientServerData.p2Up = false;
    clientServerData.p2Down = true;
  }
  else
  {
    clientServerData.p2Up = false;
    clientServerData.p2Down = false;
  }
}

function paddle1Collision(loopingData) {
  clientServerData.angle = map(loopingData.ballDiff, 0, 100, radians(-45), radians(45));
  socket.emit('paddle1Collision', clientServerData);
}

function paddle2Collision(loopingData) {
  clientServerData.angle = map(loopingData.ballDiff, 0, 100, radians(-100), radians(100));
  socket.emit('paddle2Collision', clientServerData);
}

function removeUser(socket) {
  for (var i = 0; i < ids.length; i++)
  {
    if (socket == ids[i])
    {
      bothGameModes[i] = (null);
    }
  }
  ids.splice(ids.indexOf(socket), 1);
}

function mousePressed() {
  if ((clientServerData.gamemode == 0) && (mouseX >= 250 && mouseX <= 350) && (mouseY >= 250 && mouseY <= 300))
  {
    clientServerData.gamemode = 2;
  }
  else if ((clientServerData.gamemode == 0) && (mouseX >= 145 && mouseX <= 245) && (mouseY >= 250 && mouseY <= 300))
  {
    clientServerData.gamemode = 1;
  }
  if ((clientServerData.gamemode == 0) && (mouseX >= 145 && mouseX <= 350) && (mouseY >= 305 && mouseY <= 355))
  {
    clientServerData.gamemode = 4;
  }
  if ((clientServerData.gamemode == 2) && (mouseX >= 50 && mouseX <= 90) && (mouseY >= 20 && mouseY <= 60))
  {
    clientServerData.pause = true;
  }
  if ((clientServerData.gamemode == 2) && clientServerData.pause && (mouseX >= 110 && mouseX <= 390) && (mouseY >= 110 && mouseY <= 210))
  {
    clientServerData.pause = false;
  }
  if ((clientServerData.gamemode == 2) && clientServerData.pause && (mouseX >= 110 && mouseX <= 390) && (mouseY >= 290 && mouseY <= 390))
  {
    clientServerData.pause = false;
    clientServerData.gamemode = 0;
  }
  if ((clientServerData.gamemode == 3) && (mouseX >= 150 && mouseX <= 350) && (mouseY >= 300 && mouseY <= 350))
  {
    clientServerData.gamemode = 0;
  }
  if ((clientServerData.gamemode == 4) && (mouseX >= 150 && mouseX <= 350) && (mouseY >= 400 && mouseY <= 450))
  {
    clientServerData.gamemode = 0;
  }
  if ((clientServerData.gamemode == 1) && (mouseX >= 50 && mouseX <= 90) && (mouseY >= 20 && mouseY <= 60))
  {
    clientData.pause = true;
  }
  if ((clientServerData.gamemode == 1) && clientData.pause && (mouseX >= 110 && mouseX <= 390) && (mouseY >= 110 && mouseY <= 210))
  {
    clientData.pause = false;
  }
  if ((clientServerData.gamemode == 1) && clientData.pause && (mouseX >= 110 && mouseX <= 390) && (mouseY >= 290 && mouseY <= 390))
  {
    clientData.pause = false;
    clientServerData.gamemode = 0;
  }
  if ((clientServerData.gamemode == 5) && (mouseX >= 150 && mouseX <= 350) && (mouseY >= 300 && mouseY <= 350))
  {
    clientServerData.gamemode = 0;
  }
  if ((clientServerData.gamemode == 2) && clientServerData.multiplayerWaiting && (mouseX >= 150 && mouseX <= 350) && (mouseY >= 300 && mouseY <= 350))
  {
    clientServerData.gamemode = 0;
  }
}



function collisionCheck(otherX, otherY, otherWidth, otherHeight) {
  return (clientData.ballX < otherX + otherWidth) && (clientData.ballY < otherY + otherHeight) && (clientData.ballX + 25 > otherX) && (clientData.ballY + 25 > otherY);
}

function singleplayerPaddleMovement() {
  if (keyIsDown(UP_ARROW))
  {
    clientData.paddle1Y -= clientData.paddleSpeed;
  }
  if (keyIsDown(DOWN_ARROW))
  {
    clientData.paddle1Y += clientData.paddleSpeed;
  }

  if (clientData.paddle1Y < 0)
  {
    clientData.paddle1Y = 0;
  }
  else if (clientData.paddle1Y > height - 100)
  {
    clientData.paddle1Y = height - 100;
  }
}

function computerPaddleMovement() {
  clientData.computerPaddleY = clientData.ballY - 100/2;
  //console.log(clientData.computerPaddleY);
}

function ball() {
  clientData.ballX += clientData.ballSpeedX;
  clientData.ballY += clientData.ballSpeedY;
}

function edges() {
  if (clientData.ballY < 0 + 25 || clientData.ballY > height - 25)
  {
    clientData.ballSpeedY *= -1;
  }
  if (clientData.ballX < 0 + 25 )
  {
    clientData.computerScore++;
    reset();
  }
  if (clientData.ballX > width - 25)
  {
    clientData.playerScore++;
    reset();
  }
}

function waitingForOther() {
  clientServerData.multiplayerWaiting = true;
  background(0);
  fill(255);
  textSize(40);
  textStyle(NORMAL);
  text("Waiting for other player", 35, 250);
  fill(255);
  rect(150, 300, 200, 50);
  textSize(30);
  fill(0);
  text("Main Menu", 178, 335);
}

function reset() {
  clientData.ballX = 250;//centers the ball in x
  clientData.ballY = 250;//centers the ball in y
  clientData.angle = random(-PI/4, PI/4) //chooses random angle for ball
  clientData.ballSpeedX = 5 * cos(clientData.angle);
  clientData.ballSpeedY = 5 * sin(clientData.angle);
  if (random(2) < 1)
  {
    clientData.ballSpeedX *= -1;
  }
}
