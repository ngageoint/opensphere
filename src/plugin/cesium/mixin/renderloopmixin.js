goog.module('plugin.cesium.mixin.renderloop');
goog.module.declareLegacyNamespace();

const dispatcher = goog.require('os.Dispatcher');
const AutoRenderLoop = goog.require('olcs.AutoRenderLoop');
const MapEvent = goog.require('os.MapEvent');
const TimelineController = goog.require('os.time.TimelineController');
const TimelineEventType = goog.require('os.time.TimelineEventType');


/**
 * @suppress {accessControls}
 */
(function() {
  var origEnable = AutoRenderLoop.prototype.enable;

  /**
   * Overridden to listen to <code>MapEvent.GL_REPAINT</code> events in addition
   * to timeline show events for rendering the scene.
   */
  AutoRenderLoop.prototype.enable = function() {
    dispatcher.getInstance().listen(MapEvent.GL_REPAINT, this.notifyRepaintRequired, false, this);
    TimelineController.getInstance().listen(TimelineEventType.SHOW,
        this.notifyRepaintRequired, false, this);

    this.scene_.postUpdate.addEventListener(this.onPostUpdate_, this);
    origEnable.call(this);
  };

  var origDisable = AutoRenderLoop.prototype.disable;

  /**
   * Overridden to unlisten to <code>MapEvent.GL_REPAINT</code> events in addition
   * to timeline show events for rendering the scene.
   */
  AutoRenderLoop.prototype.disable = function() {
    dispatcher.getInstance().unlisten(MapEvent.GL_REPAINT, this.notifyRepaintRequired, false, this);
    TimelineController.getInstance().unlisten(TimelineEventType.SHOW,
        this.notifyRepaintRequired, false, this);
    this.scene_.postUpdate.removeEventListener(this.onPostUpdate_, this);
    origDisable.call(this);
  };

  var origNotify = AutoRenderLoop.prototype.notifyRepaintRequired;

  var lastRepaintEventTime = 0;

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
      var btnDown = opt_evt['buttons'] || // mouse events
          (opt_evt['touches'] && opt_evt['touches'].length) || // touch events
          (opt_evt['pointerId'] && opt_evt['pressure'] > 0); // pointer events

      if (!btnDown) {
        return;
      }
    }

    origNotify.call(this);
    lastRepaintEventTime = Date.now();
  };
})();
