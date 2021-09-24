goog.declareModuleId('plugin.file.kml.ui.GeometryIcons');

/**
 * KML geometry icons. This is intentionally not an enum so the keys map to {@link ol.geom.GeometryType} values.
 * @type {Object.<string, string>}
 */
export default {
  'Circle': '<i class="fa fa-circle-o fa-fw compact" title="Circle Geometry"></i>',
  'GeometryCollection': '<i class="fa fa-picture-o fa-fw compact" title="Geometry Collection"></i>',
  'LineString': '<i class="fa fa-share-alt fa-fw compact" title="Line String Geometry"></i>',
  'LinearRing': '<i class="fa fa-square-o fa-fw compact" title="Linear Ring Geometry"></i>',
  'MultiPoint': '<i class="fa fa-th fa-fw compact" title="Multi Point Geometry"></i>',
  'MultiLineString': '<i class="fa fa-slack fa-fw compact" title="Multi Line String Geometry"></i>',
  'MultiPolygon': '<i class="fa fa-bullseye fa-fw compact" title="Multi Polygon Geometry"></i>',
  'Point': '<i class="fa fa-circle fa-fw compact" title="Point Geometry"></i>',
  'Polygon': '<i class="fa fa-star-o fa-fw compact" title="Polygon Geometry"></i>'
};
