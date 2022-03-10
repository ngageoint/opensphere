goog.declareModuleId('os.ui.query.AbstractQueryReader');

import Feature from 'ol/src/Feature';
import GML3 from 'ol/src/format/GML3';
import GeometryLayout from 'ol/src/geom/GeometryLayout';
import Polygon from 'ol/src/geom/Polygon';

import {extentToCoordinates} from '../../geo/geo.js';
import GeometryField from '../../geom/geometryfield.js';
import {METHOD_FIELD} from '../../interpolate.js';
import Method from '../../interpolatemethod.js';
import {createElementNS, unescape as xmlUnescape} from '../../xml.js';

const log = goog.require('goog.log');
const {getRandomString} = goog.require('goog.string');


const {default: IQueryReader} = goog.requireType('os.ui.query.IQueryReader');


/**
 * Abstract implementation of IQueryReader.
 *
 * @abstract
 * @implements {IQueryReader}
 */
export default class AbstractQueryReader {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {?string}
     * @protected
     */
    this.layerId = null;

    /**
     * @type {?Element}
     * @protected
     */
    this.filter = null;
  }

  /**
   * @inheritDoc
   */
  setFilter(filter) {
    this.filter = filter;
  }

  /**
   * @inheritDoc
   */
  setLayerId(layerId) {
    this.layerId = layerId;
  }

  /**
   * Parses an area and turns it into a feature.
   *
   * @param {Node} area The list of area elements
   * @return {?Feature}
   * @suppress {accessControls}
   */
  static parseArea(area) {
    try {
      if (area.localName in
          AbstractQueryReader.GML_READER.GEOMETRY_PARSERS[AbstractQueryReader.GML_NAMESPACE]) {
        var geom = createElementNS('GEOM', AbstractQueryReader.GML_NAMESPACE);
        geom.appendChild(area);
        var olGeom = AbstractQueryReader.GML_READER.readGeometryElement(geom, [{}]);
        if (olGeom instanceof Array) {
          var coordinates = extentToCoordinates(olGeom);
          olGeom = new Polygon([coordinates], GeometryLayout.XY);
        }

        // set the geometry to not be interpolated or normalized
        olGeom.set(METHOD_FIELD, Method.NONE);
        olGeom.set(GeometryField.NORMALIZED, true);

        var feature = new Feature();
        var name = xmlUnescape(area.getAttribute('areanamehint') || area.getAttribute('namehint') || 'New Area');
        feature.setId(getRandomString());
        feature.setGeometry(olGeom);
        feature.set('temp', true);
        feature.set('title', name);
        return feature;
      }
      return null;
    } catch (e) {
      log.error(logger, 'Failed to parse area!');
    }
  }
}

/**
 * The logger.
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.ui.query.AbstractQueryReader');

/**
 * @type {string}
 * @const
 */
AbstractQueryReader.GML_NAMESPACE = 'http://www.opengis.net/gml';

/**
 * @type {GML3}
 * @const
 */
AbstractQueryReader.GML_READER = new GML3();
