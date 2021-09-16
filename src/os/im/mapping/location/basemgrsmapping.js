goog.module('os.im.mapping.location.BaseMGRSMapping');

const {MGRS_REGEXP} = goog.require('os.geo');
const {getItemField} = goog.require('os.im.mapping');
const AbstractPositionMapping = goog.require('os.im.mapping.AbstractPositionMapping');


/**
 * Mapping to translate an MGRS coordinate string to a point geometry.
 *
 * @extends {AbstractPositionMapping<T, S>}
 * @template T, S
 */
class BaseMGRSMapping extends AbstractPositionMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * Maps an MGRS coordinate string to a geometry.
   *
   * @param {T} item The feature to modify
   * @param {S=} opt_targetItem The optional target item
   * @throws {Error} If the location field cannot be parsed.
   * @override
   */
  execute(item, opt_targetItem) {
    if (this.field) {
      var mgrs = getItemField(item, this.field);
      if (mgrs) {
        mgrs = mgrs.replace(/\s/g, '');
        mgrs = mgrs.toUpperCase();

        if (mgrs.match(MGRS_REGEXP)) {
          var coord = osasm.toLonLat(mgrs);
          item[this.field] = coord;
        } else {
          throw new Error('"' + mgrs + '" does not appear to be a valid MGRS coordinate!');
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  testField(value) {
    if (value) {
      var mgrs = value.replace(/\s/g, '');
      mgrs = mgrs.toUpperCase();
      return mgrs.match(MGRS_REGEXP) != null;
    }
    return false;
  }
}

exports = BaseMGRSMapping;
