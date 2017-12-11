let webCam;
let amplitude = [];
let sscan = [];
let ypix = []
let amplitudeP = [];
let scanner;
let penNo = 15;
let penAngle = 25;
let marginH = 60;
let inData;
let newCanv;
let thresh;

let goingRight = true;

let gap;
let yres;

let pens = [];
let scans = [];

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

  createCanvas(windowWidth, windowHeight);

  thresh = createSlider(1, 12, 5);
  thresh.position(15, height - 15);
  thresh.style('width', '80px');

  webCam = createCapture(VIDEO);
  webCam.size(640, 480);
  webCam.hide();

  scanner = webCam.width / 3;

  newCanv = height / 2 - webCam.height / 2;

  gap = webCam.height / penNo;
  yres = webCam.height;

  //creating array of arrays called 'ypix'. each pixel in a column at
  // webCam.width / 3 from webcam is recorded and stored in an array for each
  // frame/ buffer is 480 frames long
  for (let i = 0; i < yres; i++){
    ypix[i] = [];
    for (j = 0; j < yres; j++){
      ypix[i][j] = j % 255;
    }
  }



  for (let i = 0; i < penNo; i++){
    pens[i] = new scribble(newCanv + gap / 2 + gap * i);
  }

  for (let i = 0; i < yres; i++){
    scans[i] = new column();
  }

}

function draw() {
  background(200);
  webCam.loadPixels();

  push();
  scale(-1,1);
  translate(-width, 0);

  text(frameCount, 60, 60)

  let originalPix = webCam.pixels;

  for (let i = 0; i < webCam.pixels.length; i++) {
    let lum = int(
      (originalPix[i] * 0.213) +
      (originalPix[i+1] * 0.715) +
      (originalPix[i+2] * 0.072)
    );

    lum = lum * 1.5 - (255 / 3)

    webCam.pixels[i] = lum;
    i++;
    webCam.pixels[i] = lum;
    i++;
    webCam.pixels[i] = lum;
    i++;
  }

  webCam.updatePixels();

  ypix.shift();
  ypix[ypix.length] = [];

  for (let i = 0; i < yres; i++){
    let offset = int((((gap / 2 + gap * i) * webCam.width) + scanner) * 4);
    let pixval = webCam.pixels[offset];
    ypix[ypix.length][i] = pixval;
  }

  let penStart = 0;
  for (let i = 0; i < penNo; i++) {
    amplitude[i] = 255 - ypix[penStart][int(i * gap - gap / 2)];
  }

  for (let i = 0; i < yres; i++) {
    sscan[i] = ypix[ypix.length - 20][i];
  }
  //
  // let amplitudeMin = Math.min.apply(null, amplitude);
  // let amplitudeMax = Math.max.apply(null, amplitude);


  for (let i = 0; i < amplitude.length; i++) {

    amplitudeP[i] = map(amplitude[i], 0, 255, 0, gap / 2);
    // amplitude[i] = map(amplitude[i], 0, 255, 0, penAngle);
    // amplitude[i] = map(amplitude[i], amplitudeMin, 255, 0, penAngle);
    // amplitude[i] = Math.max(0, amplitude[i]-10);


    serial.write(amplitude[i]);
    // print(amplitude[i]);

    serial.write(",");
  }
  serial.write("\n");

  scans.push(new column);

  for (let i = 0; i < sscan.length; i++){
    scans[scans.length-1].newPix(sscan[i]);
  }


  let rectOffset = 10;

  push();
  rectMode(CORNER);
  translate(marginH, height / 2 - (webCam.height / 2));
  noStroke();
  fill(255);
  rect(webCam.width / 2, 0, webCam.width / 2, webCam.height);
  rect(
    -rectOffset, -rectOffset, width - (marginH * 2 - rectOffset * 2),
    webCam.height + rectOffset * 2
  );

  let factor = 8;

  for (let i = 0; i < scans.length; i+= factor){
    scans[i].pixDisplay(factor);
  }

  push();
  image(
    webCam, 0, 0, scanner, webCam.height,
    0, 0, scanner, webCam.height
  );
  pop();
  fill(255);
  noStroke();
  blendMode(SCREEN);
  strokeWeight(6);
  stroke(255);
  line(scanner, 0, scanner, webCam.height);
  blendMode(BLEND);
  strokeWeight(2);
  stroke(255);
  line(scanner, 0, scanner, webCam.height);
  pop();

  for (let i = 0; i < pens.length; i++){
    pens[i].newPoint(amplitudeP[i]);
    pens[i].pointsUpdate(thresh.value());
    pens[i].lineDisplay();
  }

  if (scans.length > 480){
    scans.shift();
  }

  // text("incoming value: " + inData, 30, 30);
  pop();
}

class column {
  constructor() {
    this.vertexX = scanner;
    this.rgbVal = [];
    this.fc1 = frameCount;
  }

  newPix(_p) {
    this.rgbVal.push(_p);
  }

  pixDisplay(_res) {
    this.res = _res;
    this.sp = _res;
    this.fc2 = this.fc1 + this.sp;

    noStroke();
    if (frameCount > this.fc2) {
      this.vertexX += this.sp;
      this.fc1 = frameCount;
    }
    for (let i = 0; i < this.rgbVal.length; i += this.res) {
      fill(this.rgbVal[i], this.rgbVal[i], this.rgbVal[i]);
      rect(this.vertexX, i, this.res, this.res);
    }
  }
}

class scribble {
  constructor(_y) {
    this.vertexX = [];
    this.vertexY = [];
    this.startY = _y;
  }

  newPoint(_y) {
    this.vertexX.push(width / 2);
    this.vertexY.push(_y);
  }

  pointsUpdate(_sp) {
    this.sp = _sp;
    if (this.vertexX.length >= (webCam.width / 4 - 50) / this.sp){
      this.vertexX.shift();
      this.vertexY.shift();
    }

    for (let i = 0; i < this.vertexX.length; i++){
      this.vertexX[i] += this.sp;
    }
  }

  lineDisplay() {
    strokeWeight(1);
    stroke(0);
    noFill();
    push();
    translate(0, this.startY);

    beginShape();
    for (let i = 0; i < this.vertexX.length; i++) {
      curveVertex(this.vertexX[i] - 3, this.vertexY[i]);
      curveVertex(this.vertexX[i] - 6, this.vertexY[i]);

      curveVertex(this.vertexX[i] - 3, -this.vertexY[i]);
      curveVertex(this.vertexX[i] - 6, -this.vertexY[i]);
    }
    endShape();
    pop();

  }
}

function serialEvent() {
  // read a byte from the serial port:
  var inByte = serial.read();
  // store it in a global variable:
  inData = inByte;
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
