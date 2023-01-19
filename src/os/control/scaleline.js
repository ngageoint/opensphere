goog.declareModuleId('os.control.ScaleLine');

import * as asserts from 'ol/src/asserts.js';
import OLScaleLine, {Units as OLUnits} from 'ol/src/control/ScaleLine.js';
import Units from 'ol/src/proj/Units.js';
import * as olProj from 'ol/src/proj.js';

import * as osMap from '../map/map.js';
import {UnitSystem} from '../unit/unit.js';
import UnitManager from '../unit/unitmanager.js';

const safe = goog.require('goog.dom.safe');
const GoogEventType = goog.require('goog.events.EventType');
const SafeHtml = goog.require('goog.html.SafeHtml');

const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');


/**
 */
export default class ScaleLine extends OLScaleLine {
  /**
   * Constructor.
   * @param {olx.control.ScaleLineOptions=} opt_options
   */
  constructor(opt_options) {
    super(opt_options);

    // initialize from unit manager
    var um = UnitManager.getInstance();
    this.setUnits(/** @type {ScaleLineUnits<string>} */ (um.getSelectedSystem()));

    // listen for unit manager changes
    um.listen(GoogEventType.PROPERTYCHANGE, this.onUnitsChange, false, this);

    this.LEADING_DIGITS = [1, 2, 5];
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    UnitManager.getInstance().unlisten(GoogEventType.PROPERTYCHANGE, this.onUnitsChange, false, this);
    super.disposeInternal();
  }

  /**
   * @param {PropertyChangeEvent} event
   * @protected
   */
  onUnitsChange(event) {
    var newVal = event.getNewValue();
    if (typeof newVal === 'string' && newVal != this.getUnits()) {
      this.setUnits(/** @type {ScaleLineUnits<string>} */ (newVal));
    }
  }

  /**
   * Hide the control.
   *
   * @protected
   * @suppress {accessControls}
   */
  hide() {
    if (this.renderedVisible_) {
      this.element.style.display = 'none';
      this.renderedVisible_ = false;
    }
  }

  /**
   * This is a copy of the original OpenLayers code, with additional bits for showing a single unit
   *
   * @inheritDoc
   * @suppress {accessControls}
   */
  updateElement_() {
    var viewState = this.viewState_;

    if (!viewState) {
      this.hide();
      return;
    }

    // The goal of the original Openlayers logic here is to get meters/pixel.
    // However, it is wrong (see issue #7086 for Openlayers) for some projections.
    var map = this.getMap();

    var p1 = map.getPixelFromCoordinate(viewState.center);
    if (!p1) {
      this.hide();
      return;
    }

    var p2 = p1.slice();
    p2[0] += 1;

    var c1 = map.getCoordinateFromPixel(p1);
    var c2 = map.getCoordinateFromPixel(p2);
    if (!c1 || !c2) {
      this.hide();
      return;
    }

    c1 = olProj.toLonLat(c1, osMap.PROJECTION);
    c2 = olProj.toLonLat(c2, osMap.PROJECTION);

    var pointResolution = window.osasm ? osasm.geodesicInverse(c1, c2).distance : NaN;
    var nominalCount = this.minWidth_ * pointResolution;
    var suffix = '';
    var units = this.getUnits();
    if (units == OLUnits.DEGREES) {
      var metersPerDegree = olProj.METERS_PER_UNIT[Units.DEGREES];
      pointResolution /= metersPerDegree;
      if (nominalCount < metersPerDegree / 60) {
        suffix = '\u2033'; // seconds
        pointResolution *= 3600;
      } else if (nominalCount < metersPerDegree) {
        suffix = '\u2032'; // minutes
        pointResolution *= 60;
      } else {
        suffix = '\u00b0'; // degrees
      }
    } else if (units == OLUnits.IMPERIAL) {
      if (nominalCount < 0.9144) {
        suffix = 'in';
        pointResolution /= 0.0254;
      } else if (nominalCount < 1609.344) {
        suffix = 'ft';
        pointResolution /= 0.3048;
      } else {
        suffix = 'mi';
        pointResolution /= 1609.344;
      }
    } else if (units == OLUnits.NAUTICAL || units == UnitSystem.NAUTICALMILE) {
      pointResolution /= 1852;
      suffix = 'nmi';
    } else if (units == OLUnits.METRIC) {
      if (nominalCount < 1) {
        suffix = 'mm';
        pointResolution *= 1000;
      } else if (nominalCount < 1000) {
        suffix = 'm';
      } else {
        suffix = 'km';
        pointResolution /= 1000;
      }
    } else if (units == OLUnits.US) {
      if (nominalCount < 0.9144) {
        suffix = 'in';
        pointResolution *= 39.37;
      } else if (nominalCount < 1609.344) {
        suffix = 'ft';
        pointResolution /= 0.30480061;
      } else {
        suffix = 'mi';
        pointResolution /= 1609.3472;
      }
    } else if (units == UnitSystem.MILE) { // allow for other unit systems
      suffix = 'mi';
      pointResolution /= 1609.3472;
    } else if (units == UnitSystem.YARD) {
      suffix = 'yd';
      pointResolution *= 1.09361;
    } else if (units == UnitSystem.FEET) {
      suffix = 'ft';
      pointResolution /= 0.30480061;
    } else {
      asserts.assert(false, 33); // Invalid units
    }

    var i = 3 * Math.floor(Math.log(this.minWidth_ * pointResolution) / Math.log(10));
    var count;
    var width;
    while (true) {
      count = this.LEADING_DIGITS[((i % 3) + 3) % 3] * Math.pow(10, Math.floor(i / 3));
      width = Math.round(count / pointResolution);
      if (isNaN(width)) {
        this.element.style.display = 'none';
        this.renderedVisible_ = false;
        return;
      } else if (width >= this.minWidth_) {
        break;
      }
      ++i;
    }

    var displayNum = count;
    if (count < 1E-2 || count > 1E4) { // fixes overlapping labels at zoom level 20+ and 3-
      displayNum = count.toExponential();
    }
    var html = displayNum + ' ' + suffix;

    if (this.renderedHTML_ != html && this.innerElement_) {
      safe.setInnerHtml(this.innerElement_, SafeHtml.htmlEscape(html));
      this.renderedHTML_ = html;
    }

    if (this.renderedWidth_ != width) {
      this.innerElement_.style.width = width + 'px';
      this.renderedWidth_ = width;
    }

    if (!this.renderedVisible_) {
      this.element.style.display = '';
      this.renderedVisible_ = true;
    }
  }

  /**
   * Get the element
   *
   * @suppress {accessControls}
   * @return {Element}
   */
  getElement() {
    return this.element_;
  }
}
