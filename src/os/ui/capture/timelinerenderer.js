goog.declareModuleId('os.ui.capture.TimelineRenderer');

import {getPixelRatio} from '../../capture/capture.js';
import SvgRenderer from './svgrenderer.js';

/**
 */
export default class TimelineRenderer extends SvgRenderer {
  /**
   * Constructor.
   * @param {Object=} opt_options Options to configure the renderer
   */
  constructor(opt_options) {
    var options = opt_options || {};
    options['selector'] = options['selector'] || 'svg.c-svg-timeline';

    super(options);
    this.title = 'Timeline';

    /**
     * @type {boolean}
     * @private
     */
    this.overlay_ = options['overlay'] || false;
  }

  /**
   * @inheritDoc
   */
  getFill() {
    return window.getComputedStyle(this.getRenderElement())['fill'];
  }

  /**
   * @inheritDoc
   */
  getPosition(canvas) {
    return [0, canvas.height - this.getTimelineHeight()];
  }

  /**
   * @inheritDoc
   */
  getHeight() {
    if (!this.overlay_) {
      return this.getTimelineHeight();
    }

    return 0;
  }

  /**
   * Get the height of the timeline element.
   *
   * @return {number}
   * @protected
   */
  getTimelineHeight() {
    var timelineEl = this.getRenderElement();
    if (timelineEl) {
      var rect = timelineEl.getBoundingClientRect();
      if (rect) {
        return rect.height * getPixelRatio();
      }
    }

    return 0;
  }
}
