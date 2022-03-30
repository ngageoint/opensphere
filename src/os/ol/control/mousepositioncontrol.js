goog.declareModuleId('os.ol.control.MousePosition');

import OLMousePosition from 'ol/src/control/MousePosition.js';
import {toLonLat} from 'ol/src/proj.js';
import ViewHint from 'ol/src/ViewHint.js';

import BearingSettingsKeys from '../../bearing/bearingsettingskeys.js';
import DisplaySetting from '../../config/displaysetting.js';
import Settings from '../../config/settings.js';
import {padCoordinate, toDegreesDecimalMinutes, toSexagesimal} from '../../geo/geo.js';
import {normalizeLongitude} from '../../geo/geo2.js';
import {EPSG4326} from '../../proj/proj.js';
import {LocationSetting} from '../../ui/location/location.js';
import Format from '../../ui/location/locationformat.js';
import UnitManager from '../../unit/unitmanager.js';

const {listen, unlistenByKey} = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');


/**
 * Extends the OpenLayers 3 MousePosition control to allow switching between different coordinate formats.
 */
export default class MousePosition extends OLMousePosition {
  /**
   * Constructor.
   * @param {olx.control.MousePositionOptions=} opt_options Mouse position options.
   */
  constructor(opt_options) {
    opt_options = opt_options || {};
    opt_options.placeholder = 'No coordinate';

    super(opt_options);

    /**
     * @type {string}
     * @private
     */
    this.format_ = 'deg';

    /**
     * @type {!Object<string, ol.CoordinateFormatType>}
     * @private
     */
    this.formatMap_ = MousePosition.FormatMap;

    /**
     * @type {?Event}
     * @private
     */
    this.lastBrowserEvent_ = null;

    if (opt_options && opt_options.useSettings) {
      Settings.getInstance().listen(LocationSetting.POSITION, this.onFormatChange_, false, this);
      this.format_ = /** @type {string} */ (Settings.getInstance().get(
          LocationSetting.POSITION, Format.DEG));
    }

    this.setFormat_(this.format_);

    /**
     * @type {goog.events.Key}
     * @private
     */
    this.clickListenKey_ = null;
    if (this.element) {
      this.clickListenKey_ = listen(this.element, GoogEventType.CLICK, this.onMouseClick_,
          false, this);
    }

    UnitManager.getInstance().listen(GoogEventType.PROPERTYCHANGE, this.onUnitChange_, false, this);
    Settings.getInstance().listen(BearingSettingsKeys.BEARING_TYPE, this.onBearingChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    Settings.getInstance().unlisten(LocationSetting.POSITION, this.onFormatChange_, false, this);

    if (this.clickListenKey_) {
      unlistenByKey(this.clickListenKey_);
      this.clickListenKey_ = null;
    }

    UnitManager.getInstance().unlisten(GoogEventType.PROPERTYCHANGE, this.onUnitChange_, false, this);
    Settings.getInstance().unlisten(BearingSettingsKeys.BEARING_TYPE, this.onBearingChange_, false, this);

    super.disposeInternal();
  }

  /**
   * @param {SettingChangeEvent} event
   * @private
   */
  onFormatChange_(event) {
    if (event && typeof event.newVal == 'string') {
      this.setFormat_(event.newVal);
    }
  }

  /**
   * Updates the UI to reflect the new unit system.
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onUnitChange_(event) {
    this.setFormat_(this.format_);
  }

  /**
   * Set the format for the control.
   *
   * @param {string} format
   * @private
   */
  setFormat_(format) {
    if (!(format in this.formatMap_)) {
      format = 'deg';
    }

    var formatter = this.formatMap_[format];
    this.setCoordinateFormat(formatter);

    if (format !== this.format_) {
      this.format_ = format;

      var settingsFormats = Object.values(Format);
      if (settingsFormats.indexOf(this.format_) > -1) {
        // only put this in settings if it is one of the supported settings formats
        Settings.getInstance().set(LocationSetting.POSITION, this.format_);
      }
    }

    if (this.lastBrowserEvent_) {
      super.handleMouseMove(this.lastBrowserEvent_);
    }
  }

  /**
   * @inheritDoc
   */
  handleMouseMove(event) {
    super.handleMouseMove(event);
    this.lastBrowserEvent_ = event;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  updateHTML_(pixel) {
    var map = this.getMap();
    if (map && map.getView().getHints()[ViewHint.INTERACTING] <= 0) {
      super.updateHTML_(pixel);
    }
  }

  /**
   * @inheritDoc
   */
  handleMouseOut(event) {
    // do nothing. this causes the last mouse position to always be displayed instead of clearing the position.
  }

  /**
   * @param {goog.events.Event} event
   * @private
   */
  onMouseClick_(event) {
    var keys = Object.keys(this.formatMap_);
    var index = keys.indexOf(this.format_);

    if (index > keys.length) {
      index = 0;
    }

    var newFormat = keys[index + 1];
    this.setFormat_(newFormat);

    if (this.lastBrowserEvent_) {
      super.handleMouseMove(this.lastBrowserEvent_);
    }
  }

  /**
   * Return the position of the mouse pointer
   *
   * @param {ol.Coordinate=} opt_coord The coordinate
   * @return {string}
   * @suppress {accessControls} to allow access to the map and last pixel
   */
  getPositionString(opt_coord) {
    var coord = opt_coord || this.map_.getCoordinateFromPixel(this.lastMouseMovePixel_);
    if (coord) {
      var s = '';
      coord = toLonLat(coord, this.map_.getView().getProjection());
      for (var key in this.formatMap_) {
        var formatter = this.formatMap_[key];
        s += formatter(coord) + '\n';
      }

      // chop off the last newline
      s = s.substring(0, s.length - 1);
      return s.replace(/&deg;/g, '°');
    } else {
      return '';
    }
  }

  /**
   * Forces an update of the displayed text to show the new bearing.
   *
   * @private
   */
  onBearingChange_() {
    if (this.lastBrowserEvent_) {
      this.handleMouseMove(this.lastBrowserEvent_);
    }
  }

  /**
   * Get the element
   *
   * @return {Element}
   */
  getElement() {
    return this.element;
  }

  /**
   * @param {ol.Coordinate|undefined} coordinate
   * @return {string}
   */
  static LON_LAT_FORMAT(coordinate) {
    if (!coordinate) {
      return 'No coordinate';
    }

    // fix the number of decimal places
    var lon = padCoordinate(normalizeLongitude(
        coordinate[0], undefined, undefined, EPSG4326), true, 5);
    var lat = padCoordinate(coordinate[1], false, 5);

    if (lon.length < 10) {
      lon = '+' + lon;
    }

    if (lat.length < 9) {
      lat = '+' + lat;
    }

    return lat + ', ' + lon + ' (DD)' + MousePosition.elevation(coordinate);
  }

  /**
   * @param {ol.Coordinate} coordinate
   * @return {string}
   */
  static MGRS_FORMAT(coordinate) {
    return osasm.toMGRS(coordinate) + ' (MGRS)' + MousePosition.elevation(coordinate);
  }

  /**
   * @param {ol.Coordinate} coordinate
   * @return {string}
   */
  static SEXAGESIMAL_FORMAT(coordinate) {
    return (toSexagesimal(coordinate[1], false, false) + ' ' +
      toSexagesimal(
          normalizeLongitude(coordinate[0], undefined, undefined, EPSG4326),
          true, false) + ' (DMS)').replace(/°/g, '&deg;') + MousePosition.elevation(coordinate);
  }

  /**
   * @param {ol.Coordinate} coordinate
   * @return {string}
   */
  static DDM(coordinate) {
    return (toDegreesDecimalMinutes(coordinate[1], false, false) + ' ' +
      toDegreesDecimalMinutes(
          normalizeLongitude(coordinate[0], undefined, undefined, EPSG4326),
          true, false) + ' (DDM)')
        .replace(/°/g, '&deg;') + MousePosition.elevation(coordinate);
  }

  /**
   * If coordinate has elevation, it will add the elevation to the coordinate string.
   * @param {ol.Coordinate} coordinate The coordinate.
   * @return {string} The coordinate string with elevation appended to it if available.
   */
  static elevation(coordinate) {
    let coordString = '';
    if (coordinate && coordinate.length > 2 && Settings.getInstance().get(DisplaySetting.ENABLE_TERRAIN)) {
      const um = UnitManager.getInstance();
      const elevation = um.formatToBestFit('distance', coordinate[2], 'm', um.getBaseSystem(), 2);
      coordString = ' ' + elevation;
    }
    return coordString;
  }
}

/**
 * @type {!Object<string, ol.CoordinateFormatType>}
 */
MousePosition.FormatMap = {
  'deg': MousePosition.LON_LAT_FORMAT,
  'dms': MousePosition.SEXAGESIMAL_FORMAT,
  'ddm': MousePosition.DDM,
  'mgrs': MousePosition.MGRS_FORMAT
};
