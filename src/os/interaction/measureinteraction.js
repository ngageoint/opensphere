goog.declareModuleId('os.interaction.Measure');

import LineString from 'ol/src/geom/LineString.js';
import Point from 'ol/src/geom/Point.js';
import {MAC} from 'ol/src/has.js';
import {toLonLat} from 'ol/src/proj.js';
import Fill from 'ol/src/style/Fill.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';
import Text from 'ol/src/style/Text.js';

import {getFormattedBearing, modifyBearing} from '../bearing/bearing.js';
import BearingSettingsKeys from '../bearing/bearingsettingskeys.js';
import Settings from '../config/settings.js';
import {numDecimalPlaces, updateAll} from '../feature/measurefeature.js';
import {normalizeGeometryCoordinates} from '../geo/geo2.js';
import {METHOD_FIELD, getMethod} from '../interpolate.js';
import Method from '../interpolatemethod.js';
import * as osMap from '../map/map.js';
import {getMapContainer} from '../map/mapinstance.js';
import {getFont} from '../style/label.js';
import TimelineController from '../time/timelinecontroller.js';
import UnitChange from '../unit/unitchange.js';
import UnitManager from '../unit/unitmanager.js';
import DrawPolygon from './drawpolygoninteraction.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');


/**
 * Interaction to measure the distance between drawn points on the map.
 */
export default class Measure extends DrawPolygon {
  /**
   * Constructor.
   * @param {olx.interaction.PointerOptions=} opt_options
   */
  constructor(opt_options) {
    super();
    this.condition = measureCondition;
    this.defaultCondition = measureCondition;
    this.color = [255, 0, 0, 1];
    this.type = 'measure';

    /**
     * @type {number}
     * @private
     */
    this.lastlen_ = 0;

    /**
     * @type {Array<number>}
     * @private
     */
    this.bearings_ = [];

    /**
     * @type {Array<number>}
     * @private
     */
    this.distances_ = [];

    this.setStyle(new Style({
      stroke: new Stroke({
        color: this.color,
        lineCap: 'square',
        width: 2
      })
    }));

    /**
     * @type {!Array<!Style>}
     * @private
     */
    this.waypoints_ = [];

    UnitManager.getInstance().listen(GoogEventType.PROPERTYCHANGE, this.onUnitsChange_, false, this);
    Settings.getInstance().listen(BearingSettingsKeys.BEARING_TYPE, this.onChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    UnitManager.getInstance().unlisten(GoogEventType.PROPERTYCHANGE, this.onUnitsChange_, false, this);
    Settings.getInstance().unlisten(BearingSettingsKeys.BEARING_TYPE, this.onChange_, false, this);
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  getGeometry() {
    this.coords.length = this.coords.length - 1;
    const geom = new LineString(this.coords);
    normalizeGeometryCoordinates(geom);
    return geom;
  }

  /**
   * @inheritDoc
   */
  getProperties() {
    const props = {};
    props[METHOD_FIELD] = Measure.method;
    return props;
  }

  /**
   * @inheritDoc
   */
  shouldFinish(mapBrowserEvent) {
    return this.distances_.length > 0 && !mapBrowserEvent.originalEvent.shiftKey;
  }

  /**
   * @inheritDoc
   */
  begin(mapBrowserEvent) {
    if (this.line2D) {
      this.line2D = null;
    }

    super.begin(mapBrowserEvent);

    this.distances_.length = 0;
    this.bearings_.length = 0;
    this.waypoints_.length = 0;
    this.lastlen_ = 0;
  }

  /**
   * @inheritDoc
   */
  beforeUpdate(opt_mapBrowserEvent) {
    let result;
    const len = this.coords.length;
    if (len > 1) {
      const j = this.coords.length - 1;
      const i = j - 1;

      const start = toLonLat(this.coords[i], osMap.PROJECTION);
      const end = toLonLat(this.coords[j], osMap.PROJECTION);

      if (Measure.method === Method.GEODESIC) {
        result = osasm.geodesicInverse(start, end);
      } else {
        result = osasm.rhumbInverse(start, end);
      }
    }

    if (this.lastlen_ != len) {
      if (result) {
        this.distances_.push(result.distance);
        this.bearings_.push(result.initialBearing || result.bearing);
      }
    } else if (result && this.distances_.length > 0) {
      this.distances_[this.distances_.length - 1] = result.distance;
      this.bearings_[this.bearings_.length - 1] = result.initialBearing || result.bearing;
    }

    this.lastlen_ = len;
  }

  /**
   * @inheritDoc
   */
  getStyle() {
    const style = super.getStyle();
    return [style].concat(this.waypoints_);
  }

  /**
   * Creates waypoints to act as anchors for labels in OL3.
   *
   * @inheritDoc
   */
  update2D() {
    this.createOverlay();

    // add/update waypoints while drawing the line
    let waypoint = null;
    if (this.waypoints_.length === this.distances_.length) {
      // modify the last one
      waypoint = this.waypoints_[this.waypoints_.length - 1];
    } else {
      // create a new one and style it
      waypoint = new Style({
        text: Measure.getTextStyle_()
      });

      this.waypoints_.push(waypoint);
    }

    const i = this.distances_.length - 1;

    waypoint.setGeometry(new Point(this.coords[i]));
    waypoint.getText().setText(this.getDistanceText_(i));

    if (this.line2D) {
      this.line2D.setStyle(this.getStyle());
    }

    super.update2D();
  }

  /**
   * @inheritDoc
   */
  end(mapBrowserEvent) {
    if (this.drawing) {
      if (this.isType('measure')) {
        // add a total distance waypoint if there are multiple points
        if (this.waypoints_.length > 1) {
          const um = UnitManager.getInstance();
          const text = um.formatToBestFit('distance', this.getTotalDistance_(), 'm', um.getBaseSystem(),
              numDecimalPlaces);

          this.waypoints_.push(new Style({
            geometry: new Point(this.coords[this.coords.length - 1]),
            text: Measure.getTextStyle_(text)
          }));

          this.line2D.setStyle(this.getStyle());
        }

        let type = Measure.method;
        type = type.substring(0, 1).toUpperCase() + type.substring(1);

        Measure.nextId++;
        this.line2D.set('title', type + ' Measure ' + Measure.nextId);
        this.line2D.set('icons', ' <i class="fa fa-arrows-h" title="Measure feature"></i> ');
        getMapContainer().addFeature(this.line2D);
      }
      super.end(mapBrowserEvent);
    }
  }

  /**
   * Gets the text for the ith distance label.
   *
   * @param {number} i The index of the distance to use.
   * @param {boolean=} opt_noBearing Whether to exclude the bearing (for the last point)
   * @return {string}
   * @private
   */
  getDistanceText_(i, opt_noBearing) {
    const d = this.distances_[i];
    const coord = /** @type {Point} */ (this.waypoints_[i].getGeometry()).getCoordinates();
    const u = UnitManager.getInstance();
    let text = u.formatToBestFit('distance', d, 'm', u.getBaseSystem(), numDecimalPlaces);

    let bearing = this.bearings_[i];
    const date = new Date(TimelineController.getInstance().getCurrent());

    if (bearing !== undefined && !opt_noBearing && coord) {
      bearing = modifyBearing(bearing, coord, date);
      const formattedBearing = getFormattedBearing(bearing, numDecimalPlaces);
      text += ' Bearing: ' + formattedBearing;
    }

    return text;
  }

  /**
   * Gets the total distance for the measurement
   *
   * @return {number}
   * @private
   */
  getTotalDistance_() {
    let totalDist = 0;
    for (let i = 0; i < this.distances_.length; i++) {
      totalDist += this.distances_[i];
    }
    return totalDist;
  }

  /**
   * Listener for map unit changes. Updates the features on the map (if present) to reflect the new units.
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onUnitsChange_(event) {
    if (event.getProperty() == UnitChange) {
      this.onChange_();
      updateAll();
    }
  }

  /**
   * Updates the displayed measure text.
   *
   * @private
   */
  onChange_() {
    if (this.waypoints_.length > 0) {
      const n = this.waypoints_.length - 1;
      for (let i = 1; i < n; i++) {
        const dist = this.getDistanceText_(i);
        this.waypoints_[i].getText().setText(dist);
      }
      const um = UnitManager.getInstance();
      const totalDist = um.formatToBestFit('distance', this.getTotalDistance_(), 'm', um.getBaseSystem(),
          numDecimalPlaces);
      this.waypoints_[n].getText().setText(totalDist);

      if (this.line2D) {
        this.line2D.setStyle(this.getStyle());
      }
    }
  }

  /**
   * @inheritDoc
   */
  saveLast() {}

  /**
   * @param {string=} opt_text Optional text to apply to the style
   * @return {!Text} The text style
   * @private
   */
  static getTextStyle_(opt_text) {
    return new Text({
      font: getFont(Measure.LABEL_FONT_SIZE_),
      offsetX: 5,
      text: opt_text,
      textAlign: 'left',
      fill: new Fill({
        color: [0xff, 0xff, 0xff, 1]
      }),
      stroke: new Stroke({
        color: [0, 0, 0, 1],
        width: 2
      })
    });
  }
}

/**
 * Return true if only the ctrl or cmd-key and shift-key is pressed, false otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} Whether the condition is met.
 */
const measureCondition = function(mapBrowserEvent) {
  var originalEvent = mapBrowserEvent.originalEvent;
  return originalEvent.shiftKey && (MAC ? originalEvent.metaKey : originalEvent.ctrlKey) && !originalEvent.altKey;
};

/**
 * @type {number}
 */
Measure.nextId = 0;

/**
 * @type {number}
 * @const
 */
Measure.LABEL_FONT_SIZE_ = 14;

/**
 * @type {Method}
 */
Measure.method = getMethod();
