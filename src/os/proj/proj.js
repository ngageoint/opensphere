goog.provide('os.proj');

goog.require('goog.asserts');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.proj');
goog.require('os.config.Settings');


/**
 * @const
 * @type {string}
 */
os.proj.EPSG4326 = 'EPSG:4326';


/**
 * @const
 * @type {string}
 */
os.proj.EPSG3857 = 'EPSG:3857';


/**
 * @const
 * @type {string}
 */
os.proj.EPSG3031 = 'EPSG:3031';


/**
 * @const
 * @type {string}
 */
os.proj.EPSG3413 = 'EPSG:3413';


/**
 * @const
 * @type {string}
 */
os.proj.CRS84 = 'CRS:84';


/**
 * @type {string}
 */
os.proj.GOOGLE = 'EPSG:900913';


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
os.proj.LOGGER_ = goog.log.getLogger('os.proj');


/**
 * @param {boolean=} opt_all
 * @return {Array<Object<string, *>>}
 */
os.proj.getProjections = function(opt_all) {
  var projections = /** @type {Array<Object<string, *>>} */ (os.settings.get('projections', []));
  projections = projections.concat(/** @type {Array<Object<string, *>>} */ (
      os.settings.get('userProjections', [])));

  if (opt_all) {
    var toAdd = [ol.proj.get(os.proj.EPSG3857), ol.proj.get(os.proj.EPSG4326)];

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
os.proj.loadProjections = function() {
  var projections = os.proj.getProjections();

  for (var i = 0, n = projections.length; i < n; i++) {
    var code = /** @type {!string} */ (projections[i]['code']);
    var def = /** @type {!string} */ (projections[i]['proj4']);

    if (code && def) {
      proj4.defs(code, def);
      var proj = ol.proj.get(code);

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

        ol.proj.addEquivalentTransforms(
            ol.proj.EPSG4326.PROJECTIONS,
            [proj],
            ol.proj.getTransform(os.proj.EPSG4326, code),
            ol.proj.getTransform(code, os.proj.EPSG4326));

        ol.proj.addEquivalentTransforms(
            ol.proj.EPSG3857.PROJECTIONS,
            [proj],
            ol.proj.getTransform(os.proj.EPSG3857, code),
            ol.proj.getTransform(code, os.proj.EPSG3857));

        // check that the proper transforms exist
        goog.asserts.assert(ol.proj.getTransform(os.proj.EPSG4326, code));
        goog.asserts.assert(ol.proj.getTransform(os.proj.EPSG3857, code));
        goog.asserts.assert(ol.proj.getTransform(os.proj.CRS84, code));
      }
    }
  }
};


/**
 * @param {Object<string, *>} options The layer options
 * @return {?ol.proj.Projection} The best supported projection by both the layer and the application or
 *    null if none could be found. If projection(s) are not explicitly provided in the layer options, the
 *    current application projection will be returned.
 */
os.proj.getBestSupportedProjection = function(options) {
  var appProj = os.map.PROJECTION;
  var desiredProjection = /** @type {string|undefined} */ (options['projection']);
  var supportedProjections = /** @type {Array<!string>} */ (options['projections'] || []);
  var preferredProjections = [os.proj.EPSG4326, os.proj.CRS84, os.proj.EPSG3857, os.proj.GOOGLE];

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
    var p = ol.proj.get(supportedProjections[i]);

    if (p) {
      return ol.proj.equivalent(p, appProj) ? appProj : p;
    }
  }

  goog.log.warning(os.proj.LOGGER_, 'A supported projection could not be found for layer ' + options['id'] +
      '. projections=' + supportedProjections.toString());
  return null;
};
