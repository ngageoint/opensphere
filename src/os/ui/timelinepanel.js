goog.provide('os.ui.TimelinePanelCtrl');
goog.provide('os.ui.timelinePanelDirective');

goog.require('os.data.histo.TimelineHistManager');
goog.require('os.defines');
goog.require('os.time.TimelineEventType');
goog.require('os.ui.Module');
goog.require('os.ui.animationSettingsDirective');
goog.require('os.ui.hist.HistogramEventType');
goog.require('os.ui.timeSettingsDirective');
goog.require('os.ui.timeline.AbstractTimelineCtrl');


/**
 * The timeline-panel directive
 * @return {angular.Directive}
 */
os.ui.timelinePanelDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/timelinepanel.html',
    controller: os.ui.TimelinePanelCtrl,
    controllerAs: 'timelineCtrl'
  };
};


/**
 * Register the timeline-panel directive.
 */
os.ui.Module.directive('timelinePanel', [os.ui.timelinePanelDirective]);


/**
 * Resize map event
 */
os.ui.resizeMap = 'resizeMap';



/**
 * Controller function for the timeline-panel directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @extends {os.ui.timeline.AbstractTimelineCtrl}
 * @constructor
 * @ngInject
 */
os.ui.TimelinePanelCtrl = function($scope, $element, $timeout) {
  os.ui.TimelinePanelCtrl.base(this, 'constructor', $scope, $element, $timeout);

  /**
   * @type {?os.data.histo.TimelineHistManager}
   */
  this.histManager = os.data.histo.TimelineHistManager.getInstance();
  this.histManager.listen(os.ui.hist.HistogramEventType.CHANGE, this.onHistogramChange, false, this);

  if (os.ui.menu && os.ui.menu.TIMELINE) {
    this.selectBrush.setMenu(os.ui.menu.TIMELINE);
  }
};
goog.inherits(os.ui.TimelinePanelCtrl, os.ui.timeline.AbstractTimelineCtrl);


/**
 * @inheritDoc
 */
os.ui.TimelinePanelCtrl.prototype.destroy = function() {
  this.histManager.unlisten(os.ui.hist.HistogramEventType.CHANGE, this.onHistogramChange, false, this);
  this.histManager = null;
  os.ui.TimelinePanelCtrl.base(this, 'destroy');
};


/**
 * Toggle new layers into the animation state.
 * @param {os.events.LayerEvent} event
 * @private
 */
os.ui.TimelinePanelCtrl.prototype.onLayerAdded_ = function(event) {
  if (event.layer instanceof os.layer.Vector) {
    var source = event.layer.getSource();
    if (source instanceof os.source.Vector) {
      this.setLayerAnimationState_(true, source);
    }
  } else if (event.layer instanceof os.layer.AnimatedTile) {
    this.setLayerAnimationState_(true, event.layer);
  }
};


/**
 * @inheritDoc
 */
os.ui.TimelinePanelCtrl.prototype.assumeControl = function() {
  try {
    // remove control from the date control
    angular.element('.js-date-control').scope()['dateControl'].releaseControl();
  } catch (e) {
    // GV don't care about your problems
  }

  // flip all layers to use the animation overlay
  this.setLayerAnimationState_(true);
  os.MapContainer.getInstance().listen(os.events.LayerEventType.ADD, this.onLayerAdded_, false, this);

  os.ui.TimelinePanelCtrl.base(this, 'assumeControl');

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * @inheritDoc
 */
os.ui.TimelinePanelCtrl.prototype.releaseControl = function() {
  os.ui.TimelinePanelCtrl.base(this, 'releaseControl');

  // flip all layers back to normal feature rendering
  os.MapContainer.getInstance().unlisten(os.events.LayerEventType.ADD, this.onLayerAdded_, false, this);
  this.setLayerAnimationState_(false);

  // return control back to the date control
  angular.element('.js-date-control').scope()['dateControl'].assumeControl();
  angular.element('.js-date-panel').scope()['ctrl'].applySliceIfActive();

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * Toggles all vector sources into the specified animation state, or a specific source if provided.
 * @param {boolean} value
 * @param {(os.source.Vector|os.layer.AnimatedTile)=} opt_target
 * @private
 */
os.ui.TimelinePanelCtrl.prototype.setLayerAnimationState_ = function(value, opt_target) {
  if (opt_target) {
    opt_target.setAnimationEnabled(value);
  } else {
    var layers = os.MapContainer.getInstance().getLayers();
    for (var i = 0, n = layers.length; i < n; i++) {
      var layer = layers[i];
      if (layer instanceof os.layer.AnimatedTile) {
        layer.setAnimationEnabled(value);
      } else if (layer instanceof os.layer.Vector) {
        var source = layer.getSource();
        if (source instanceof os.source.Vector) {
          source.setAnimationEnabled(value);
        }
      }
    }
  }
};


/**
 * @return {string}
 * @protected
 */
os.ui.TimelinePanelCtrl.prototype.getSettingsTemplate = function() {
  return '<timesettings></timesettings>';
};


/**
 * Launches the timeline settings dialog
 */
os.ui.TimelinePanelCtrl.prototype.settings = function() {
  var scopeOptions = {
    'timeline': angular.element('.c-svg-timeline').scope()['timeline']
  };
  var windowOptions = {
    'label': 'Timeline Settings',
    'icon': 'fa fa-clock-o',
    'x': 'center',
    'y': 'center',
    'width': '450',
    'height': 'auto',
    'modal': 'true',
    'no-scroll': 'true'
  };

  os.ui.window.create(windowOptions, this.getSettingsTemplate(), undefined, undefined, undefined, scopeOptions);
};
goog.exportProperty(
    os.ui.TimelinePanelCtrl.prototype,
    'settings',
    os.ui.TimelinePanelCtrl.prototype.settings);


/**
 * @return {string}
 * @protected
 */
os.ui.TimelinePanelCtrl.prototype.getAnimationSettingsTemplate = function() {
  return '<animationsettings></animationsettings>';
};


/**
 * Launches the animation settings dialog
 */
os.ui.TimelinePanelCtrl.prototype.animationSettings = function() {
  var scopOptions = {
    'timeline': angular.element('.c-svg-timeline').scope()['timeline']
  };
  var windowOptions = {
    'label': 'Animation Settings',
    'icon': 'fa fa-sliders',
    'x': 'center',
    'y': 'center',
    'width': '450',
    'max-width': '600',
    'min-width': '450',
    'height': 'auto',
    'modal': 'true',
    'no-scroll': 'true'
  };

  os.ui.window.create(windowOptions, this.getAnimationSettingsTemplate(), undefined, undefined, undefined, scopOptions);
};
goog.exportProperty(
    os.ui.TimelinePanelCtrl.prototype,
    'animationSettings',
    os.ui.TimelinePanelCtrl.prototype.animationSettings);


/**
 * Record animation
 */
os.ui.TimelinePanelCtrl.prototype.record = function() {
  // stop animating prior to trying to record for sanity's sake
  if (this.tlc.isPlaying()) {
    this.tlc.stop();
  }
  os.dispatcher.dispatchEvent(os.time.TimelineEventType.RECORD);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RECORD, 1);
};
goog.exportProperty(
    os.ui.TimelinePanelCtrl.prototype,
    'record',
    os.ui.TimelinePanelCtrl.prototype.record);


/**
 * @inheritDoc
 */
os.ui.TimelinePanelCtrl.prototype.adjust = function() {
  os.ui.TimelinePanelCtrl.base(this, 'adjust');

  os.MapContainer.getInstance().updateSize();
  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};
