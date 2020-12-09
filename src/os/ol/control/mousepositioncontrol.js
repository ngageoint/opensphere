goog.module('os.ol.control.MousePosition');
goog.module.declareLegacyNamespace();

goog.require('ol.coordinate');
goog.require('os.config.DisplaySettings');
goog.require('os.ui.user.settings.LocationSetting');
const geo = goog.require('os.geo');
const settings = goog.require('os.config.Settings');
const EventType = goog.require('goog.events.EventType');
const ViewHint = goog.require('ol.ViewHint');
const olControlMousePosition = goog.require('ol.control.MousePosition');
const bearing = goog.require('os.bearing');
const location = goog.require('os.ui.location');


/**
 * Extends the OpenLayers 3 MousePosition control to allow switching between different coordinate formats.
 */
class MousePosition extends olControlMousePosition {
  /**
   * Constructor.
   * @param {olx.control.MousePositionOptions=} opt_options Mouse position options.
   */
  constructor(opt_options) {
    opt_options = opt_options || {};
    opt_options.undefinedHTML = 'No coordinate';

    super(opt_options);

    /**
     * @type {string}
     * @private
     */
    this.format_ = 'deg';

    /**
     * @type {Object<string, ol.CoordinateFormatType>}
     * @private
     */
    this.formatMap_ = MousePosition.FormatMap;

    /**
     * @type {?Event}
     * @private
     */
    this.lastBrowserEvent_ = null;

    if (opt_options && opt_options.useSettings) {
      settings.getInstance().listen(location.LocationSetting.POSITION, this.onFormatChange_, false, this);
      this.format_ = /** @type {string} */ (settings.getInstance().get(
          location.LocationSetting.POSITION, location.Format.DEG));
    }

    this.setFormat_(this.format_);

    /**
     * @type {goog.events.Key}
     * @private
     */
    this.clickListenKey_ = null;
    if (this.element) {
      this.clickListenKey_ = goog.events.listen(this.element, EventType.CLICK, this.onMouseClick_,
          false, this);
    }

    os.unit.UnitManager.getInstance().listen(EventType.PROPERTYCHANGE, this.onUnitChange_, false, this);
    settings.getInstance().listen(bearing.BearingSettingsKeys.BEARING_TYPE, this.onBearingChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    settings.getInstance().unlisten(location.LocationSetting.POSITION, this.onFormatChange_, false, this);

    if (this.clickListenKey_) {
      goog.events.unlistenByKey(this.clickListenKey_);
      this.clickListenKey_ = null;
    }

    os.unit.UnitManager.getInstance().unlisten(EventType.PROPERTYCHANGE, this.onUnitChange_, false, this);
    settings.getInstance().unlisten(bearing.BearingSettingsKeys.BEARING_TYPE, this.onBearingChange_, false, this);

    super.disposeInternal();
  }

  /**
   * @param {os.events.SettingChangeEvent} event
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
   * @param {os.events.PropertyChangeEvent} event
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

      var settingsFormats = goog.object.getValues(location.Format);
      if (settingsFormats.indexOf(this.format_) > -1) {
        // only put this in settings if it is one of the supported settings formats
        settings.getInstance().set(location.LocationSetting.POSITION, this.format_);
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
    var keys = goog.object.getKeys(this.formatMap_);
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
      coord = ol.proj.toLonLat(coord, this.map_.getView().getProjection());
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
    var lon = geo.padCoordinate(os.geo2.normalizeLongitude(
        coordinate[0], undefined, undefined, os.proj.EPSG4326), true, 5);
    var lat = geo.padCoordinate(coordinate[1], false, 5);

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
    return (geo.toSexagesimal(coordinate[1], false, false) + ' ' +
      geo.toSexagesimal(
          os.geo2.normalizeLongitude(coordinate[0], undefined, undefined, os.proj.EPSG4326),
          true, false) + ' (DMS)').replace(/°/g, '&deg;') + MousePosition.elevation(coordinate);
  }

  /**
   * @param {ol.Coordinate} coordinate
   * @return {string}
   */
  static DDM(coordinate) {
    return (geo.toDegreesDecimalMinutes(coordinate[1], false, false) + ' ' +
      geo.toDegreesDecimalMinutes(
          os.geo2.normalizeLongitude(coordinate[0], undefined, undefined, os.proj.EPSG4326),
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
    if (coordinate && coordinate.length > 2 && settings.getInstance().get(os.config.DisplaySetting.ENABLE_TERRAIN)) {
      const um = os.unit.UnitManager.getInstance();
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


exports = MousePosition;
