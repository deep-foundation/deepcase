// @ts-nocheck
import AFRAME from "aframe";

AFRAME.registerComponent('node-sound', {
  schema: {
    id: { type: 'number', default: 1 },
    wave: { type: 'string', default: 'sine' },
    minFreq: { type: 'number', default: 200 },
    maxFreq: { type: 'number', default: 3000 },
    volume: { type: 'number', default: 0.5 },
    panningModel: { type: "string", default: 'HRTF' },
    distanceModel: { type: "string", default: 'inverse' },
    refDistance: { type: 'number', default: 1 },
    maxDistance: { type: 'number', default: 10000 },
    rolloffFactor: { type: 'number', default: 1 },
    coneInnerAngle: { type: 'number', default: 360 },
    coneOuterAngle: { type: 'number', default: 360 },
    coneOuterGain: { type: 'number', default: 1 },
    throttle: { type: 'number', default: 0 },
    timeout: { type: 'number', default: 5000 },
  },

  init: function () {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const hash = function (id) {
        let hashValue = 0;
        const str = id.toString();
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hashValue = ((hashValue << 5) - hashValue) + char;
          hashValue |= 0; // Convert to 32bit integer
        }
        return Math.abs(hashValue) % 1000000; // Ensure positive value and limit the range
      };
  
      // Map the hashed value to the desired frequency range
      const hashedValue = hash(this.data.id);
      const normalizedHash = hashedValue / 1000000; // Since we limited the hash range to 1,000,000
      const frequencyFloat = this.data.minFreq + normalizedHash * (this.data.maxFreq - this.data.minFreq);
  
      // Round and clamp the frequency
      const frequency = Math.round(frequencyFloat);
      const clampedFrequency = Math.min(Math.max(frequency, this.data.minFreq), this.data.maxFreq);
  
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = this.data.wave;
      this.oscillator.frequency.setValueAtTime(clampedFrequency, this.audioContext.currentTime);
  
      this.panner = this.audioContext.createPanner();
      this.panner.panningModel = this.data.panningModel;
      this.panner.distanceModel = this.data.distanceModel;
      this.panner.refDistance = this.data.refDistance;
      this.panner.maxDistance = this.data.maxDistance;
      this.panner.rolloffFactor = this.data.rolloffFactor;
      this.panner.coneInnerAngle = this.data.coneInnerAngle;
      this.panner.coneOuterAngle = this.data.coneOuterAngle;
      this.panner.coneOuterGain = this.data.coneOuterGain;
  
      this.oscillator.connect(this.panner);
      this.panner.connect(this.audioContext.destination);
  
      this.oscillator.start();
  
      this.camera = document.getElementById('camera');

    if (this.data.throttle > 0) {
      this.tick = AFRAME.utils.throttleTick(this.tick, this.data.throttle, this);
    }
  },

  degToRad: function (degrees) {
    return degrees * Math.PI / 180;
  },

  tick: function () {
    const position = this.el.getAttribute('position');
    this.panner.setPosition(position.x, position.y, position.z);

    const cameraPosition = this.camera.getAttribute('position');
    this.audioContext.listener.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z);

    // Get the rotation of the camera in Euler angles
    const rotation = this.camera.getAttribute('rotation');

    // Convert the Euler angles to a forward vector
    const forwardVector = {
      x: -Math.sin(this.degToRad(rotation.y)) * Math.cos(this.degToRad(rotation.x)),
      y: Math.sin(this.degToRad(rotation.x)),
      z: -Math.cos(this.degToRad(rotation.y)) * Math.cos(this.degToRad(rotation.x))
    };

    // Use a constant up vector (assuming the camera's up vector is always pointing up)
    const upVector = { x: 0, y: 1, z: 0 };

    // Set the orientation of the listener
    this.audioContext.listener.setOrientation(forwardVector.x, forwardVector.y, forwardVector.z, upVector.x, upVector.y, upVector.z);
  },

  remove: function () {
    this.oscillator.stop();
  }
});