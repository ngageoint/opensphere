goog.provide('os.im.mapping');
goog.provide('os.im.mapping.TimeFormat');
goog.provide('os.im.mapping.TimeType');

goog.require('goog.object');
goog.require('ol.Feature');
goog.require('os');
goog.require('os.mixin.feature');


/**
 * @type {string}
 * @const
 */
os.im.mapping.DEFAULT_SCORETYPE = 'default';


/**
 * @enum {string}
 */
os.im.mapping.TimeFormat = {
  ISO: 'ISO',
  TIMESTAMP: 'Timestamp'
};


/**
 * @enum {string}
 */
os.im.mapping.TimeType = {
  INSTANT: 'instant',
  START: 'start',
  END: 'end',
  PUBLICATION: 'publication'
};


/**
 * Returns the enum for the string
 * @param {string} input A string that matches an enum value from os.im.mapping.TimeType
 * @return {os.im.mapping.TimeType} A TimeType
 */
os.im.mapping.getTimeTypeForString = function(input) {
  if ('start' === input) {
    return os.im.mapping.TimeType.START;
  } else if ('end' === input) {
    return os.im.mapping.TimeType.END;
  } else if ('pub' == input) {
    return os.im.mapping.TimeType.PUBLICATION;
  } else {
    return os.im.mapping.TimeType.INSTANT;
  }
};


/**
 * Convenience function to get a mapping field from an item, or null if the field doesn't exist.
 * @param {Object} item
 * @param {string} field
 * @return {*}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.im.mapping.getItemField = function(item, field) {
  if (os.instanceOf(item, ol.Feature.NAME)) {
    return /** @type {!ol.Feature} */ (item).values_[field];
  } else {
    return item[field];
  }
};


/**
 * @param {Object} item
 * @return {Array.<string>}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.im.mapping.getItemFields = function(item) {
  if (os.instanceOf(item, ol.Feature.NAME)) {
    return goog.object.getKeys(/** @type {!ol.Feature} */ (item).values_);
  } else {
    return goog.object.getKeys(item);
  }
};


/**
 * Convenience function to set a mapping field on an item.. Setting the field to undefined will remove it.
 * @param {Object} item
 * @param {string} field
 * @param {*} value
 */
os.im.mapping.setItemField = function(item, field, value) {
  if (os.instanceOf(item, ol.Feature.NAME)) {
    var feature = /** @type {!ol.Feature} */ (item);
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
os.im.mapping.getBestFieldMatch = function(item, regex, opt_currentField) {
  var f = undefined;
  var currentFieldIndex = Number.MAX_VALUE;
  var fIndex = Number.MAX_VALUE;

  var obj = os.instanceOf(item, ol.Feature.NAME) ? /** @type {!ol.Feature} */ (item).values_ : item;
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
 * @param {Array.<os.im.mapping.IMapping.<T>>} mappings
 * @return {Array.<os.im.mapping.IMapping.<T>>}
 * @template T
 */
os.im.mapping.reduceMappings = function(mappings) {
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
 * @param {?string} input moment time format
 * @return {?string} java time format.
 */
os.im.mapping.momentFormatToJavaFormat = function(input) {
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
 * @param {?string} input moment time format
 * @return {?string} java time format.
 */
os.im.mapping.javaFormatToMomentFormat = function(input) {
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
 * @param {?string} input moment time format
 * @return {?string} java time format.
 */
os.im.mapping.localFieldToXmlField = function(input) {
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
 * @param {?string} input moment time format
 * @return {?string} java time format.
 */
os.im.mapping.xmlFieldToLocalField = function(input) {
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
