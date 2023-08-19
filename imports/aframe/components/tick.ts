// @ts-nocheck
import AFRAME from "aframe";

const parseFn = function (prop) {
  if (typeof prop === 'function') { return prop }
  else return null;  // already a function
};

AFRAME.registerComponent('use-engine-tick', {
  schema: {
    onEngineTick: { parse: parseFn, default: () => { } },
    throttle: { type: "number" }
  },
  update: function () {
    const d = this.data;
    // Set up the tick throttling.
    if (d.throttle) {
      this.tick = AFRAME.utils.throttleTick(this.tick, d.throttle, this);
    }
  },
  tick: function (t, dt) {
    const d = this.data;
    if (d.onEngineTick) {
      d.onEngineTick();
    }
  }
});