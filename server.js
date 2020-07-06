//!!!!!!!!!!!!!!!!!!! This vid teaches node.js basics (part 1 of series) https://www.youtube.com/watch?v=bjULmG8fqc8
//!!!!!!!!!!!!!!!!!!! This is cheatsheet https://socket.io/docs/emit-cheatsheet/
var express = require('express'); //dependency required to setup server
var app = express(); //puts the express directory into variable so it can be called like a function
var server = app.listen(process.env.PORT || 8080); //sets the port of server
//variables that take care of keeping track of clients on the server
var data = {
  users: [],
  emptyCount: false,
  emptyCount2: 0
}
//variables that take care of the constant changing gae events
var socketlist = []
var loopingData = {
  gamemodes: [],
  paddle1: 200,
  paddle2: 200,
  paddleSpeed: 14,
  ballX: 250,
  ballY: 250,
  ballSpeedX: 4,
  ballSpeedY: 1,
  player1Score: 0,
  player2Score: 0,
  ballDiff: 0,
  angle: 0,
  rejoin: false,
}



app.use(express.static('public')); //calls the public directory that contains the p5 file
console.log("Server is running"); //prints to cmd indicating that server is running

var socket = require('socket.io'); //dependency that lets every client have a socket that the client and server can communicate through
var io = socket(server); //puts the socket directory in a variable using server aspects so it can be called as a variable
io.sockets.on('connection', function(socket) { //function that starts every time a client is connected
  console.log("User connected " + socket.id); //writes to server console that a user connected and outputs socket id of client that has connected
  console.log(""); //prints an empty line in server console
  //Checks to see if there are empty spots in the users array and puts the new clients in
  for (var i = 0; i < data.users.length; i++)
  {
    if (data.users[i] == null)
    {
      data.users.splice(i, 1, socket.id);
      socketlist.splice(i, 1, socket);
      data.emptyCount = true;
      break;
    }
  }
  //if there are no empty spots then it pushes the new client to the end of the array
  if (!data.emptyCount)
  {
    data.users.push(socket.id); //adds the
    socketlist.push(socket);
  }
  data.emptyCount = false; //resets the variable

  loopingData.gamemodes.length = data.users.length;//sets the array of client gamemodes to the same length as the # of client connected
  io.sockets.emit('sendData', data);//sends the array of connected clients to all clients

  socket.on('changingGamemode', function(clientServerData) { //inner function that initiates when server recieves 'changinggamemodes' messages from clients
    //Checks if one of the 2 main players is reconnecting to a multiplayer game
    if (loopingData.gamemodes[0] == 2 && loopingData.gamemodes[1] == 2 && (clientServerData.id == data.users[0] || clientServerData.id == data.users[1]) && clientServerData.gamemode != 2)
    {
      loopingData.rejoin = true
    }
    //puts the gamemode of each client in its correct spod in the array
    for (var i = 0; i < data.users.length; i++)
    {
      if (clientServerData.id == data.users[i])
      {
        loopingData.gamemodes.splice(i, 1, clientServerData.gamemode);
      }
    }
    //resets the gameboard
    if (data.users.length == 2 && !loopingData.rejoin && loopingData.gamemodes[0] == 2 && loopingData.gamemodes[1] == 2)
    {
      loopingData.paddle1 = 200;
      loopingData.paddle2 = 200;
      loopingData.ballX = 250;
      loopingData.ballY = 250;
      loopingData.angle = Math.random() * (Math.PI/4 + Math.PI/4) - Math.PI/4;//chooses a random angle for the ball to start at
      loopingData.ballSpeedX = 12 * Math.cos(loopingData.angle);//sets the xspeed in relation with the angle
      loopingData.ballSpeedY = 12 * Math.sin(loopingData.angle);//sets the yspeed in relation with the angle
      //to make the ball randomly choose which side it will point to
      if ((Math.random() * (2 - 0) + 0) < 1)
      {
        loopingData.ballSpeedX *= -1;
      }
      loopingData.player1Score = 0;
      loopingData.player2Score = 0;
      io.sockets.emit('sendLooping', loopingData);//starts the main loop
    }
    //resets the gameboard if one of the main players is rejoining
    else if (loopingData.rejoin && loopingData.gamemodes[0] == 2 && loopingData.gamemodes[1] == 2 && (clientServerData.id == data.users[0] || clientServerData.id == data.users[1]))
    {
      loopingData.paddle1 = 200;
      loopingData.paddle2 = 200;
      loopingData.ballX = 250;
      loopingData.ballY = 250;
      loopingData.angle = Math.random() * (Math.PI/4 + Math.PI/4) - Math.PI/4;
      loopingData.ballSpeedX = 12 * Math.cos(loopingData.angle);
      loopingData.ballSpeedY = 12 * Math.sin(loopingData.angle);
      if ((Math.random() * (2 - 1) + 1) == 1)
      {
        loopingData.ballSpeedX *= -1;
      }
      loopingData.player1Score = 0;
      loopingData.player2Score = 0;
    }
    io.sockets.emit('updatedGamemodes', loopingData);//sends a message to all clients to update their gamemode arrays
  });

  //Server loop coming from player 1
  socket.on('sendLooping1', function(clientServerData) {
    //checks for player one moving up
    if (clientServerData.p1Up && !clientServerData.p1Down)
    {
      loopingData.paddle1 -= loopingData.paddleSpeed;
    }
    //checks for player one moving down
    else if (!clientServerData.p1Up && clientServerData.p1Down)
    {
      loopingData.paddle1 += loopingData.paddleSpeed;
    }

    //limits player 1 paddle from going of the top of screen
    if (loopingData.paddle1 < 0)
    {
      loopingData.paddle1 = 0;
    }
    //limits player 1 paddle from going of the bottom of screen
    else if (loopingData.paddle1 > 500 - 100)
    {
      loopingData.paddle1 = 500 - 100;
    }

    loopingData.ballX += loopingData.ballSpeedX;//moves the ball based on its xspeed
    loopingData.ballY += loopingData.ballSpeedY;//moves the ball based on its yspeed

    //checks if the ball is hitting the top or the bottom in order to bounce it off
    if (loopingData.ballY < 0 + 25 || loopingData.ballY > 500 - 25)
    {
      loopingData.ballSpeedY *= -1;//reverts the yspeed of the ball
    }
    //checks of the ball goes into the goal of player 1
    if (loopingData.ballX < 0 + 25)
    {
      loopingData.player2Score++;//increases player 1 score
      reset();//calls the reset function which resets the ball
    }
    //checks of the ball goes into the goal of player 2
    else if (loopingData.ballX > 500 - 25)
    {
      loopingData.player1Score++;//increases player 2 score
      reset();//calls the reset function which resets the ball
    }
    //checks collision with player 1 paddle
    if (collisionCheck(40, loopingData.paddle1, 20, 100))
    {
      if (loopingData.ballX > 40)//condition so the ball doesn't glitch through paddle
      {
        loopingData.angle = Math.random() * ((Math.PI/4) + (Math.PI/4)) - (Math.PI/4); //chooses an angle at which the ball will bounce back at
        loopingData.ballSpeedX = 12 * Math.cos(loopingData.angle); //makes the ballspeedX 5 * cos of the angle because of trigonometry rules
        loopingData.ballSpeedY = 12 * Math.sin(loopingData.angle);//makes the ballspeedY 5 * sin of the angle because of trigonometry rules
        loopingData.ballX = 20 + 20 + 25;//also making sure the ball doesn't glich into the paddle
      }
    }
    //checks collision with player 1 paddle
    if (collisionCheck(500 - 40, loopingData.paddle2, 20, 100))
    {
      if (loopingData.ballX < 500-40)
      {
        loopingData.angle = Math.random() * ((5 * Math.PI/4) - (3*Math.PI/4)) + (3 * Math.PI/4);
        loopingData.ballSpeedX = 12 * Math.cos(loopingData.angle);
        loopingData.ballSpeedY = 12 * Math.sin(loopingData.angle);
        loopingData.ballX = 500-40 - 25;
      }
    }

    io.sockets.emit('sendLooping', loopingData);//sends looping to all clients so they can update the ball and paddles on their screen
  });

  //server loop coming from player 2
  socket.on('sendLooping2', function(clientServerData) {
    //checks for player two moving up
    if (clientServerData.p2Up && !clientServerData.p2Down)
    {
      loopingData.paddle2 -= loopingData.paddleSpeed;
    }
    //checks for player two moving down
    else if (!clientServerData.p2Up && clientServerData.p2Down)
    {
      loopingData.paddle2 += loopingData.paddleSpeed;
    }
    //limits player 2 paddle from going of the top of screen
    if (loopingData.paddle2 < 0)
    {
      loopingData.paddle2 = 0;
    }
    //limits player 2 paddle from going of the bottom of screen
    else if (loopingData.paddle2 > 500 - 100)
    {
      loopingData.paddle2 = 500 - 100;
    }
  });
  //checks for player disconnection
  socket.on('disconnect', function() {
    console.log("");//logs empty line in server
    console.log("User disconnected " + socket.id);//logs which user disconnected
    io.sockets.emit('removeUser', socket.id);//sends message to all clients to remove user from their users array


    //checks if one of the main players disconnects and if their was a game going on
    if ((socket.id == data.users[0]  || socket.id == data.users[1]) && loopingData.gamemodes[0] == 2 && loopingData.gamemodes[1] == 2)
    {
      for (var i = 0; i < socketlist.length; i++)
      {
        //iterates through connected clients array to see which was in the game
        if (loopingData.gamemodes[i] == 2)
        {
          socketlist[i].disconnect();//disconnects all players that were in the game to prevent gliches
          socketlist[i] = null;//removes that client from socket list array
          data.users[i] = null;//removes that client from users list array
          loopingData.gamemodes[i] = null;//removes that client from gamemodes list array
        }
      }
    }
    //if it wasn't a main player then it removes them normally without disconneting everyone
    else
    {
      for (var i = 0; i < data.users.length; i++)
      {
        if (socket.id == data.users[i])
        {
          loopingData.gamemodes[i] = null;
          data.users[i] = null
        }
      }
    }
    //checks how many values in the users array is empty
    for (var i = 0; i < data.users.length; i++)
    {
      if (data.users[i] == null)
      {
        data.emptyCount2++;
      }
    }
    //if all array is null values then server clear array for less memory usage
    if (data.emptyCount2 == data.users.length)
    {
      data.users = [];
    }
  });
});

//function that resets the ball after one of players gets a point
function reset() {
  loopingData.ballX = 250;//centers the ball in x
  loopingData.ballY = 250;//centers the ball in y
  loopingData.angle = Math.random() * (Math.PI/4 + Math.PI/4) - Math.PI/4;//chooses random angle for ball
  loopingData.ballSpeedX = 12 * Math.cos(loopingData.angle);
  loopingData.ballSpeedY = 12 * Math.sin(loopingData.angle);
  if ((Math.random() * (2 - 0) + 0) < 1)
  {
    loopingData.ballSpeedX *= -1;
  }
}
//collisionCheck function
function collisionCheck(otherX, otherY, otherWidth, otherHeight) {
  return (loopingData.ballX < otherX + otherWidth) && (loopingData.ballY < otherY + otherHeight) && (loopingData.ballX + 25 > otherX) && (loopingData.ballY + 25 > otherY);
}
