goog.provide('os.query.TemporalHandler');
goog.require('goog.asserts');
goog.require('os.net.ParamModifier');
goog.require('os.query.ITemporalFormatter');
goog.require('os.source.Request');



/**
 * @param {boolean=} opt_localRefresh Use if source has no query handlers in Query Manager
 * @constructor
 */
os.query.TemporalHandler = function(opt_localRefresh) {
  /**
   * @type {boolean}
   * @private
   */
  this.localRefresh_ = opt_localRefresh || false;

  /**
   * @type {?os.query.ITemporalFormatter}
   * @private
   */
  this.formatter_ = null;

  /**
   * @type {?os.net.ParamModifier}
   * @private
   */
  this.modifier_ = null;

  /**
   * @type {?os.source.Request}
   * @private
   */
  this.source_ = null;
};


/**
 * Get the temporal formatter.
 * @return {?os.query.ITemporalFormatter}
 */
os.query.TemporalHandler.prototype.getFormatter = function() {
  return this.formatter_;
};


/**
 * Set the temporal formatter.
 * @param {?os.query.ITemporalFormatter} formatter
 */
os.query.TemporalHandler.prototype.setFormatter = function(formatter) {
  this.formatter_ = formatter;
};


/**
 * Get the parameter modifier.
 * @return {?os.net.ParamModifier}
 */
os.query.TemporalHandler.prototype.getModifier = function() {
  return this.modifier_;
};


/**
 * Set the parameter modifier.
 * @param {?os.net.ParamModifier} modifier
 */
os.query.TemporalHandler.prototype.setModifier = function(modifier) {
  this.modifier_ = modifier;
};


/**
 * Get the source.
 * @return {?os.source.Request}
 */
os.query.TemporalHandler.prototype.getSource = function() {
  return this.source_;
};


/**
 * Set the source.
 * @param {?os.source.Request} source
 */
os.query.TemporalHandler.prototype.setSource = function(source) {
  this.source_ = source;
};


/**
 * Handler for timeline reset.
 * @param {os.time.TimelineController} controller
 * @param {boolean=} opt_refresh
 */
os.query.TemporalHandler.prototype.handleTimelineReset = function(controller, opt_refresh) {
  goog.asserts.assert(this.source_, 'Source not set in temporal handler!');
  goog.asserts.assert(this.formatter_, 'Formatter not set in temporal handler!');
  goog.asserts.assert(this.modifier_, 'Modifier not set in temporal handler!');
  goog.asserts.assert(controller, 'No timeline controller in temporal handler!');

  // update the replacement for the temporal modifier
  var replacement = this.formatter_.format(controller);
  this.modifier_.setReplacement(replacement);

  // add/replace the modifier in the source request
  var request = this.source_.getRequest();
  request.removeModifier(this.modifier_.getId());
  request.addModifier(this.modifier_);

  var refresh = goog.isDef(opt_refresh) ? opt_refresh : true;
  if (refresh) {
    this.refreshSource();
  }
};


/**
 * @protected
 */
os.query.TemporalHandler.prototype.refreshSource = function() {
  if (this.localRefresh_) {
    this.source_.refresh();
  } else {
    var qm = os.ui.queryManager;
    qm.scheduleRefresh(this.source_.getId());
  }
};
