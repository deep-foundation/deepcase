// @ts-nocheck
import AFRAME from "aframe";

AFRAME.registerComponent('use-engine-tick', {
  schema:{
    onEngineTick:{ default: undefined }
  },
  tick: function () {
    const d = this.data;
    if (typeof d.onEngineTick === 'function') {
      d.onEngineTick();
    }
    // this.el.emit('use-engine-tick', {  el : this.el })
  }
});