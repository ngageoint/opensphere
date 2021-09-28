goog.declareModuleId('os.query.TemporalHandler');

import {getQueryManager} from './queryinstance.js';

const {assert} = goog.require('goog.asserts');

const {default: ParamModifier} = goog.requireType('os.net.ParamModifier');
const {default: ITemporalFormatter} = goog.requireType('os.query.ITemporalFormatter');
const {default: RequestSource} = goog.requireType('os.source.Request');


/**
 */
export default class TemporalHandler {
  /**
   * Constructor.
   * @param {boolean=} opt_localRefresh Use if source has no query handlers in Query Manager
   */
  constructor(opt_localRefresh) {
    /**
     * @type {boolean}
     * @private
     */
    this.localRefresh_ = opt_localRefresh || false;

    /**
     * @type {?ITemporalFormatter}
     * @private
     */
    this.formatter_ = null;

    /**
     * @type {?ParamModifier}
     * @private
     */
    this.modifier_ = null;

    /**
     * @type {?RequestSource}
     * @private
     */
    this.source_ = null;
  }

  /**
   * Get the temporal formatter.
   *
   * @return {?ITemporalFormatter}
   */
  getFormatter() {
    return this.formatter_;
  }

  /**
   * Set the temporal formatter.
   *
   * @param {?ITemporalFormatter} formatter
   */
  setFormatter(formatter) {
    this.formatter_ = formatter;
  }

  /**
   * Get the parameter modifier.
   *
   * @return {?ParamModifier}
   */
  getModifier() {
    return this.modifier_;
  }

  /**
   * Set the parameter modifier.
   *
   * @param {?ParamModifier} modifier
   */
  setModifier(modifier) {
    this.modifier_ = modifier;
  }

  /**
   * Get the source.
   *
   * @return {?RequestSource}
   */
  getSource() {
    return this.source_;
  }

  /**
   * Set the source.
   *
   * @param {?RequestSource} source
   */
  setSource(source) {
    this.source_ = source;
  }

  /**
   * Handler for timeline reset.
   *
   * @param {os.time.TimelineController} controller
   * @param {boolean=} opt_refresh
   */
  handleTimelineReset(controller, opt_refresh) {
    assert(this.source_, 'Source not set in temporal handler!');
    assert(this.formatter_, 'Formatter not set in temporal handler!');
    assert(this.modifier_, 'Modifier not set in temporal handler!');
    assert(controller, 'No timeline controller in temporal handler!');

    // update the replacement for the temporal modifier
    var replacement = this.formatter_.format(controller);
    this.modifier_.setReplacement(replacement);

    // add/replace the modifier in the source request
    var request = this.source_.getRequest();
    request.removeModifier(this.modifier_.getId());
    request.addModifier(this.modifier_);

    var refresh = opt_refresh !== undefined ? opt_refresh : true;
    if (refresh) {
      this.refreshSource();
    }
  }

  /**
   * @protected
   */
  refreshSource() {
    if (this.localRefresh_) {
      this.source_.refresh();
    } else {
      var qm = getQueryManager();
      qm.scheduleRefresh(this.source_.getId());
    }
  }
}
