goog.module('os.ui.ol.interaction.ContextMenu');
goog.module.declareLegacyNamespace();

goog.require('os.ol.mixin.render');

const Line = goog.require('goog.math.Line');
const MapBrowserEventType = goog.require('ol.MapBrowserEventType');
const Interaction = goog.require('ol.interaction.Interaction');
const {rightClick} = goog.require('os.ol.events.condition');
const {getAreaManager} = goog.require('os.query.instance');
const {getEventFeature, getFirstPolygon} = goog.require('os.ui.ol.interaction');

const Feature = goog.requireType('ol.Feature');
const MapBrowserEvent = goog.requireType('ol.MapBrowserEvent');
const Layer = goog.requireType('ol.layer.Layer');
const Menu = goog.requireType('os.ui.menu.Menu');
const ContextMenuOptions = goog.requireType('os.ui.ol.interaction.ContextMenuOptions');


/**
 * Creates the menu when spatial areas are clicked
 */
class ContextMenu extends Interaction {
  /**
   * Constructor.
   * @param {ContextMenuOptions=} opt_options
   */
  constructor(opt_options) {
    var options = opt_options || {};
    super({
      handleEvent: ContextMenu.handleEvent
    });

    /**
     * The required map event condition to handle the event.
     * @type {function(MapBrowserEvent):boolean}
     * @protected
     */
    this.condition = options.condition || rightClick;

    /**
     * Menu for hit detected features.
     * @type {Menu|undefined}
     * @protected
     */
    this.featureMenu = options.featureMenu;

    /**
     * Menu for map actions.
     * @type {Menu<ol.Coordinate>|undefined}
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
  }

  /**
   * @param {MapBrowserEvent} event The event.
   * @return {boolean}
   * @this ContextMenu
   */
  static handleEvent(event) {
    // save the right-down info...
    if (event.type === MapBrowserEventType.POINTERDOWN) {
      this.downTime = Date.now();
      this.downPixel = event.pixel || [0, 0];
      return true;
    }

    // ... so we can skip this if it was more of a drag
    var time = Date.now();
    var pixel = event.pixel || [0, 0];
    var line = new Line(pixel[0], pixel[1], this.downPixel[0], this.downPixel[1]);

    if (time - this.downTime > 500 || line.getSegmentLength() > 10) {
      return true;
    }

    if (event && this.condition(event)) {
      this.handleEventInternal(event);
    }

    return true;
  }

  /**
   * Internal handler for map browser events.
   *
   * @param {!MapBrowserEvent} event The map browser event
   * @protected
   */
  handleEventInternal(event) {
    var feature = getEventFeature(event, getFirstPolygon);
    if (feature && getAreaManager().get(feature)) {
      this.openFeatureContextMenu(event, feature);
    }
  }

  /**
   * Open the map context menu.
   *
   * @param {Array<number>} coord The map coordinate to pass as an argument.
   * @param {Array<number>=} opt_pixel The menu position.
   * @protected
   */
  openMapContextMenu(coord, opt_pixel) {
    if (this.mapMenu) {
      var pos = opt_pixel || [0, 0];
      this.mapMenu.open(coord, {
        my: 'left top',
        at: 'left+' + pos[0] + ' top+' + pos[1],
        of: '#map-container'
      });
    }
  }

  /**
   * Open a context menu for a hit detected feature.
   *
   * @param {!MapBrowserEvent} event The map browser event
   * @param {!Feature} feature The feature
   * @param {Layer=} opt_layer The layer containing the feature
   * @protected
   */
  openFeatureContextMenu(event, feature, opt_layer) {
    if (this.featureMenu) {
      var context = {
        geometry: feature.getGeometry(),
        feature: feature,
        layer: opt_layer,
        map: event.map,
        mapBrowserEvent: event
      };

      var pixel = event.pixel || [0, 0];
      this.featureMenu.open(context, {
        my: 'left top',
        at: 'left+' + pixel[0] + ' top+' + pixel[1],
        of: '#map-container'
      });
    }
  }
}

exports = ContextMenu;
