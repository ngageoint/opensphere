goog.provide('os.ui.LegendCtrl');
goog.provide('os.ui.legendDirective');

goog.require('goog.async.Throttle');
goog.require('os.data.SourceManager');
goog.require('os.defines');
goog.require('os.legend');
goog.require('os.ui.Module');
goog.require('os.ui.events.UIEvent');


/**
 * The legend directive
 * @return {angular.Directive}
 */
os.ui.legendDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'closeFlag': '=',
      'widget': '@'
    },
    templateUrl: os.ROOT + 'views/legendguide.html',
    controller: os.ui.LegendCtrl,
    controllerAs: 'legend'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('legendguide', [os.ui.legendDirective]);



/**
 * Controller function for the legend directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.data.SourceManager}
 * @constructor
 * @ngInject
 */
os.ui.LegendCtrl = function($scope, $element) {
  os.ui.LegendCtrl.base(this, 'constructor');

  // events that will trigger a legend redraw
  this.updateEvents = [
    os.source.PropertyChange.COLOR,
    os.source.PropertyChange.COLOR_MODEL,
    os.source.PropertyChange.FEATURES,
    os.source.PropertyChange.FEATURE_VISIBILITY,
    os.source.PropertyChange.GEOMETRY_CENTER_SHAPE,
    os.source.PropertyChange.GEOMETRY_SHAPE,
    os.source.PropertyChange.STYLE,
    os.source.PropertyChange.TITLE,
    os.source.PropertyChange.VISIBLE
  ];

  /**
   * Tile layer events that should trigger a UI update.
   * @type {!Array<string>}
   * @protected
   */
  this.tileUpdateEvents = [
    os.layer.PropertyChange.STYLE,
    os.layer.PropertyChange.VISIBLE,
    os.layer.PropertyChange.TITLE
  ];

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;
  this.scope.$on('$destroy', this.dispose.bind(this));

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * Limit how frequently the legend is updated.
   * @type {goog.async.Throttle}
   * @protected
   */
  this.drawThrottle = new goog.async.Throttle(this.drawLegend_, 500, this);

  /**
   * @type {?HTMLCanvasElement}
   * @private
   */
  this.canvas_ = null;

  /**
   * If we're currently dragging the legend.
   * @type {boolean}
   * @private
   */
  this.dragging_ = false;

  /**
   * If we're currently saving the position (so don't update).
   * @type {boolean}
   * @private
   */
  this.saving_ = false;

  /**
   * Map of tile listen keys.
   * @type {Object<string, ol.EventsKey>}
   * @private
   */
  this.layerListeners_ = {};

  /**
   * @type {boolean}
   * @private
   */
  this['widget'] = $scope['widget'] == 'true';

  this.init();
};
goog.inherits(os.ui.LegendCtrl, os.data.SourceManager);


/**
 * @inheritDoc
 */
os.ui.LegendCtrl.prototype.disposeInternal = function() {
  os.ui.LegendCtrl.base(this, 'disposeInternal');

  os.dispatcher.unlisten(os.legend.EventType.UPDATE, this.onUpdateDelay, false, this);

  var map = os.MapContainer.getInstance();
  map.unlisten(os.events.LayerEventType.ADD, this.onLayerAdded_, false, this);
  map.unlisten(os.events.LayerEventType.REMOVE, this.onLayerRemoved_, false, this);

  for (var key in this.layerListeners_) {
    ol.events.unlistenByKey(this.layerListeners_[key]);
  }

  goog.dispose(this.drawThrottle);
  this.drawThrottle = null;

  if (this['widget']) {
    var olMap = map.getMap();
    if (olMap) {
      ol.events.unlisten(olMap, 'change:size', this.onUpdateDelay, this);
    }
  }

  this.canvas_ = null;
  this.scope = null;
  this.element = null;
};


/**
 * @inheritDoc
 */
os.ui.LegendCtrl.prototype.init = function() {
  os.ui.LegendCtrl.base(this, 'init');

  var canvas = this.element.find('canvas');
  if (canvas && canvas.length == 1) {
    this.canvas_ = /** @type {!HTMLCanvasElement} */ (canvas[0]);
  }

  os.dispatcher.listen(os.legend.EventType.UPDATE, this.onUpdateDelay, false, this);

  var map = os.MapContainer.getInstance();
  map.listen(os.events.LayerEventType.ADD, this.onLayerAdded_, false, this);
  map.listen(os.events.LayerEventType.REMOVE, this.onLayerRemoved_, false, this);

  var tileLayers = /** @type {!Array<!os.layer.AnimatedTile>} */ (map.getLayers().filter(function(layer) {
    return layer instanceof os.layer.AnimatedTile;
  }));

  for (var i = 0; i < tileLayers.length; i++) {
    this.addLayerListener_(tileLayers[i]);
  }

  if (this['widget']) {
    var olMap = map.getMap();
    if (olMap) {
      ol.events.listen(olMap, 'change:size', this.onUpdateDelay, this);
    }

    // positioning off the screen will auto correct to the bottom/right
    var x = /** @type {number} */ (os.settings.get(os.config.LegendSetting.LEFT, 15000));
    var y = /** @type {number} */ (os.settings.get(os.config.LegendSetting.TOP, 15000));

    this.scope['legendStyle'] = {
      'position': 'fixed',
      'left': x,
      'top': y
    };

    this.element.draggable({
      'containment': os.ui.LegendCtrl.CONTAINER_SELECTOR,
      'handle': '.c-legend__dragtarget',
      'start': this.onDragStart_.bind(this),
      'stop': this.onDragStop_.bind(this)
    });

    // defer the initial update so the CSS left/top attributes are updated
    setTimeout(this.onUpdateDelay.bind(this), 0);
  }
};


/**
 * CSS selector for the legend container in widget mode.
 * @type {string}
 * @const
 */
os.ui.LegendCtrl.CONTAINER_SELECTOR = '#map-container';


/**
 * @inheritDoc
 */
os.ui.LegendCtrl.prototype.onUpdateDelay = function() {
  if (!this.saving_ && this.drawThrottle) {
    this.drawThrottle.fire();
  }
};


/**
 * Draws the legend.
 * @private
 */
os.ui.LegendCtrl.prototype.drawLegend_ = function() {
  if (this.canvas_) {
    var maxHeight;
    var maxWidth;

    if (this['widget']) {
      // limit the height/width to not exceed the container size
      var container = angular.element(os.ui.LegendCtrl.CONTAINER_SELECTOR);
      maxHeight = container.height() - 50;
      maxWidth = container.width() - 50;
    } else {
      // set a reasonable height limit
      maxHeight = 2000;
    }

    os.legend.drawToCanvas(this.canvas_, maxHeight, maxWidth);
    this.positionLegend_();
  }
};


/**
 * Handle a layer being added to the map.
 * @param {os.events.LayerEvent} event The layer event
 * @private
 */
os.ui.LegendCtrl.prototype.onLayerAdded_ = function(event) {
  if (event.layer instanceof os.layer.AnimatedTile) {
    this.addLayerListener_(event.layer);
  }

  this.updateDelay.start();
};


/**
 * Handle a layer being remove from the map.
 * @param {os.events.LayerEvent} event The layer event
 * @private
 */
os.ui.LegendCtrl.prototype.onLayerRemoved_ = function(event) {
  if (event.layer instanceof os.layer.AnimatedTile) {
    this.removeLayerListener_(event.layer);
  }

  this.updateDelay.start();
};


/**
 * Registers change listener on a layer.
 * @param {os.layer.ILayer} layer
 * @private
 */
os.ui.LegendCtrl.prototype.addLayerListener_ = function(layer) {
  this.removeLayerListener_(layer);

  var id = layer.getId();
  this.layerListeners_[id] = ol.events.listen(/** @type {ol.events.EventTarget} */ (layer),
      goog.events.EventType.PROPERTYCHANGE, this.onTilePropertyChange, this);
};


/**
 * Removes change listener on a layer.
 * @param {os.layer.ILayer} layer
 * @private
 */
os.ui.LegendCtrl.prototype.removeLayerListener_ = function(layer) {
  var id = layer.getId();
  if (id in this.layerListeners_) {
    ol.events.unlistenByKey(this.layerListeners_[id]);
    delete this.layerListeners_[id];
  }
};


/**
 * Handle property change events from a source.
 * @param {os.events.PropertyChangeEvent|ol.Object.Event} event
 * @protected
 */
os.ui.LegendCtrl.prototype.onTilePropertyChange = function(event) {
  var p;
  try {
    // ol3's ol.ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure the
    // event is from us
    p = event.getProperty();
  } catch (e) {
    return;
  }

  // update the UI if a flagged event type is fired
  if (p && this.tileUpdateEvents.indexOf(p) > -1) {
    this.updateDelay.start();
  }
};


/**
 * Drag start handler. Fires a start event in case the parent needs to take action.
 * @param {?Object} event
 * @param {?Object} ui
 * @private
 */
os.ui.LegendCtrl.prototype.onDragStart_ = function(event, ui) {
  // iframes kill mouse events if you roll over them while dragging, so we'll nip that in the bud
  angular.element('iframe').addClass('no-mouse');
  this.dragging_ = true;
};


/**
 * Drag end handler. Fires an end event in case the parent needs to take action.
 * @param {?Object} event
 * @param {?Object} ui
 * @private
 */
os.ui.LegendCtrl.prototype.onDragStop_ = function(event, ui) {
  // iframes can have mouse events again
  angular.element('iframe').removeClass('no-mouse');
  this.dragging_ = false;

  if (this.element) {
    // jQuery draggable will set the height/width, but we want the legend to autosize based on the canvas size
    this.element.height('auto');
    this.element.width('auto');

    // save the new position to settings
    this.savePosition_();

    // update position in case the legend changed size while dragging
    this.positionLegend_();
  }
};


/**
 * Saves the legend position to settings.
 * @private
 */
os.ui.LegendCtrl.prototype.savePosition_ = function() {
  if (!this.saving_ && this.element && os.settings) {
    this.saving_ = true;

    // save the position for next time
    var x = this.element.css('left');
    var y = this.element.css('top');
    os.settings.set(os.config.LegendSetting.LEFT, x);
    os.settings.set(os.config.LegendSetting.TOP, y);

    this.saving_ = false;
  }
};


/**
 * Handles viewport/legend resize
 * @param {goog.events.Event=} opt_e
 * @private
 */
os.ui.LegendCtrl.prototype.positionLegend_ = function(opt_e) {
  // don't reposition the legend while it's being dragged
  if (!this.dragging_ && this.element && this['widget']) {
    // this moves the legend back into view rather simplistically
    var strX = this.element.css('left').replace('px', '');
    var strY = this.element.css('top').replace('px', '');
    if (isNaN(strX) || isNaN(strY)) {
      // widget position isn't set yet
      return;
    }

    var x = parseFloat(strX);
    var y = parseFloat(strY);
    var oldX = parseFloat(os.settings.get(os.config.LegendSetting.LEFT, strX).replace('px', ''));
    var oldY = parseFloat(os.settings.get(os.config.LegendSetting.TOP, strY).replace('px', ''));
    var w = parseFloat(this.element.css('width').replace('px', ''));
    var h = parseFloat(this.element.css('height').replace('px', ''));

    var container = angular.element(os.ui.LegendCtrl.CONTAINER_SELECTOR);
    var cHeight = container.height();
    var cWidth = container.width();
    var cTop = container.offset()['top'];

    var changed = false;
    if (x < 0) {
      this.element.css('left', '5px');
      changed = true;
    } else if ((x + w) > cWidth) {
      x = cWidth - w;
      this.element.css('left', x + 'px');
      changed = true;
    }

    if (y < cTop) {
      this.element.css('top', cTop + 'px');
      changed = true;
    } else if ((y + h) > (cTop + cHeight)) {
      y = cTop + cHeight - h;
      this.element.css('top', y + 'px');
      changed = true;
    }

    if (!changed && (oldX != x || oldY != y)) { // adjust until it settles
      this.element.css('left', oldX + 'px');
      this.element.css('top', oldY + 'px');
      this.positionLegend_(opt_e);
    }
  }
};


/**
 * Open legend settings.
 */
os.ui.LegendCtrl.prototype.openSettings = function() {
  os.ui.config.SettingsManager.getInstance().setSelectedPlugin(os.legend.ID);

  var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, 'settings', true);
  os.dispatcher.dispatchEvent(event);
};
goog.exportProperty(
    os.ui.LegendCtrl.prototype,
    'openSettings',
    os.ui.LegendCtrl.prototype.openSettings);


/**
 * Open legend settings.
 */
os.ui.LegendCtrl.prototype.close = function() {
  if (this.scope['closeFlag'] != null) {
    // ng-if
    this.scope['closeFlag'] = !this.scope['closeFlag'];
  } else {
    this.element.remove();

    // parent scope is the one created in os.ui.window.launchInternal, so destroy that to prevent leaks
    this.scope.$parent.$destroy();
  }
};
goog.exportProperty(
    os.ui.LegendCtrl.prototype,
    'close',
    os.ui.LegendCtrl.prototype.close);
