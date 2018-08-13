goog.provide('plugin.file.kml.ui.GeometryIcons');
goog.provide('plugin.file.kml.ui.NetworkLinkIcons');


/**
 * KML geometry icons. This is intentionally not an enum so the keys map to {@link ol.geom.GeometryType} values.
 * @type {Object.<string, string>}
 */
plugin.file.kml.ui.GeometryIcons = {
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


/**
 * KML network link icons.
 * @enum {string}
 */
plugin.file.kml.ui.NetworkLinkIcons = {
  ACTIVE: '<i class="fa fa-link fa-fw compact" title="KML network link"></i>',
  ERROR: '<i class="fa fa-unlink fa-fw compact" title="Unable to load network link"></i>',
  INACTIVE: '<i class="fa fa-link fa-fw compact" title="KML network link - enable to load"></i>',
  LOADING: '<i class="fa fa-link fa-fw compact" title="Loading network link..."></i>'
};
