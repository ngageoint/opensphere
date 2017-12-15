goog.provide('os.ui.ogc.query.OGCQueryHandler');
goog.require('os.net.ParamModifier');
goog.require('os.ogc.filter.ModifierConstants');
goog.require('os.ogc.filter.OGCExclusionFormatter');
goog.require('os.ogc.filter.OGCFilterFormatter');
goog.require('os.ogc.filter.OGCSpatialFormatter');
goog.require('os.ui.query.QueryHandler');



/**
 * @param {string=} opt_geomColumn
 * @constructor
 * @extends {os.ui.query.QueryHandler}
 */
os.ui.ogc.query.OGCQueryHandler = function(opt_geomColumn) {
  os.ui.ogc.query.OGCQueryHandler.base(this, 'constructor');
  this.setModifier(new os.net.ParamModifier('filter', 'filter', os.ogc.filter.ModifierConstants.FILTER, ''));
  this.setAreaFormatter(new os.ogc.filter.OGCSpatialFormatter(opt_geomColumn));
  this.setExclusionFormatter(new os.ogc.filter.OGCExclusionFormatter(opt_geomColumn));
  this.setFilterFormatter(new os.ogc.filter.OGCFilterFormatter());
  this.spatialRequired = true;
};
goog.inherits(os.ui.ogc.query.OGCQueryHandler, os.ui.query.QueryHandler);

