const tempo = 100;
const colNum = 1;
const marginTop = 51; 
const offwidth = 20;
let globalR, globalG, globalB, bgCol, colorValue;
let rSw = true, gSw = true, bSw = true;
let currentVolume = 0;

let bufferLength;

class Particle {
  constructor(r, g, b){
    this.x = random(0, width);
    this.y = random(0, height);
    this.r = r;
    this.g = g;
    this.b = b;
    this.d = 2;
    this.xSpeed = random( -(map(tempo, 2000, 250, 1, 4)), (map(tempo, 2000, 250, 1, 4)));
    this.ySpeed = random( -(map(tempo, 2000, 250, 1, 4)), (map(tempo, 2000, 250, 1, 4)));
  }
  createParticle() {
    noStroke();
    noFill();
    circle(this.x,this.y,this.d);
  }
  moveParticle() {
    if(this.x < 0 || this.x > width)
      this.xSpeed*=-1;
    if(this.y < 0 || this.y > height)
      this.ySpeed*=-1;
    this.x+=this.xSpeed;
    this.y+=this.ySpeed;
  }
  joinParticles(particles, r, g, b) {
    particles.forEach(element =>{
      let dis = dist(this.x,this.y,element.x,element.y);
      if(dis<150) {
        strokeWeight(1);
        stroke('rgb(' + r + ',' + g + ',' + b + ')');
        line(this.x,this.y,element.x,element.y);
      }
    });
  }
}

let particles = [];

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('visualizer');
  getAudioInputs();

  background(10);
  frameRate(24);
  colorValue = [255, 120, 200, 90, 0, 24, 130, 130, 130];

  globalR = floor(random(colorValue[3], colorValue[0]));
  globalG = floor(random(colorValue[4], colorValue[1]));
  globalB = floor(random(colorValue[5], colorValue[2]));

  for(let i = 0;i<width/20;i++){
    particles.push(new Particle(globalR, globalG, globalB));
  }
  bgCol = color( colorValue[6], colorValue[7], colorValue[8], 8);

}


function draw() {
  background(bgCol);

  for(let i = 0;i<particles.length;i++) {
    particles[i].createParticle();
    particles[i].moveParticle();
    particles[i].joinParticles(particles.slice(i), globalR, globalG, globalB);
  }

  if (globalR >= colorValue[0]) {rSw = false;}
  if (globalR <= colorValue[3]) {rSw = true;}
  if (globalG >= colorValue[1]) {gSw = false;}
  if (globalG <= colorValue[4]) {gSw = true;}
  if (globalB >= colorValue[2]) {bSw = false;}
  if (globalB <= colorValue[5]) {bSw = true;}

    if (rSw){globalR = globalR + colNum;
    } else {globalR = globalR - colNum;}
    if (gSw){globalG = globalG + colNum;
    } else {globalG = globalG - colNum;}
    if (bSw){globalB = globalB + colNum;
    } else {globalB = globalB - colNum;}

    // console.log(globalR, globalG, globalB);

      // Draw waveform
      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
        
        // Calculate the volume
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        // Set the stroke width based on the volume
        strokeWeight(1 + currentVolume);
        console.log(currentVolume);
        
        stroke(30);
        fill(30);
        beginShape();
        curveVertex(0, height / 2 -10);
        for (let i = 0; i < bufferLength; i++) {
          const x = map(i, 0, bufferLength, 0, width);
          const y = map(dataArray[i], 0, 255, height, 0);
          const offset1 = offwidth * Math.sin((Math.PI * i) / bufferLength);
          curveVertex(x, y - offset1);
        }
        curveVertex(width, height / 2 -10);
        curveVertex(width, height / 2 +10);
        for (let ii = 0; ii < bufferLength; ii++) {
            let reversedIndex = bufferLength - ii;
            const x2 = map(reversedIndex, 0, bufferLength, 0, width);
            const y2 = map(dataArray[reversedIndex], 0, 255, height, 0);
            const offset2 = offwidth * Math.sin((Math.PI * reversedIndex) / bufferLength);
            curveVertex(x2, y2 + offset2);
          }
        curveVertex(0, height / 2 +10);
        endShape();
    }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Function to get available audio input devices
async function getAudioInputs() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    const select = document.getElementById('input-microphone');
    
    // Clear previous options
    select.innerHTML = '';
    
    // Populate dropdown with device names
    audioInputs.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Microphone ${index + 1}`;
      select.appendChild(option);
    });
  
    // Automatically use the first available audio input
    if (select.options.length > 0) {
      switchAudioInput(select.options[0].value);
    }
  }
  
  // Function to switch audio input
  async function switchAudioInput(deviceId) {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop()); // Stop previous stream
    }
  
    // Get new stream with selected device
    currentStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId ? { exact: deviceId } : undefined },
    });
  
    // Analyze the audio stream
    if (!audioContext) {
        console.error('audioContext is not defined');
        return;
    }
    
    const source = audioContext.createMediaStreamSource(currentStream);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 2048;
    bufferLength = analyser.fftSize;
    dataArray = new Uint8Array(bufferLength);
  }
  
  // Event listener for dropdown change
  document.getElementById('input-microphone').addEventListener('change', (event) => {
    switchAudioInput(event.target.value);
  });

  function updateVolumeLevel() {
    requestAnimationFrame(updateVolumeLevel);
    analyser.getByteFrequencyData(dataArray);
    currentVolume = dataArray.reduce((a, b) => a + b) / dataArray.length;
    document.getElementById('volume-level').innerText = `Volume: ${Math.round(currentVolume)}`;
  }