document.addEventListener('DOMContentLoaded', () => {
    // Toggle the menu
    const menuIcon = document.querySelector('#menu-icon');
    const menu = document.querySelector('#menu');
    const inputPanel = document.querySelector('#input-panel');
    const outputPanel = document.querySelector('#output-panel');
    const setupPanel = document.querySelector('#setup-panel');
    const startPanel = document.querySelector('#start-panel');
    const startBtn = document.querySelector('#start-btn');

    if (menuIcon) {
        menuIcon.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }

    // Open the panel
    const inputBtn = document.getElementById('input-btn');
    if (inputBtn) {
        inputBtn.addEventListener('click', () => {
            inputPanel.classList.remove('hidden');
            menu.classList.add('hidden');
        });
    }

    const outputBtn = document.getElementById('output-btn');
    if (outputBtn) {
        outputBtn.addEventListener('click', () => {
            outputPanel.classList.remove('hidden');
            menu.classList.add('hidden');
        });
    }

    const setupBtn = document.getElementById('setup-btn');
    if (setupBtn) {
        setupBtn.addEventListener('click', () => {
            setupPanel.classList.remove('hidden');
            menu.classList.add('hidden');
        });
    }

    // Close the panel
    const inputClose = document.getElementById('input-close');
    if (inputClose) {
        inputClose.addEventListener('click', () => {
            inputPanel.classList.add('hidden');
        });
    }

    const outputClose = document.getElementById('output-close');
    if (outputClose) {
        outputClose.addEventListener('click', () => {
            outputPanel.classList.add('hidden');
        });
    }

    const setupClose = document.getElementById('setup-close');
    if (setupClose) {
        setupClose.addEventListener('click', () => {
            setupPanel.classList.add('hidden');
        });
    }

    // Start the audio context
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            startPanel.classList.add('hidden');
            init();
        });
    }
});

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

  // Route audio to audio element for feedback
  const audioElement = document.getElementById('audioOutput');
  audioElement.srcObject = currentStream;

  // Analyze the audio stream
  const source = audioContext.createMediaStreamSource(currentStream);
  analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Update volume level
  updateVolumeLevel();
}

// Event listener for dropdown change
document.getElementById('input-microphone').addEventListener('change', (event) => {
  switchAudioInput(event.target.value);
});

// Initialize on page load
async function init() {
  await getAudioInputs();
  // Automatically use the first available audio input
  const select = document.getElementById('input-microphone');
  if (select.options.length > 0) {
    switchAudioInput(select.options[0].value);
  }
}

init();