goog.provide('os.ui.draw.DrawPickerCtrl');
goog.provide('os.ui.draw.drawPickerDirective');

goog.require('goog.Disposable');
goog.require('goog.events.KeyHandler');
goog.require('ol.geom.Point');
goog.require('os.defines');
goog.require('os.interaction.DragBox');
goog.require('os.interaction.DragCircle');
goog.require('os.interaction.DrawLine');
goog.require('os.interaction.DrawPolygon');
goog.require('os.ogc.OGCService');
goog.require('os.ogc.registry');
goog.require('os.query');
goog.require('os.ui.Module');


/**
 * The drawpicker directive
 *
 * @return {angular.Directive}
 */
os.ui.draw.drawPickerDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'callback': '=?', // callback for draw completion
      'point': '=?', // whether to include the point control
      'line': '=?', // whether to include the line control
      'menu': '=?', // whether is should be a menu view
      'default': '@' // the default drawing control to use
    },
    templateUrl: os.ROOT + 'views/draw/drawpicker.html',
    controller: os.ui.draw.DrawPickerCtrl,
    controllerAs: 'drawPicker'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('drawpicker', [os.ui.draw.drawPickerDirective]);



/**
 * Controller function for the drawpicker directive
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.draw.DrawPickerCtrl = function($scope, $element) {
  os.ui.draw.DrawPickerCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * The root DOM element.
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * The map.
   * @type {os.Map}
   * @protected
   */
  this.map = /** @type {os.Map} */ (os.map.mapContainer.getMap());

  /**
   * Listener key for clicks on the map.
   * @type {?ol.EventsKey}
   * @protected
   */
  this.mapListenKey = null;

  /**
   * DragBox interaction
   * @type {os.interaction.DragBox}
   * @private
   */
  this.dragBox_ = new os.interaction.DragBox();
  ol.events.listen(this.dragBox_, os.ui.draw.DrawEventType.DRAWEND, this.onDrawEnd_, this);
  ol.events.listen(this.dragBox_, os.ui.draw.DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

  /**
   * DragCircle interaction
   * @type {os.interaction.DragCircle}
   * @private
   */
  this.dragCircle_ = new os.interaction.DragCircle();
  ol.events.listen(this.dragCircle_, os.ui.draw.DrawEventType.DRAWEND, this.onDrawEnd_, this);
  ol.events.listen(this.dragCircle_, os.ui.draw.DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

  /**
   * DrawPolygon interaction
   * @type {os.interaction.DrawPolygon}
   * @private
   */
  this.drawPolygon_ = new os.interaction.DrawPolygon();
  ol.events.listen(this.drawPolygon_, os.ui.draw.DrawEventType.DRAWEND, this.onDrawEnd_, this);
  ol.events.listen(this.drawPolygon_, os.ui.draw.DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

  /**
   * DrawLine interaction
   * @type {os.interaction.DrawPolygon}
   * @private
   */
  this.drawLine_ = new os.interaction.DrawLine();
  ol.events.listen(this.drawLine_, os.ui.draw.DrawEventType.DRAWEND, this.onDrawEnd_, this);
  ol.events.listen(this.drawLine_, os.ui.draw.DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

  /**
   * Handler for escape key events.
   * @type {!goog.events.KeyHandler}
   * @protected
   */
  this.keyHandler = new goog.events.KeyHandler(goog.dom.getDocument());
  this.keyHandler.listen(goog.events.KeyHandler.EventType.KEY, this.onKey, false, this);

  if ($scope['menu']) {
    /**
     * The draw menu controls (if applicable).
     * @type {os.ui.menu.Menu}
     */
    this.controlMenu = os.ui.menu.draw.create(this.onDrawEvent.bind(this));
    this.initControlMenu();
  }

  var defaultType = /** @type {string} */ ($scope['default']);
  /**
   * The selected drawing type.
   * @type {?string}
   */
  this['selectedType'] = defaultType || os.ui.ol.interaction.DragBox.TYPE;

  /**
   * Whether the control is currently drawing.
   * @type {boolean}
   */
  this['active'] = false;

  /**
   * UID for this controller, used to unique identify the menu anchor.
   * @type {number}
   */
  this['uid'] = goog.getUid(this);

  this.map.addInteraction(this.dragBox_);
  this.map.addInteraction(this.dragCircle_);
  this.map.addInteraction(this.drawPolygon_);
  this.map.addInteraction(this.drawLine_);

  if (defaultType) {
    // if passed a default type, initialize to it
    this.draw(defaultType);
  }

  $scope.$on('drawpicker.cancel', this.onDrawCancel_.bind(this));
  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.draw.DrawPickerCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.draw.DrawPickerCtrl.prototype.disposeInternal = function() {
  os.ui.draw.DrawPickerCtrl.base(this, 'disposeInternal');
  this.disablePoint();

  // remove interactions
  this.map.removeInteraction(this.dragBox_);
  this.map.removeInteraction(this.dragCircle_);
  this.map.removeInteraction(this.drawPolygon_);
  this.map.removeInteraction(this.drawLine_);
  this.dragBox_.dispose();
  this.dragCircle_.dispose();
  this.drawPolygon_.dispose();
  this.drawLine_.dispose();
  this.dragBox_ = null;
  this.dragCircle_ = null;
  this.drawPolygon_ = null;
  this.drawLine_ = null;

  goog.dispose(this.keyHandler);

  this.scope = null;
  this.element = null;
  this.map = null;
};


/**
 * @protected
 */
os.ui.draw.DrawPickerCtrl.prototype.initControlMenu = function() {
  var mi = this.controlMenu.getRoot();
  var onDraw = this.onDrawEvent.bind(this);

  // remove the enter coordinates and whole world options as they are inapplicable here
  mi.removeChild('Whole World');
  mi.removeChild('Enter Coordinates');

  if (this.scope['line']) {
    mi.addChild({
      label: 'Line',
      eventType: os.ui.menu.draw.EventType.LINE,
      tooltip: 'Draw a line on the map',
      icons: ['<i class="fa fa-fw fa-long-arrow-right"></i> '],
      handler: onDraw,
      sort: 40
    });
  }

  // use this handler to bind on-click 'OK' to whatever 'callback' is on the this.scope OR returns null to do default 'add to areas'
  var getCallback = function() {
    return (this.scope['callback'] ? this.onOGCQueryFeatureChosen.bind(this) : null);
  }.bind(this);

  // add any configured OGC lookups (e.g. Country Borders)
  os.ogc.registry.addOGCMenuItems(this.controlMenu, 130, getCallback);
};


/**
 * Handle draw menu events.
 *
 * @param {os.ui.menu.MenuEvent} event The event.
 */
os.ui.draw.DrawPickerCtrl.prototype.onDrawEvent = function(event) {
  switch (event.type) {
    case os.ui.menu.draw.EventType.BOX:
      this.draw(os.ui.ol.interaction.DragBox.TYPE);
      break;
    case os.ui.menu.draw.EventType.CIRCLE:
      this.draw(os.ui.ol.interaction.DragCircle.TYPE);
      break;
    case os.ui.menu.draw.EventType.POLYGON:
      this.draw(os.ui.ol.interaction.DrawPolygon.TYPE);
      break;
    case os.ui.menu.draw.EventType.LINE:
      this.draw(os.interaction.DrawLine.TYPE);
      break;
    case os.ui.menu.draw.EventType.CHOOSE_AREA:
      os.ui.query.area.launchChooseArea(this.onAreaChosen.bind(this));
      break;
    default:
      break;
  }
};


/**
 * Opens the drawing menu.
 *
 * @export
 */
os.ui.draw.DrawPickerCtrl.prototype.toggleMenu = function() {
  var target = this.element.find('.js-draw-controls' + this['uid']);
  this.controlMenu.open(undefined, {
    my: 'left top+4',
    at: 'left bottom',
    of: target
  });
};


/**
 * Initializes drawing with the chosen control.
 *
 * @param {string} type The drawing type to initialize.
 * @export
 */
os.ui.draw.DrawPickerCtrl.prototype.draw = function(type) {
  var lastType = this['selectedType'];
  var wasActive = this['active'];
  this.onDrawCancel_();

  if (wasActive && lastType && lastType === type) {
    // user clicked the currently active button, so treat it as toggling the controls off
    return;
  }

  this['active'] = true;
  this['selectedType'] = type;
  var interaction;

  if (type == 'point') {
    // don't need an interaction for handling points
    this.enablePoint();
    return;
  } else if (type == os.ui.ol.interaction.DragBox.TYPE) {
    interaction = this.dragBox_;
  } else if (type == os.ui.ol.interaction.DragCircle.TYPE) {
    interaction = this.dragCircle_;
  } else if (type == os.ui.ol.interaction.DrawPolygon.TYPE) {
    interaction = this.drawPolygon_;
  } else if (type == os.interaction.DrawLine.TYPE) {
    interaction = this.drawLine_;
  }

  if (interaction) {
    interaction.setActive(true);
    interaction.setEnabled(true);
  }
};


/**
 * Enables a listener for clicks on the map
 */
os.ui.draw.DrawPickerCtrl.prototype.enablePoint = function() {
  if (!this.mapListenKey) {
    this.mapListenKey = ol.events.listen(this.map, ol.MapBrowserEventType.SINGLECLICK, this.onMapClick, this);
  }
};


/**
 * Enables a listener for clicks on the map
 */
os.ui.draw.DrawPickerCtrl.prototype.disablePoint = function() {
  if (this.mapListenKey) {
    ol.events.unlistenByKey(this.mapListenKey);
    this.mapListenKey = null;
  }
};


/**
 * Handles draw end events.
 *
 * @param {os.ui.draw.DrawEvent} event
 * @private
 */
os.ui.draw.DrawPickerCtrl.prototype.onDrawEnd_ = function(event) {
  if (event && event.geometry instanceof ol.geom.SimpleGeometry) {
    var geometry = /** @type {ol.geom.SimpleGeometry} */ (event.geometry);
    this.scope['callback'](geometry);
  }
};


/**
 * Handles draw cancel events.
 *
 * @param {(angular.Scope.Event|os.ui.draw.DrawEvent)=} opt_event
 * @private
 */
os.ui.draw.DrawPickerCtrl.prototype.onDrawCancel_ = function(opt_event) {
  if (opt_event) {
    opt_event.preventDefault();
  }

  // disable all interactions
  this.disablePoint();
  this.dragBox_.setActive(false);
  this.dragBox_.setEnabled(false);
  this.dragCircle_.setActive(false);
  this.dragCircle_.setEnabled(false);
  this.drawPolygon_.setActive(false);
  this.drawPolygon_.setEnabled(false);
  this.drawLine_.setActive(false);
  this.drawLine_.setEnabled(false);

  this['active'] = false;

  os.ui.apply(this.scope);
};


/**
 * Handle map browser events.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} 'false' to stop event propagation
 * @protected
 */
os.ui.draw.DrawPickerCtrl.prototype.onMapClick = function(mapBrowserEvent) {
  if (mapBrowserEvent.type == ol.MapBrowserEventType.SINGLECLICK &&
      mapBrowserEvent.coordinate && mapBrowserEvent.coordinate.length > 1) {
    // This UI will do everything in lon/lat
    var point = new ol.geom.Point(mapBrowserEvent.coordinate);
    this.scope['callback'](point);
  }

  return false;
};


/**
 * Handler for escape key presses.
 *
 * @param {goog.events.KeyEvent} event
 */
os.ui.draw.DrawPickerCtrl.prototype.onKey = function(event) {
  if (event.keyCode == goog.events.KeyCodes.ESC) {
    this.onDrawCancel_();
  }
};


/**
 * Handler for area chosen.
 *
 * @param {ol.Feature} feature The chosen area.
 */
os.ui.draw.DrawPickerCtrl.prototype.onAreaChosen = function(feature) {
  var geometry = feature.getGeometry();
  if (geometry instanceof ol.geom.SimpleGeometry) {
    this.scope['callback'](geometry);
  }
};


/**
 * Handler for ogc feature chosen.
 * @param {ol.Feature} feature The loaded ogc feature.
 */
os.ui.draw.DrawPickerCtrl.prototype.onOGCQueryFeatureChosen = function(feature) {
  this.onAreaChosen(feature);
};
