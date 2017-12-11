let webCam;
let ypix = [];
let scanner;
let penNo = 15;
let penAngle = 25;

let goingRight = true;

let gap;

let pens = [];

var serial;          // variable to hold an instance of the serialport library
var portName = '/dev/cu.usbmodem1411'; // fill in your serial port name here


function setup() {
  serial = new p5.SerialPort();    // make a new instance of the serialport library
  serial.on('list', printList);    // set a callback function for the serialport list event
  serial.on('connected', serverConnected); // callback for connecting to the server
  serial.on('open', portOpen);     // callback for the port opening
  serial.on('data', serialEvent);  // callback for when new data arrives
  serial.on('error', serialError); // callback for errors
  serial.on('close', portClose);   // callback for the port closing

  serial.list();                   // list the serial ports
  serial.open(portName);           // open a serial port

  createCanvas(500, 700);
  webCam = createCapture(VIDEO);
  webCam.size(480, 340);
  webCam.hide();

  scanner = webCam.width / 2;

  let newCanv = height / 2 + 10;

  gap = webCam.height / penNo;

  for (let i = 0; i < penNo; i++){
    pens[i] = new scribble(newCanv + (gap * i) + gap / 2);
  }

  frameRate(60);

}

function draw() {
  background(255);
  webCam.loadPixels();

  let screenWidth = int(webCam.width * 3/4);
  let screenHeight = int(webCam.height * 3/4);
  let webCamFlipped = [];


  // for (let i = 0; i < webCam.height; i++){
  //   for(let j = 0; j < webCam.width; j++) {
  //     let offset1 = int(((i * webCam.width) + j) * 4);
  //     let offset2 = int((((i + 1) * webCam.width) - j) * 4);
  //     webCamFlipped[offset2] = webCam.pixels[offset1];
  //   }
  // }
  //
  // for (let i = 0; i < webCam.pixels.length; i++) {
  //   webCam.pixels[i] = webCamFlipped[i];
  // }
  // webCam.updatePixels();

  push();
  translate(width / 2 - screenWidth / 2, 350 / 2 - screenHeight / 2);
  image(webCam, 0, 0, screenWidth, screenHeight);
  blendMode(SCREEN);
  strokeWeight(5);
  stroke(255,0,0);
  line(scanner * 3/4, 0, scanner * 3/4, screenHeight);
  blendMode(BLEND);
  strokeWeight(1);
  stroke(255,0,0);
  line(scanner * 3/4, 0, scanner * 3/4, screenHeight);
  pop();


  for (let i = 0; i < penNo; i++) {
    let offset = int(((gap / 2 * webCam.width) + (i * gap * webCam.width) + scanner) * 4);
    let redc = webCam.pixels[offset];
    let greenc = webCam.pixels[offset + 1];
    let bluec = webCam.pixels[offset + 2];

    // let neg = 255 - greenc;

    ypix[i] = 255-greenc;
  }

  var ypixMin = Math.min.apply(null, ypix);
  var ypixMax = Math.max.apply(null, ypix);


  for (let i = 0; i < ypix.length; i++) {

    ypix[i] = map(ypix[i], ypixMin, 255, 0, penAngle);
    ypix[i] = Math.max(0, ypix[i]-10);


    serial.write(ypix[i]);
    print(ypix[i]);
    serial.write(",");
  }

  serial.write("/n");

  for (let i = 0; i < pens.length; i++){
    pens[i].newPoint(ypix[i]);
    pens[i].pointsUpdate();
    pens[i].lineDisplay();
  }

  // push();
  // translate(width / 2, height / 2);
  // for (let i = 0; i < ypix.length; i++){
  //   noStroke();
  //   fill(col[i]);
  //   ellipse(0, ((height / 2) / (penNo + 1)) * i, penAngle, penAngle);
  // }
  // pop();

  // serial.write("ready");

  if( goingRight == true){
    scanner += 0;
  }

  if( goingRight != true){
    scanner -= 0;
  }

  if (scanner >= webCam.width - 2 || scanner <= 2){
    goingRight = !goingRight;
  }
}

function serialEvent() {

}

class scribble {
  constructor(_y) {
    this.vertexX = [];
    this.vertexY = [];
    this.startY = _y;
    this.sp = 1;
  }

  newPoint(_y) {
    this.vertexX.push(width);
    this.vertexY.push(_y);
  }

  pointsUpdate() {
    if (this.vertexX.length >= width / this.sp){
      this.vertexX.shift();
      this.vertexY.shift();
    }

    for (let i = 0; i < this.vertexX.length; i++){
      this.vertexX[i] -= this.sp;
    }
  }

  lineDisplay() {
    strokeWeight(1);
    stroke(0), 150;
    noFill();
    push();
    translate(0, this.startY);

    beginShape();
    for (let i = 0; i < this.vertexX.length; i++) {
      vertex(this.vertexX[i] - this.sp*0.8, this.vertexY[i]);
      vertex(this.vertexX[i], -this.vertexY[i]);
    }
    endShape();
    pop();

  }
}

function printList(portList) {
  // portList is an array of serial port names
  for (var i = 0; i < portList.length; i++) {
  // Display the list the console:
  print(i + " " + portList[i]);
  }
}

function serverConnected() {
  print('connected to server.');
}

function portOpen() {
  print('the serial port opened.')
}

function serialError(err) {
  print('Something went wrong with the serial port. ' + err);
}

function portClose() {
  print('The serial port closed.');
}
