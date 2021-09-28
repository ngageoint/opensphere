goog.declareModuleId('os.proj');

import Settings from '../config/settings.js';
import * as osMap from '../map/map.js';

const asserts = goog.require('goog.asserts');
const log = goog.require('goog.log');
const olProj = goog.require('ol.proj');

const Logger = goog.requireType('goog.log.Logger');
const Projection = goog.requireType('ol.proj.Projection');


/**
 * @type {string}
 */
export const EPSG4326 = 'EPSG:4326';

/**
 * @type {string}
 */
export const EPSG3857 = 'EPSG:3857';

/**
 * @type {string}
 */
export const EPSG3031 = 'EPSG:3031';

/**
 * @type {string}
 */
export const EPSG3413 = 'EPSG:3413';

/**
 * @type {string}
 */
export const CRS84 = 'CRS:84';

/**
 * @type {string}
 */
export const GOOGLE = 'EPSG:900913';

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.proj');

/**
 * @param {boolean=} opt_all
 * @return {Array<Object<string, *>>}
 */
export const getProjections = function(opt_all) {
  var settings = Settings.getInstance();
  var projections = /** @type {Array<Object<string, *>>} */ (settings.get('projections', []));
  projections = projections.concat(/** @type {Array<Object<string, *>>} */ (
    settings.get('userProjections', [])));

  if (opt_all) {
    var toAdd = [olProj.get(EPSG3857), olProj.get(EPSG4326)];

    for (var i = 0, n = toAdd.length; i < n; i++) {
      var projection = toAdd[i];

      projections.unshift({
        'code': projection.getCode(),
        'title': i === 0 ? 'Web Mercator / Spherical Mercator' : 'Geographic / Equirectangular',
        'extent': projection.getExtent(),
        'worldExtent': projection.getWorldExtent(),
        'isGlobal': projection.isGlobal()
      });
    }
  }

  return projections;
};

/**
 * Loads projections from settings
 */
export const loadProjections = function() {
  var projections = getProjections();

  for (var i = 0, n = projections.length; i < n; i++) {
    var code = /** @type {!string} */ (projections[i]['code']);
    var def = /** @type {!string} */ (projections[i]['proj4']);

    if (code && def) {
      proj4.defs(code, def);
      var proj = olProj.get(code);

      if (proj) {
        proj.setGlobal(!!projections[i]['isGlobal']);

        var extent = /** @type {ol.Extent} */ (projections[i]['extent']);
        if (extent) {
          proj.setExtent(extent);
        }

        extent = /** @type {ol.Extent} */ (projections[i]['worldExtent']);
        if (extent) {
          proj.setWorldExtent(extent);
        }

        olProj.addEquivalentTransforms(
            olProj.EPSG4326.PROJECTIONS,
            [proj],
            olProj.getTransform(EPSG4326, code),
            olProj.getTransform(code, EPSG4326));

        olProj.addEquivalentTransforms(
            olProj.EPSG3857.PROJECTIONS,
            [proj],
            olProj.getTransform(EPSG3857, code),
            olProj.getTransform(code, EPSG3857));

        // check that the proper transforms exist
        asserts.assert(olProj.getTransform(EPSG4326, code));
        asserts.assert(olProj.getTransform(EPSG3857, code));
        asserts.assert(olProj.getTransform(CRS84, code));
      }
    }
  }
};

/**
 * @param {Object<string, *>} options The layer options
 * @return {?Projection} The best supported projection by both the layer and the application or
 *    null if none could be found. If projection(s) are not explicitly provided in the layer options, the
 *    current application projection will be returned.
 */
export const getBestSupportedProjection = function(options) {
  var appProj = osMap.PROJECTION;
  var desiredProjection = /** @type {string|undefined} */ (options['projection']);
  var supportedProjections = /** @type {Array<!string>} */ (options['projections'] || []);
  var preferredProjections = [EPSG4326, CRS84, EPSG3857, GOOGLE];

  if (desiredProjection) {
    preferredProjections.unshift(desiredProjection);
    supportedProjections.unshift(desiredProjection);
  }

  if (!supportedProjections.length) {
    // in the case that supported projections are not explicitly provided, we assume that the layer
    // supports the application projection
    return appProj;
  }

  preferredProjections.unshift(appProj.getCode());

  // sort supported layer projections by preferred projection order
  supportedProjections.sort(function(projCodeA, projCodeB) {
    var indexA = preferredProjections.indexOf(projCodeA);
    var indexB = preferredProjections.indexOf(projCodeB);

    indexA = indexA === -1 ? preferredProjections.length : indexA;
    indexB = indexB === -1 ? preferredProjections.length : indexB;

    return indexA - indexB;
  });

  for (var i = 0, n = supportedProjections.length; i < n; i++) {
    var p = olProj.get(supportedProjections[i]);

    if (p) {
      return olProj.equivalent(p, appProj) ? appProj : p;
    }
  }

  log.warning(logger, 'A supported projection could not be found for layer ' + options['id'] +
      '. projections=' + supportedProjections.toString());
  return null;
};

/**
 * Given a projection, returns the equivalent projection with the shortest code.
 *
 * @param {ol.ProjectionLike} proj
 * @return {Projection}
 * @suppress {accessControls}
 */
export const getBestEquivalent = function(proj) {
  var projection = olProj.get(proj);
  var projMap = olProj.projections.cache_;
  var shortest = '';
  for (var key in projMap) {
    if (key !== 'CRS:84' && olProj.equivalent(projMap[key], projection) &&
        (!shortest || key.length < shortest.length)) {
      shortest = key;
    }
  }

  return olProj.get(shortest);
};
