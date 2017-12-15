goog.provide('plugin.ogc.query.OGCQueryHandler');

goog.require('os.net.ParamModifier');
goog.require('os.ogc.filter.ModifierConstants');
goog.require('os.ogc.filter.OGCFilterFormatter');
goog.require('os.query.QueryHandler');
goog.require('plugin.ogc.query.OGCExclusionFormatter');
goog.require('plugin.ogc.query.OGCSpatialFormatter');



/**
 * @param {string=} opt_geomColumn
 * @constructor
 * @extends {os.query.QueryHandler}
 */
plugin.ogc.query.OGCQueryHandler = function(opt_geomColumn) {
  plugin.ogc.query.OGCQueryHandler.base(this, 'constructor');

  this.setModifier(new os.net.ParamModifier('filter', 'filter', os.ogc.filter.ModifierConstants.FILTER, ''));
  this.setAreaFormatter(new plugin.ogc.query.OGCSpatialFormatter(opt_geomColumn));
  this.setExclusionFormatter(new plugin.ogc.query.OGCExclusionFormatter(opt_geomColumn));
  this.setFilterFormatter(new os.ogc.filter.OGCFilterFormatter());
  this.spatialRequired = true;
};
goog.inherits(plugin.ogc.query.OGCQueryHandler, os.query.QueryHandler);

