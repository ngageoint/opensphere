goog.module('os.ui.query.AbstractQueryReader');

const log = goog.require('goog.log');
const {getRandomString} = goog.require('goog.string');
const Feature = goog.require('ol.Feature');
const GML3 = goog.require('ol.format.GML3');
const GeometryLayout = goog.require('ol.geom.GeometryLayout');
const Polygon = goog.require('ol.geom.Polygon');
const {extentToCoordinates} = goog.require('os.geo');
const GeometryField = goog.require('os.geom.GeometryField');
const {METHOD_FIELD} = goog.require('os.interpolate');
const Method = goog.require('os.interpolate.Method');
const {createElementNS, unescape: xmlUnescape} = goog.require('os.xml');

const IQueryReader = goog.requireType('os.ui.query.IQueryReader');


/**
 * Abstract implementation of IQueryReader.
 *
 * @abstract
 * @implements {IQueryReader}
 */
class AbstractQueryReader {
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
          AbstractQueryReader.GML_READER.GEOMETRY_PARSERS_[AbstractQueryReader.GML_NAMESPACE]) {
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

exports = AbstractQueryReader;
