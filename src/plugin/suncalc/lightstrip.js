goog.provide('plugin.suncalc.LightStripCtrl');
goog.provide('plugin.suncalc.lightStripDirective');

goog.require('goog.async.ConditionalDelay');
goog.require('os.defines');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('plugin.suncalc.LightStripSettings');
goog.require('plugin.suncalc.LightStripSettingsCtrl');
goog.require('plugin.suncalc.SunCalcCtrl');


/**
 * The LightStrip directive
 *
 * @return {angular.Directive}
 */
plugin.suncalc.lightStripDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<canvas class="position-absolute" height="2" width=""></canvas>',
    controller: plugin.suncalc.LightStripCtrl,
    controllAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('lightstrip', [plugin.suncalc.lightStripDirective]);


/**
 * Controller function for the LightStrip directive
 *
 * @param {!angular.Scope} $scope The scope
 * @param {!angular.JQLite} $element The element
 * @constructor
 * @ngInject
 */
plugin.suncalc.LightStripCtrl = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?ol.View}
   * @private
   */
  this.view_ = null;

  /**
   * @type {?os.ui.timeline.TimelineScaleOptions}
   * @private
   */
  this.options_ = null;

  /**
   * Resize handler.
   * @type {?function()}
   * @private
   */
  this.resizeFn_ = this.update_.bind(this);
  os.ui.resize(this.element_.parent(), this.resizeFn_);

  /**
   * Events list
   * @type {!Array<!{label: string, color: string}>}
   * @private
   */
  this.events_ = [];

  /**
   * Delay to ensure the lightstrip is initialized on creation.
   * @type {goog.async.ConditionalDelay}
   * @private
   */
  this.updateDelay_ = new goog.async.ConditionalDelay(this.update_, this);

  os.dispatcher.listen(os.ui.timeline.TimelineScaleEvent.TYPE, this.update_, false, this);
  $scope.$on('$destroy', this.destroy_.bind(this));

  /**
   * Determine the dusk calculation method from settings
   * @private
   */
  this.setDuskEventCalculation_();
  os.settings.listen(plugin.suncalc.SettingKey.DUSK_MODE, this.onDuskModeChange_, false, this);

  this.updateDelay_.start(100, 5000);
};


/**
 * Clean up
 *
 * @private
 */
plugin.suncalc.LightStripCtrl.prototype.destroy_ = function() {
  goog.dispose(this.updateDelay_);
  this.updateDelay_ = null;

  if (this.element_ && this.resizeFn_) {
    os.ui.removeResize(this.element_.parent(), this.resizeFn_);
    this.resizeFn_ = null;
  }

  if (this.view_) {
    this.view_.un('change:center', this.update_, this);
    this.view_ = null;
  }

  os.dispatcher.unlisten(os.ui.timeline.TimelineScaleEvent.TYPE, this.update_, false, this);

  os.settings.unlisten(plugin.suncalc.SettingKey.DUSK_MODE, this.onDuskModeChange_, false, this);

  this.element_ = null;
};


/**
 * Handle changes to the dusk calculation setting.
 *
 * @private
 */
plugin.suncalc.LightStripCtrl.prototype.onDuskModeChange_ = function() {
  this.setDuskEventCalculation_();
  this.update_();
};

/**
 * Update the length of events within the light script
 *
 * @private
 */
plugin.suncalc.LightStripCtrl.prototype.setDuskEventCalculation_ = function() {
  var dawnLabel;
  var duskLabel;

  switch (os.settings.get(plugin.suncalc.SettingKey.DUSK_MODE)) {
    case 'nautical':
      dawnLabel = 'nauticalDawn';
      duskLabel = 'nauticalDusk';
      break;
    case 'civilian':
      dawnLabel = 'dawn';
      duskLabel = 'dusk';
      break;
    case 'astronomical':
    default:
      dawnLabel = 'nightEnd';
      duskLabel = 'night';
      break;
  }

  this.events_ = [{
    label: dawnLabel,
    color: 'navy'
  }, {
    label: 'sunrise',
    color: 'lightskyblue'
  }, {
    label: 'sunset',
    color: 'gold'
  }, {
    label: duskLabel,
    color: 'lightskyblue'
  }];
};


/**
 * Update the light strip.
 *
 * @param {goog.events.Event=} opt_evt The event
 * @return {boolean} If the update succeeded.
 * @private
 */
plugin.suncalc.LightStripCtrl.prototype.update_ = function(opt_evt) {
  if (!this.element_) {
    // can't update without an element - controller was likely disposed.
    return true;
  }

  if (opt_evt instanceof os.ui.timeline.TimelineScaleEvent) {
    this.options_ = opt_evt.options;
  }

  if (!this.options_) {
    return false;
  }

  var map = os.MapContainer.getInstance().getMap();
  if (!map) {
    return false;
  }

  if (!this.view_) {
    this.view_ = map.getView();

    if (!this.view_) {
      return false;
    }

    this.view_.on('change:center', this.update_, this);
  }

  var coord = this.view_.getCenter();
  if (!coord) {
    return false;
  }

  this.element_.attr('width', this.element_.parent().width());
  var ctx = this.element_[0].getContext('2d');
  var width = this.element_.width();
  var height = this.element_.height();

  if (this.options_.interval > 4 * 60 * 60 * 1000) {
    // the view is going to be too small to matter
    ctx.clearRect(0, 0, width, height);
    return false;
  }

  coord = ol.proj.toLonLat(coord, os.map.PROJECTION);
  var start = this.options_.start;
  var end = this.options_.end;
  var diff = end - start;
  var tLast = start;

  for (var t = start; tLast < end; t += 24 * 60 * 60 * 1000) {
    var sun = SunCalc.getTimes(new Date(t), coord[1], coord[0]);

    for (var i = 0, n = this.events_.length; i < n; i++) {
      var p = sun[this.events_[i].label].getTime();

      if (p > tLast) {
        // draw from tLast to p in the desired color
        var l = width * (tLast - start) / diff;
        var r = Math.min(width * (p - start) / diff, width);
        ctx.fillStyle = this.events_[i].color;
        ctx.fillRect(l, 0, r - l, height);
        tLast = p;
      }
    }

    ctx.fillStyle = this.events_[0].color;
    ctx.fillRect(r, 0, width - r, height);
  }

  return true;
};
