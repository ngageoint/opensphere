goog.provide('os.im.mapping.location.BaseMGRSMapping');
goog.require('os.geo');
goog.require('os.im.mapping.AbstractMapping');
goog.require('os.im.mapping.AbstractPositionMapping');



/**
 * Mapping to translate an MGRS coordinate string to a point geometry.
 * @extends {os.im.mapping.AbstractPositionMapping.<T, S>}
 * @constructor
 * @template T, S
 */
os.im.mapping.location.BaseMGRSMapping = function() {
  os.im.mapping.location.BaseMGRSMapping.base(this, 'constructor');
};
goog.inherits(os.im.mapping.location.BaseMGRSMapping, os.im.mapping.AbstractPositionMapping);


/**
 * Maps an MGRS coordinate string to a geometry.
 * @param {T} item The feature to modify
 * @param {S=} opt_targetItem The optional target item
 * @throws {Error} If the location field cannot be parsed.
 * @override
 */
os.im.mapping.location.BaseMGRSMapping.prototype.execute = function(item, opt_targetItem) {
  if (this.field) {
    var mgrs = os.im.mapping.getItemField(item, this.field);
    if (mgrs) {
      mgrs = mgrs.replace(/\s/g, '');
      mgrs = mgrs.toUpperCase();

      if (mgrs.match(os.geo.MGRS_REGEXP)) {
        var coord = osasm.toLonLat(mgrs);
        item[this.field] = coord;
      } else {
        throw new Error('"' + mgrs + '" does not appear to be a valid MGRS coordinate!');
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.location.BaseMGRSMapping.prototype.testField = function(value) {
  if (value) {
    var mgrs = value.replace(/\s/g, '');
    mgrs = mgrs.toUpperCase();
    return mgrs.match(os.geo.MGRS_REGEXP) != null;
  }
  return false;
};
