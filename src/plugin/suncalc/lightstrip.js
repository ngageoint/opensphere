goog.provide('plugin.suncalc.LightStripCtrl');
goog.provide('plugin.suncalc.lightStripDirective');

goog.require('goog.dom.ViewportSizeMonitor');
goog.require('os.defines');
goog.require('os.ui.Module');


/**
 * The LightStrip directive
 * @return {angular.Directive}
 */
plugin.suncalc.lightStripDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<canvas class="lightstrip" height="2" width=""></canvas>',
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
   * @type {?goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.vsm_ = new goog.dom.ViewportSizeMonitor();
  this.vsm_.listen(goog.events.EventType.RESIZE, this.update_.bind(this), false);

  os.dispatcher.listen(os.ui.timeline.TimelineScaleEvent.TYPE, this.update_, false, this);
  $scope.$on('$destroy', this.destroy_.bind(this));

  this.update_();
};


/**
 * Clean up
 * @private
 */
plugin.suncalc.LightStripCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
  this.vsm_.dispose();
  this.vsm_ = null;
  this.view_.un('change:center', this.update_, this);
  os.dispatcher.unlisten(os.ui.timeline.TimelineScaleEvent.TYPE, this.update_, false, this);
};


/**
 * @type {!Array<!{label: string, color: string}>}
 */
plugin.suncalc.LightStripCtrl.EVENTS = [{
  label: 'nightEnd',
  color: 'navy'
}, {
  label: 'sunrise',
  color: 'lightskyblue'
}, {
  label: 'sunset',
  color: 'gold'
}, {
  label: 'night',
  color: 'lightskyblue'
}];


/**
 * @param {goog.events.Event=} opt_evt The event
 * @private
 */
plugin.suncalc.LightStripCtrl.prototype.update_ = function(opt_evt) {
  if (opt_evt instanceof os.ui.timeline.TimelineScaleEvent) {
    this.options_ = opt_evt.options;
  }

  if (!this.options_) {
    return;
  }

  var map = os.MapContainer.getInstance().getMap();
  if (!map) {
    return;
  }

  if (!this.view_) {
    this.view_ = map.getView();

    if (!this.view_) {
      return;
    }

    this.view_.on('change:center', this.update_, this);
  }

  var coord = this.view_.getCenter();
  if (!coord) {
    return;
  }

  this.element_.attr('width', this.element_.parent().width());
  var ctx = this.element_[0].getContext('2d');
  var width = this.element_.width();
  var height = this.element_.height();

  if (this.options_.interval > 4 * 60 * 60 * 1000) {
    // the view is going to be too small to matter
    ctx.clearRect(0, 0, width, height);
    return;
  }

  coord = ol.proj.toLonLat(coord, os.map.PROJECTION);
  var start = this.options_.start;
  var end = this.options_.end;
  var diff = end - start;
  var tLast = start;
  var events = plugin.suncalc.LightStripCtrl.EVENTS;

  for (var t = start; tLast < end; t += 24 * 60 * 60 * 1000) {
    var sun = SunCalc.getTimes(new Date(t), coord[1], coord[0]);

    for (var i = 0, n = events.length; i < n; i++) {
      var p = sun[events[i].label].getTime();

      if (p > tLast) {
        // draw from tLast to p in the desired color
        var l = width * (tLast - start) / diff;
        var r = Math.min(width * (p - start) / diff, width);
        ctx.fillStyle = events[i].color;
        ctx.fillRect(l, 0, r - l, height);
        tLast = p;
      }
    }

    ctx.fillStyle = events[0].color;
    ctx.fillRect(r, 0, width - r, height);
  }
};
