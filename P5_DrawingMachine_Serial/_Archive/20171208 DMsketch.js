let webCam;
let amplitude = [];
let sscan = [];
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

  scanner = webCam.width / 2;

  newCanv = height / 2 - webCam.height / 2;

  gap = webCam.height / penNo;
  yres = 480;

  for (let i = 0; i < penNo; i++){
    pens[i] = new scribble(newCanv + gap / 2 + gap * i);
  }

  for (let i = 0; i < int(320 / thresh.value()); i++){
    scans[i] = new column();
  }

  frameRate(60);

}

function draw() {
  background(200);
  webCam.loadPixels();

  push();
  scale(-1,1);
  translate(-width, 0);

  // let screenWidth = int(webCam.width * 3/4);
  // let screenHeight = int(webCam.height * 3/4);



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
  // for (let i = 0; i < webCam.pixels.length; i++) {
  //   if(webCam.pixels[i] < 84) {webCam.pixels[i] = 0;}
  //   if(webCam.pixels[i] >= 85 && webCam.pixels[i] < 169) {webCam.pixels[i] = 128;}
  //   if(webCam.pixels[i] > 170) {webCam.pixels[i] = 255;}
  // }

  // Y=0.2126R+0.7152G+0.0722B

  let originalPix = webCam.pixels;

  // for (let y = 0; y < webCam.height; y++) {
  //   for (let x = 0; x < webCam.width; x++) {
  //     let offsetF = int(
  //       (y * webCam.width + x) * 4
  //     )
  //     let offsetB = int(
  //       ((y + 1) * webCam.width - (x+1)) * 4
  //     )
  //     webCam.pixels[offsetF] = originalPix[offsetB];
  //     webCam.pixels[offsetF + 1] = originalPix[offsetB + 1];
  //     webCam.pixels[offsetF + 2] = originalPix[offsetB + 2];
  //   }
  // }

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

    // i++;
    // webCam.pixels[i] = originalPix[i-1];
    // i++;
    // webCam.pixels[i] = originalPix[i-2];
    // i++;
  }

  webCam.updatePixels();

  for (let i = 0; i < penNo; i++) {
    let offset = int((((gap / 2 + gap * i) * webCam.width) + scanner) * 4);
    let greenc = webCam.pixels[offset + 1];
    amplitude[i] = 255-greenc;
  }

  for (let i = 0; i < yres; i++) {
    let offset = int(((i * webCam.width) + scanner) * 4);
    let greenc = webCam.pixels[offset + 1];
    sscan[i] = int(round(greenc/10) * 10);
  }

  let amplitudeMin = Math.min.apply(null, amplitude);
  let amplitudeMax = Math.max.apply(null, amplitude);


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


  let rectOffset = 10;

  push();
  rectMode(CORNER);
  // translate(width / 2 - webCam.width / 2, newCanv + newCanv / 2 - webCam.height / 2);
  // translate(width / 2 - webCam.width / 2, 10);
  translate(marginH, height / 2 - (webCam.height / 2));
  // stroke(0);
  // noFill();
  noStroke();
  fill(255);
  rect(webCam.width / 2, 0, webCam.width / 2, webCam.height);
  rect(
    -rectOffset, -rectOffset, width - (marginH * 2 - rectOffset * 2),
    webCam.height + rectOffset * 2
  );

  for(let i = 0; i < yres; i++){
    scans[scans.length - 1].newPix(sscan[i]);
  }

  for (let i = 0; i < scans.length; i++){
    scans[i].pixDisplay(thresh.value());
  }
  push();
  image(
    webCam, 0, 0, webCam.width / 2, webCam.height,
    0, 0, webCam.width / 2, webCam.height
  );
  pop();
  fill(255);
  noStroke();
  // blendMode(SCREEN);
  // strokeWeight(8);
  // stroke(255,0,0);
  // line(scanner, 0, scanner, webCam.height);
  blendMode(SCREEN);
  strokeWeight(6);
  stroke(255);
  line(scanner, 0, scanner, webCam.height);
  blendMode(BLEND);
  strokeWeight(2);
  stroke(255);
  line(scanner, 0, scanner, webCam.height);
  pop();


  scans.push(new column);
  scans.shift();

  for (let i = 0; i < pens.length; i++){
    pens[i].newPoint(amplitudeP[i]);
    pens[i].pointsUpdate(thresh.value());
    pens[i].lineDisplay();
  }

  // push();
  // translate(width / 2, height / 2);
  // for (let i = 0; i < amplitude.length; i++){
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
    scanner -= 2;
  }

  if (scanner >= webCam.width - 2 || scanner <= 2){
    goingRight = !goingRight;
  }



  // text("incoming value: " + inData, 30, 30);
  pop();
}

class column {
  constructor() {
    this.vertexX = webCam.width / 2;
    this.rgbVal = [];
    for (let i = 0; i < yres; i++) {
      this.rgbVal[i] = 255;
    }
  }

  newPix(_p) {
    this.rgbVal.push(_p);
    this.rgbVal.shift();
  }

  pixDisplay(_res) {
    this.res = _res;
    this.sp = 6;
    this.vertexX += this.sp;

    noStroke();
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
