goog.provide('os.proj');

goog.require('goog.asserts');
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
