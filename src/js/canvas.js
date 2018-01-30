var mousePressed = false;
var lastX, lastY;
var ctx;
var drawing = false;
var prevImg;

class gameImage {
  constructor(author, roundNumber, imageUrl) {
    this.author = author;
    this.roundNumber = roundNumber;
    this.imageUrl = imageUrl;
    this.guess = "";
  }
}

function InitThis() {
    ctx = document.getElementById('myCanvas').getContext("2d");

    $('#myCanvas').mousedown(function (e) {
        mousePressed = true;

        if(drawing){Draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, false);}
    });

    $('#myCanvas').mousemove(function (e) {
        if (mousePressed) {
            if(drawing){Draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, true);}
        }
    });

    $('#myCanvas').mouseup(function (e) {
        mousePressed = false;
    });
	    $('#myCanvas').mouseleave(function (e) {
        mousePressed = false;
    });
  }



function Draw(x, y, isDown) {
    if (isDown) {
        ctx.beginPath();
        ctx.strokeStyle = $('#selColor').val();
        ctx.lineWidth = $('#selWidth').val();
        ctx.lineJoin = "round";
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.stroke();
    }
    lastX = x; lastY = y;

}

function clearArea() {
  ctx = document.getElementById('myCanvas').getContext("2d");
    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function save() {
    ctx = document.getElementById('myCanvas').getContext("2d");
    var dataURL = ctx.canvas.toDataURL();
    var newImage = new gameImage(myUsername,currentRound,dataURL);
    socket.emit('save image', newImage);
}

function displayImage(url){
  drawingPlaceholder = $('#drawingPlaceholder');
  document.getElementById("drawingPlaceholder").innerHTML = "";
  drawingPlaceholder.append('<img id="leftsideDrawing" src="'+url+'"></img>');
}
