goog.declareModuleId('os.ui.ol.interaction.ContextMenu');

import Interaction from 'ol/src/interaction/Interaction.js';
import MapBrowserEventType from 'ol/src/MapBrowserEventType.js';

import '../../../ol/mixin/rendermixin.js';
import {rightClick} from '../../../ol/events/condition.js';
import {getAreaManager} from '../../../query/queryinstance.js';
import {getEventFeature, getFirstPolygon} from './interaction.js';

const Line = goog.require('goog.math.Line');

const {default: Menu} = goog.requireType('os.ui.menu.Menu');
const {default: ContextMenuOptions} = goog.requireType('os.ui.ol.interaction.ContextMenuOptions');


/**
 * Creates the menu when spatial areas are clicked
 */
export default class ContextMenu extends Interaction {
  /**
   * Constructor.
   * @param {ContextMenuOptions=} opt_options
   */
  constructor(opt_options) {
    var options = opt_options || {};
    super({});

    this.handleEvent = this.handleEvent_;

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
  handleEvent_(event) {
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
