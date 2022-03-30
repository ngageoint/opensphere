goog.declareModuleId('plugin.cesium.mixin.renderloop');

import AutoRenderLoop from 'ol-cesium/src/olcs/AutoRenderLoop.js';

import * as Dispatcher from '../../../os/dispatcher.js';
import MapEvent from '../../../os/map/mapevent.js';
import TimelineController from '../../../os/time/timelinecontroller.js';
import TimelineEventType from '../../../os/time/timelineeventtype.js';


/**
 * If the mixin has been loaded.
 * @type {boolean}
 */
let loaded = false;


/**
 * @suppress {accessControls}
 */
export const load = () => {
  if (loaded) {
    return;
  }

  loaded = true;

  const origEnable = AutoRenderLoop.prototype.enable;

  /**
   * Overridden to listen to <code>MapEvent.GL_REPAINT</code> events in addition
   * to timeline show events for rendering the scene.
   */
  AutoRenderLoop.prototype.enable = function() {
    Dispatcher.getInstance().listen(MapEvent.GL_REPAINT, this.notifyRepaintRequired, false, this);
    TimelineController.getInstance().listen(TimelineEventType.SHOW, this.notifyRepaintRequired, false, this);

    this.scene_.postUpdate.addEventListener(this.onPostUpdate_, this);
    origEnable.call(this);
  };

  const origDisable = AutoRenderLoop.prototype.disable;

  /**
   * Overridden to unlisten to <code>MapEvent.GL_REPAINT</code> events in addition
   * to timeline show events for rendering the scene.
   */
  AutoRenderLoop.prototype.disable = function() {
    Dispatcher.getInstance().unlisten(MapEvent.GL_REPAINT, this.notifyRepaintRequired, false, this);
    TimelineController.getInstance().unlisten(TimelineEventType.SHOW, this.notifyRepaintRequired, false, this);
    this.scene_.postUpdate.removeEventListener(this.onPostUpdate_, this);
    origDisable.call(this);
  };

  const origNotify = AutoRenderLoop.prototype.notifyRepaintRequired;

  let lastRepaintEventTime = 0;

  /**
   * @private
   */
  AutoRenderLoop.prototype.onPostUpdate_ = function() {
    // render for at least a whole second after a GL_REPAINT event is fired
    if (Date.now() - lastRepaintEventTime < 1000) {
      this.scene_.requestRender();
    }
  };

  /**
   * Overridden because we only care about mouse events if a button is down
   *
   * @param {Event=} opt_evt
   */
  AutoRenderLoop.prototype.notifyRepaintRequired = function(opt_evt) {
    if (opt_evt && opt_evt.type && opt_evt.type.indexOf('move') > -1) {
      // we only care about move events when a button is down
      const btnDown = opt_evt['buttons'] || // mouse events
          (opt_evt['touches'] && opt_evt['touches'].length) || // touch events
          (opt_evt['pointerId'] && opt_evt['pressure'] > 0); // pointer events

      if (!btnDown) {
        return;
      }
    }

    origNotify.call(this);
    lastRepaintEventTime = Date.now();
  };
};
