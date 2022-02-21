goog.declareModuleId('plugin.capture.TimelineRecorder');

import OSTimelineRecorder from '../../os/capture/timelinerecorder.js';
import DataManager from '../../os/data/datamanager.js';
import PropertyChange from '../../os/data/propertychange.js';

const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');


/**
 * Records each frame of the timeline controller animation loop from a canvas.
 */
export default class TimelineRecorder extends OSTimelineRecorder {
  /**
   * Constructor.
   * @param {CanvasFn=} opt_canvasFn Function to get the canvas
   * @param {RenderFn=} opt_renderFn Callback to render the canvas
   */
  constructor(opt_canvasFn, opt_renderFn) {
    super(opt_canvasFn, opt_renderFn);
    this.log = logger;

    /**
     * If the data manager was time filtered prior to recording.
     * @type {boolean|undefined}
     * @private
     */
    this.wasTimeFiltered_ = undefined;
  }

  /**
   * @inheritDoc
   */
  init() {
    super.init();

    var mdm = DataManager.getInstance();
    this.wasTimeFiltered_ = mdm.getTimeFilterEnabled();

    // disable time filtering so the legend shows data for all time
    mdm.setTimeFilterEnabled(false);

    // listen for external changes to the time filter flag
    mdm.listen(GoogEventType.PROPERTYCHANGE, this.onDataManagerChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    super.cleanup();

    var mdm = DataManager.getInstance();

    // remove the listener
    mdm.unlisten(GoogEventType.PROPERTYCHANGE, this.onDataManagerChange_, false, this);

    // set the value back to what it was
    if (this.wasTimeFiltered_ != undefined) {
      mdm.setTimeFilterEnabled(this.wasTimeFiltered_);
      this.wasTimeFiltered_ = undefined;
    }
  }

  /**
   * @param {PropertyChangeEvent} event The change event
   * @private
   */
  onDataManagerChange_(event) {
    if (!this.aborted) {
      var p = event.getProperty();
      if (p === PropertyChange.TIME_FILTER_ENABLED) {
        // clear the value so cleanup doesn't try changing it
        this.wasTimeFiltered_ = undefined;

        this.handleError('The application time filter has been changed externally, which may cause unexpected ' +
            'behavior in the recording. Recording has been aborted.');
      }
    }
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.capture.TimelineRecorder');
