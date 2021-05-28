goog.provide('os.ui.TimelinePanelCtrl');
goog.provide('os.ui.timelinePanelDirective');

goog.require('os');
goog.require('os.IAnimationSupport');
goog.require('os.data.histo.TimelineHistManager');
goog.require('os.implements');
goog.require('os.time.TimelineEventType');
goog.require('os.ui.Module');
goog.require('os.ui.animationSettingsDirective');
goog.require('os.ui.hist.HistogramEventType');
goog.require('os.ui.timeSettingsDirective');
goog.require('os.ui.timeline.AbstractTimelineCtrl');

goog.requireType('ol.layer.Layer');


/**
 * The timeline-panel directive
 *
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
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @extends {os.ui.timeline.AbstractTimelineCtrl}
 * @constructor
 * @ngInject
 */
os.ui.TimelinePanelCtrl = function($scope, $element, $timeout) {
  os.ui.TimelinePanelCtrl.base(this, 'constructor', $scope, $element, $timeout);

  try {
    var $animate = /** @type {angular.$animate} */ (os.ui.injector.get('$animate'));
    $animate.enabled($element, false);
  } catch (e) {
    // animate service not available, we don't really care
  }

  /**
   * @type {boolean}
   */
  this['locked'] = os.time.TimelineController.getInstance().getLock();

  this.tlc.listen(os.time.TimelineEventType.LOCK_TOGGLE, this.setLock, false, this);

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
  this.tlc.unlisten(os.time.TimelineEventType.LOCK_TOGGLE, this.setLock, false, this);
  this.histManager = null;
  os.ui.TimelinePanelCtrl.base(this, 'destroy');
};


/**
 * Toggle new layers into the animation state.
 *
 * @param {os.events.LayerEvent} event
 * @private
 */
os.ui.TimelinePanelCtrl.prototype.onLayerAdded_ = function(event) {
  // The layer should only be a string ID on the remove event.
  if (typeof event.layer !== 'string') {
    this.setLayerAnimationState_(event.layer, true);
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
  }

  // flip all layers to use the animation overlay
  this.setAllLayerAnimationState_(true);
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
  this.setAllLayerAnimationState_(false);

  // return control back to the date control
  angular.element('.js-date-control').scope()['dateControl'].assumeControl();
  angular.element('.js-date-panel').scope()['ctrl'].applySliceIfActive();

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * Toggles all layers/sources implementing the `IAnimationSupport` interface into the specified animation state.
 * @param {boolean} value The animation state.
 * @private
 */
os.ui.TimelinePanelCtrl.prototype.setAllLayerAnimationState_ = function(value) {
  var layers = os.MapContainer.getInstance().getLayers();
  for (var i = 0, n = layers.length; i < n; i++) {
    this.setLayerAnimationState_(layers[i], value);
  }
};


/**
 * Toggle the animation state on a layer or its source if either supports the `os.IAnimationSupport` interface.
 * @param {ol.layer.Layer} layer The layer.
 * @param {boolean} value The animation state.
 * @private
 */
os.ui.TimelinePanelCtrl.prototype.setLayerAnimationState_ = function(layer, value) {
  if (layer) {
    if (os.implements(layer, os.IAnimationSupport.ID)) {
      /** @type {os.IAnimationSupport} */ (layer).setAnimationEnabled(value);
    } else {
      const source = layer.getSource();
      if (os.implements(source, os.IAnimationSupport.ID)) {
        /** @type {os.IAnimationSupport} */ (source).setAnimationEnabled(value);
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
 *
 * @export
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
    'width': '525',
    'height': 'auto',
    'modal': 'true',
    'show-close': 'true'
  };

  os.ui.window.create(windowOptions, this.getSettingsTemplate(), undefined, undefined, undefined, scopeOptions);
};


/**
 * @return {string}
 * @protected
 */
os.ui.TimelinePanelCtrl.prototype.getAnimationSettingsTemplate = function() {
  return '<animationsettings></animationsettings>';
};


/**
 * Launches the animation settings dialog
 *
 * @export
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
    'modal': 'true'
  };

  os.ui.window.create(windowOptions, this.getAnimationSettingsTemplate(), undefined, undefined, undefined, scopOptions);
};


/**
 * @inheritDoc
 */
os.ui.TimelinePanelCtrl.prototype.adjust = function() {
  os.ui.TimelinePanelCtrl.base(this, 'adjust');

  os.MapContainer.getInstance().updateSize();
  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};

/**
 * Panel lock button click.
 *
 * @export
 */
os.ui.TimelinePanelCtrl.prototype.lock = function() {
  var isLocked = this.tlc.getLock();
  this.tlc.toggleLock();
  this['locked'] = this.tlc.getLock();
  if (isLocked) {
    angular.element('.js-svg-timeline_unlock').addClass('d-none');
    angular.element('.js-svg-timeline_lock').removeClass('d-none');
  } else {
    angular.element('.js-svg-timeline_lock').addClass('d-none');
    angular.element('.js-svg-timeline_unlock').removeClass('d-none');
  }
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.LOCK, 1);
};

/**
 * Set lock
 */
os.ui.TimelinePanelCtrl.prototype.setLock = function() {
  this['locked'] = this.tlc.getLock();
  os.ui.apply(this.scope);
};
