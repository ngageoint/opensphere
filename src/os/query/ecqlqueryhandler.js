goog.provide('os.query.ECQLQueryHandler');

goog.require('os.filter.impl.ecql.AreaFormatter');
goog.require('os.filter.impl.ecql.ExclusionFormatter');
goog.require('os.filter.impl.ecql.FilterFormatter');
goog.require('os.query.QueryHandler');


/**
 * @constructor
 * @extends {os.query.QueryHandler}
 */
os.query.ECQLQueryHandler = function() {
  os.query.ECQLQueryHandler.base(this, 'constructor');

  this.setAreaFormatter(new os.filter.impl.ecql.AreaFormatter());
  this.setExclusionFormatter(new os.filter.impl.ecql.ExclusionFormatter());
  this.setFilterFormatter(new os.filter.impl.ecql.FilterFormatter());
  this.spatialRequired = true;
};
goog.inherits(os.query.ECQLQueryHandler, os.query.QueryHandler);


/**
 * @inheritDoc
 */
os.query.ECQLQueryHandler.prototype.createFilter = function() {
  var filter = os.query.ECQLQueryHandler.base(this, 'createFilter');
  // see os.filter.impl.ecql.FilterFormatter.writeLiteral_() for why this is necessary
  filter = filter.replace(/{openParen}/g, '(').replace(/{closeParen}/g, ')');
  return filter;
};
