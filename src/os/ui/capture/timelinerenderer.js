goog.provide('os.ui.capture.TimelineRenderer');

goog.require('os.ui.capture.SvgRenderer');



/**
 * @param {Object=} opt_options Options to configure the renderer
 * @extends {os.ui.capture.SvgRenderer}
 * @constructor
 */
os.ui.capture.TimelineRenderer = function(opt_options) {
  var options = opt_options || {};
  options['selector'] = options['selector'] || 'svg.svg-timeline';

  os.ui.capture.TimelineRenderer.base(this, 'constructor', options);
  this.title = 'Timeline';

  /**
   * @type {string}
   * @private
   */
  this.fill_ = options['fill'] || '#fff';

  /**
   * @type {boolean}
   * @private
   */
  this.overlay_ = options['overlay'] || false;
};
goog.inherits(os.ui.capture.TimelineRenderer, os.ui.capture.SvgRenderer);


/**
 * @inheritDoc
 */
os.ui.capture.TimelineRenderer.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @inheritDoc
 */
os.ui.capture.TimelineRenderer.prototype.getPosition = function(canvas) {
  return [0, canvas.height - this.getTimelineHeight()];
};


/**
 * @inheritDoc
 */
os.ui.capture.TimelineRenderer.prototype.getHeight = function() {
  if (!this.overlay_) {
    return this.getTimelineHeight();
  }

  return 0;
};


/**
 * Get the height of the timeline element.
 * @return {number}
 * @protected
 */
os.ui.capture.TimelineRenderer.prototype.getTimelineHeight = function() {
  var timelineEl = this.getRenderElement();
  if (timelineEl) {
    var rect = timelineEl.getBoundingClientRect();
    if (rect) {
      return rect.height * os.capture.getPixelRatio();
    }
  }

  return 0;
};
