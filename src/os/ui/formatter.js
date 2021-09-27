goog.declareModuleId('os.ui.formatter');

import {sanitize} from './ui.js';

const instanceOf = goog.require('os.instanceOf');
const {linkify} = goog.require('os.string');
const TimeInstant = goog.require('os.time.TimeInstant');
const {URL_REGEXP_LINKY} = goog.require('os.url');


/**
 * @type {RegExp}
 */
export const ANCHOR = /<a /;

/**
 * Formats the data to be a link if it passes the regex
 *
 * @param {string} value The value
 * @return {string} The HTML for the cell
 */
export const urlNewTabFormatter = function(value) {
  if (typeof value !== 'object') {
    if (value != null) {
      // does this even have a URL?
      if (URL_REGEXP_LINKY.test(value) && !ANCHOR.test(value)) {
        var newValue = '';
        var splitVal = value.split(' ');
        var cite = 1;

        // If theres only 1 value, make it 'Link'
        if (splitVal.length === 1) {
          if (URL_REGEXP_LINKY.test(value)) {
            var cleanValue = sanitize(value);
            newValue = linkify(cleanValue, '_blank', 'slick-cell-link', cleanValue);
          }
        } else if (splitVal.length < 500) { // performance suffers horribly here for long text (browser-crashingly bad)
          // If theres more than 1 value, put a number on it
          splitVal.forEach(function(elem, index, arr) {
            if (URL_REGEXP_LINKY.test(elem)) {
              var url = sanitize(String(elem));
              elem = linkify(url, '_blank', 'slick-cell-link', url, '[' + cite + ']');
              cite++;
            }

            newValue = newValue.concat(elem) + ' ';
          });
        }
        // If this cell is a URL format, use it
        if (newValue !== '') {
          value = newValue.trim();
        }
      }
    }
  } else if (instanceOf(value, TimeInstant.NAME)) {
    value = value.toString();
  } else {
    value = '';
  }

  return value;
};
