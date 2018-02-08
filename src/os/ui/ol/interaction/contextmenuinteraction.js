goog.provide('os.ui.ol.interaction.ContextMenu');

goog.require('goog.math.Line');
goog.require('ol.extent');
goog.require('ol.interaction.Interaction');
goog.require('os.ol.events.condition');
goog.require('os.ol.mixin.render');
goog.require('os.ui');
goog.require('os.ui.ol.interaction');


/**
 * @typedef {{
 *   condition: (function(ol.MapBrowserEvent):boolean|undefined),
 *   featureMenu: (os.ui.menu.Menu|undefined),
 *   mapMenu: (os.ui.menu.Menu<ol.Coordinate>|undefined)
 * }}
 */
os.ui.ol.interaction.ContextMenuOptions;



/**
 * Creates the menu when spatial areas are clicked
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {os.ui.ol.interaction.ContextMenuOptions=} opt_options
 */
os.ui.ol.interaction.ContextMenu = function(opt_options) {
  var options = opt_options || {};
  os.ui.ol.interaction.ContextMenu.base(this, 'constructor', {
    handleEvent: this.handleEvent.bind(this)
  });

  /**
   * The required map event condition to handle the event.
   * @type {function(ol.MapBrowserEvent):boolean}
   * @protected
   */
  this.condition = options.condition || os.ol.events.condition.rightClick;

  /**
   * Menu for hit detected features.
   * @type {os.ui.menu.Menu|undefined}
   * @protected
   */
  this.featureMenu = options.featureMenu;

  /**
   * Menu for map actions.
   * @type {os.ui.menu.Menu<ol.Coordinate>|undefined}
   * @protected
   */
  this.mapMenu = options.mapMenu;

  /**
   * @type {number}
   * @protected
   */
  this.downTime = 0;

  /**
   * @type {ol.Pixel}
   * @protected
   */
  this.downPixel = [0, 0];
};
goog.inherits(os.ui.ol.interaction.ContextMenu, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
os.ui.ol.interaction.ContextMenu.prototype.handleEvent = function(event) {
  // save the right-down info...
  if (event.type === ol.MapBrowserEventType.POINTERDOWN) {
    this.downTime = goog.now();
    this.downPixel = event.pixel || [0, 0];
    return true;
  }

  // ... so we can skip this if it was more of a drag
  var time = goog.now();
  var pixel = event.pixel || [0, 0];
  var line = new goog.math.Line(pixel[0], pixel[1], this.downPixel[0], this.downPixel[1]);

  if (time - this.downTime > 500 || line.getSegmentLength() > 10) {
    return true;
  }

  if (event && this.condition(event)) {
    this.handleEventInternal(event);
  }

  return true;
};


/**
 * Internal handler for map browser events.
 * @param {!ol.MapBrowserEvent} event The map browser event
 * @protected
 */
os.ui.ol.interaction.ContextMenu.prototype.handleEventInternal = function(event) {
  var feature = os.ui.ol.interaction.getEventFeature(event, os.ui.ol.interaction.getFirstPolygon);
  if (feature && os.ui.areaManager.get(feature)) {
    this.openFeatureContextMenu(event, feature);
  }
};


/**
 * Open the map context menu.
 * @param {Array<number>} coord The map coordinate to pass as an argument.
 * @param {Array<number>=} opt_pixel The menu position.
 * @protected
 */
os.ui.ol.interaction.ContextMenu.prototype.openMapContextMenu = function(coord, opt_pixel) {
  if (this.mapMenu) {
    var pos = opt_pixel || [0, 0];
    this.mapMenu.open(coord, {
      my: 'left top',
      at: 'left+' + pos[0] + ' top+' + pos[1],
      of: '#map-container'
    });
  }
};


/**
 * Open a context menu for a hit detected feature.
 * @param {!ol.MapBrowserEvent} event The map browser event
 * @param {!ol.Feature} feature The feature
 * @param {ol.layer.Layer=} opt_layer The layer containing the feature
 * @protected
 */
os.ui.ol.interaction.ContextMenu.prototype.openFeatureContextMenu = function(event, feature, opt_layer) {
  if (this.featureMenu) {
    var context = {
      geometry: feature.getGeometry(),
      feature: feature,
      layer: opt_layer,
      map: event.map
    };

    var pixel = event.pixel || [0, 0];
    this.featureMenu.open(context, {
      my: 'left top',
      at: 'left+' + pixel[0] + ' top+' + pixel[1],
      of: '#map-container'
    });
  }
};
