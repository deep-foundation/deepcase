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
    timeout: { type: 'number', default: 1000 },
    attack: { type: "number", default: 3.0 },
    bufferSize: { type: 'number', default: 1024 },
    sampleRate: { type: 'number', default: 44100 }
  },

  init: function () {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const self = this;
    this.isSoundInitialized = false; // Flag to track if sound is initialized

    if (self.data.id) {
      // Set timeout before sound starts playing
      setTimeout(function () {
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
        const hashedValue = hash(self.data.id);
        const normalizedHash = hashedValue / 1000000; // Since we limited the hash range to 1,000,000
        const frequencyFloat = self.data.minFreq + normalizedHash * (self.data.maxFreq - self.data.minFreq);

        // Round and clamp the frequency
        const frequency = Math.round(frequencyFloat);
        const clampedFrequency = Math.min(Math.max(frequency, self.data.minFreq), self.data.maxFreq);

        // Set the oscillator options
        self.oscillator = self.audioContext.createOscillator({
          type: self.data.wave,
          frequency: clampedFrequency,
          bufferSize: self.data.bufferSize,
          sampleRate: self.data.sampleRate
        });

        self.oscillator.frequency.setValueAtTime(clampedFrequency, self.audioContext.currentTime);

        // Check if volume is finite, set to 0 if it's not
        if (!isFinite(self.data.volume)) {
          self.data.volume = 0;
        }

        self.panner = self.audioContext.createPanner();
        self.panner.panningModel = self.data.panningModel;
        self.panner.distanceModel = self.data.distanceModel;
        self.panner.refDistance = self.data.refDistance;
        self.panner.maxDistance = self.data.maxDistance;
        self.panner.rolloffFactor = self.data.rolloffFactor;
        self.panner.coneInnerAngle = self.data.coneInnerAngle;
        self.panner.coneOuterAngle = self.data.coneOuterAngle;
        self.panner.coneOuterGain = self.data.coneOuterGain;

        // Create a gain node and ramp up the volume gradually
        self.gainNode = self.audioContext.createGain();
        self.gainNode.gain.setValueAtTime(0.0000001, self.audioContext.currentTime); // set to very low value to avoid clicks
        self.gainNode.gain.exponentialRampToValueAtTime(self.data.volume, self.audioContext.currentTime + self.data.attack); // 3 second attack time

        self.oscillator.connect(self.gainNode); // Connect to gain node instead of Panner
        self.gainNode.connect(self.panner); // Then connect to Panner
        self.panner.connect(self.audioContext.destination);

        self.oscillator.start();

        self.camera = document.getElementById('camera');
        self.isSoundInitialized = true; // Flag that sound is initialized

        if (self.data.throttle > 0) {
          self.tick = AFRAME.utils.throttleTick(self.tick, self.data.throttle, self);
        }
      }, self.data.timeout); // Timeout value from component schema
    }

  },

  tick: function () {
    if (!this.isSoundInitialized) return; // Return if sound is not initialized

    const { x, y, z } = this.el.getAttribute('position');

    if (!this.lastPosition ||
      (x !== this.lastPosition.x || y !== this.lastPosition.y || z !== this.lastPosition.z)) {
      this.panner.setPosition(x, y, z);
      this.lastPosition = { x, y, z };
    }

    if (this.camera && this.camera.object3D) {
      const { x: cameraX, y: cameraY, z: cameraZ } = this.camera.getAttribute('position');
      const cameraPosition = { x: cameraX, y: cameraY, z: cameraZ };

      if (!this.lastCameraPosition ||
        (cameraX !== this.lastCameraPosition.x || cameraY !== this.lastCameraPosition.y || cameraZ !== this.lastCameraPosition.z)) {
        this.audioContext.listener.setPosition(cameraX, cameraY, cameraZ);
        this.lastCameraPosition = cameraPosition;
      }

      const { x: rotationX, y: rotationY, z: rotationZ } = this.camera.getAttribute('rotation');
      const rotation = { x: rotationX, y: rotationY, z: rotationZ };

      if (!this.lastRotation ||
        (rotationX !== this.lastRotation.x || rotationY !== this.lastRotation.y || rotationZ !== this.lastRotation.z)) {
        const forwardVector = new THREE.Vector3().setFromEuler(new THREE.Euler(-this.degToRad(rotation.x), -this.degToRad(rotation.y), -this.degToRad(rotation.z), "YXZ"));
        const upVector = new THREE.Vector3(0, 1, 0);
        if (this.camera.object3D.quaternion) {
          upVector.applyQuaternion(this.camera.object3D.quaternion);
          this.audioContext.listener.setOrientation(forwardVector.x, forwardVector.y, forwardVector.z, upVector.x, upVector.y, upVector.z);
        }
        this.lastRotation = rotation;
      }
    }
  },

  degToRad: function (degrees) {
    return degrees * Math.PI / 180;
  },

  remove: function () {
    if (!this.isSoundInitialized) return;
    this.oscillator.stop();
  }
});