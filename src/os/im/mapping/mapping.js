goog.declareModuleId('os.im.mapping');

import Feature from 'ol/src/Feature.js';

import '../../mixin/featuremixin.js';
import instanceOf from '../../instanceof.js';
import TimeType from './timetype.js';

const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');


/**
 * @type {string}
 */
export const DEFAULT_SCORETYPE = 'default';

/**
 * Returns the enum for the string
 *
 * @param {string} input A string that matches an enum value from TimeType
 * @return {TimeType} A TimeType
 */
export const getTimeTypeForString = function(input) {
  if ('start' === input) {
    return TimeType.START;
  } else if ('end' === input) {
    return TimeType.END;
  } else if ('pub' == input) {
    return TimeType.PUBLICATION;
  } else {
    return TimeType.INSTANT;
  }
};

/**
 * Convenience function to get a mapping field from an item, or null if the field doesn't exist.
 *
 * @param {?Object|undefined} item
 * @param {?string|undefined} field
 * @return {*}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getItemField = function(item, field) {
  if (item && field) {
    if (item.values_ && item instanceof Feature) {
      return /** @type {!Feature} */ (item).values_[field];
    } else {
      return item[field];
    }
  }
};

/**
 * @param {Object} item
 * @return {Array<string>}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getItemFields = function(item) {
  if (item && item.values_ && instanceOf(item, Feature.NAME)) {
    return Object.keys(/** @type {!Feature} */ (item).values_);
  } else if (item) {
    return Object.keys(item);
  }

  return [];
};

/**
 * Convenience function to set a mapping field on an item.. Setting the field to undefined will remove it.
 *
 * @param {Object} item
 * @param {?string|undefined} field
 * @param {*} value
 */
export const setItemField = function(item, field, value) {
  if (field) {
    if (instanceOf(item, Feature.NAME)) {
      var feature = /** @type {!Feature} */ (item);
      if (value === undefined) {
        feature.unset(field, true);
      } else {
        feature.set(field, value, true);
      }
    } else if (value !== undefined) {
      item[field] = value;
    } else {
      delete item[field];
    }
  }
};

/**
 * Gets the best field in the item that matches the given regex. "Best" is currently defined as the
 * matched substring that is closest to the beginning of the field name.
 *
 * @param {T} item The item to examine
 * @param {RegExp} regex The regular expression
 * @param {string=} opt_currentField The current best field, if any
 *
 * @return {string|undefined} The best field that matched the regex. Undefined if none were found.
 * @template T
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
export const getBestFieldMatch = function(item, regex, opt_currentField) {
  var f = undefined;
  var currentFieldIndex = Number.MAX_VALUE;
  var fIndex = Number.MAX_VALUE;

  var obj = instanceOf(item, Feature.NAME) && item.values_ ? /** @type {!Feature} */ (item).values_ : item;
  for (var field in obj) {
    var matches = field.match(regex);
    if (matches && (matches.index < fIndex || (matches.index == fIndex && field.length < f.length))) {
      f = field;
      fIndex = matches.index;

      if (field == opt_currentField) {
        currentFieldIndex = fIndex;
      }
    }
  }

  if (f == null || fIndex > currentFieldIndex) {
    f = opt_currentField;
  }

  return f;
};

/**
 * Compares mappings and only returns the highest scored within each score type.
 *
 * @param {Array<IMapping<T>>} mappings
 * @return {Array<IMapping<T>>}
 * @template T
 */
export const reduceMappings = function(mappings) {
  var highScore = 0;

  // score the mappings
  var i = mappings.length;
  while (i--) {
    var m = mappings[i];
    highScore = Math.max(m.getScore(), highScore);
  }

  // remove mappings which don't score high enough
  i = mappings.length;
  while (i--) {
    var m = mappings[i];
    if (m.getScore() < highScore) {
      mappings.splice(i, 1);
    }
  }

  return mappings;
};

/**
 * Convert a moment time format to a java time format
 *
 * @param {?string} input moment time format
 * @return {?string} java time format.
 */
export const momentFormatToJavaFormat = function(input) {
  if (!input) {
    return null;
  }

  var retval = input;
  retval = retval.replace(/T/g, '\'T\''); // replaces T with a quoted 'T'
  retval = retval.replace(/Y/g, 'y'); // replaces Y with a y
  retval = retval.replace(/D/g, 'd'); // replaces Y with a y
  retval = retval.replace(/ZZ/g, 'Z'); // replaces ZZ with a Z
  return retval;
};

/**
 * Convert a moment time format to a java time format
 *
 * @param {?string} input moment time format
 * @return {?string} java time format.
 */
export const javaFormatToMomentFormat = function(input) {
  if (!input) {
    return null;
  }

  var retval = input;
  retval = retval.replace(/'T'/g, 'T'); // replaces quoted 'T' with T
  retval = retval.replace(/y/g, 'Y'); // replaces y with a Y
  retval = retval.replace(/d/g, 'D'); // replaces y with a Y
  return retval;
};

/**
 * Convert a local field to the common XML field format.
 * This only applies for columns that do not have a header.
 *
 * @param {?string|undefined} input moment time format
 * @return {?string} java time format.
 */
export const localFieldToXmlField = function(input) {
  if (!input) {
    return null;
  }

  var regex = /^(Column )(\d+)$/;
  var match = regex.exec(input);
  if (match && match.length == 3) {
    var idx = Number(match[2]) + 1; // swtich to 1 based index
    return 'COLUMN_' + idx;
  } else {
    // This should occur when there is a header.
    return input;
  }
};

/**
 * Convert the common XML field to a local field format.
 * This only applies for columns that do not have a header.
 *
 * @param {?string|undefined} input moment time format
 * @return {?string} java time format.
 */
export const xmlFieldToLocalField = function(input) {
  if (!input) {
    return null;
  }

  var regex = /^(COLUMN_)(\d+)$/;
  var match = regex.exec(input);
  if (match && match.length == 3) {
    var idx = Number(match[2]) - 1; // switch to 0 based index.
    return 'Column ' + idx;
  } else {
    // This should occur when there is a header.
    return input;
  }
};
