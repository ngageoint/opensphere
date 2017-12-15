goog.provide('os.mixin.renderloop');

goog.require('olcs.AutoRenderLoop');
goog.require('os.olcs.RenderLoop');


/**
 * @suppress {accessControls|checkTypes}
 */
(function() {
  var origEnable = olcs.AutoRenderLoop.prototype.enable;
  olcs.AutoRenderLoop.prototype.enable = function() {
    os.dispatcher.listen(os.olcs.RenderLoop.REPAINT, this.notifyRepaintRequired, false, this);
    os.time.TimelineController.getInstance().listen(os.time.TimelineEventType.SHOW,
        this.notifyRepaintRequired, false, this);
    origEnable.call(this);
  };

  var origDisable = olcs.AutoRenderLoop.prototype.disable;
  olcs.AutoRenderLoop.prototype.disable = function() {
    os.dispatcher.unlisten(os.olcs.RenderLoop.REPAINT, this.notifyRepaintRequired, false, this);
    os.time.TimelineController.getInstance().unlisten(os.time.TimelineEventType.SHOW,
        this.notifyRepaintRequired, false, this);
    origDisable.call(this);
  };

  var origNotify = olcs.AutoRenderLoop.prototype.notifyRepaintRequired;
  olcs.AutoRenderLoop.prototype.notifyRepaintRequired = function(opt_evt) {
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
  };
})();
