goog.declareModuleId('os.geo');

import Feature from 'ol/src/Feature.js';
import Geometry from 'ol/src/geom/Geometry.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import Point from 'ol/src/geom/Point.js';

import '../mixin/geometrymixin.js';
import {arrayCopy} from '../array/array.js';
import * as easing from '../easing/easing.js';
import {getFunctionalExtent} from '../extent.js';
import GeometryField from '../geom/geometryfield.js';
import {getMethod as getInterpolateMethod} from '../interpolate.js';
import Method from '../interpolatemethod.js';
import {isWorldQuery} from '../query/queryutils.js';
import ParseConf from './parseconf.js';

const {buildString, padNumber} = goog.require('goog.string');


/**
 * @typedef {function(number, number, number, number)}
 * @deprecated Please use easing.EasingFunction instead
 */
export let EasingFunction;

/**
 * @typedef {{
 *   a: number,
 *   b: number,
 *   f: number
 * }}
 */
export let Ellipsoid;

/**
 * @enum {Ellipsoid}
 * @deprecated Please use osasm library
 */
export const VINCENTY_ELLIPSOIDS = {
  WGS84: {
    a: 6378137,
    b: 6356752.3142,
    f: 1 / 298.257223563
  }
};

/**
 * @type {!RegExp}
 */
export const MGRS_REGEXP = /^(([\d]{1,2}[C-X][A-Z]{2}([0-9][0-9]){0,5})|([ABYZ][A-Z]{2}([0-9][0-9]){0,5}))$/;

/**
 * @type {number}
 */
export const EPSILON = 1E-12;

/**
 * @type {number}
 */
export const MAX_LINE_LENGTH = 19000000;// meters

/**
 * @type {!RegExp}
 */
export const ALT_REGEXP = /(ele(v(a(t(i(o(n)?)?)?)?)?)|alt(i(t(u(d(e)?)?)?)?)?)\b/i;

/**
 * @type {!RegExp}
 */
export const ALT_UNITS_REGEXP = /((ele(v(a(t(i(o(n)?)?)?)?)?)|alt(i(t(u(d(e)?)?)?)?)?))_units\b/i;

/**
 * Regular expression to detect an inverse altitude field.
 * @type {!RegExp}
 */
export const ALT_INVERSE_REGEXP = /(depth)\b/i;

/**
 * Regular expression to detect an inverse altitude units field.
 * @type {!RegExp}
 */
export const ALT_INVERSE_UNITS_REGEXP = /(depth)_units\b/i;

/**
 * @type {!RegExp}
 */
export const MGRSRegExp = /^mgrs\s*(d(e(r(i(v(e(d?)?)?)?)?)?)?)?$/i;

/**
 * Attempting to idiot proof coordinates.
 * @type {!RegExp}
 */
export const COORD_CLEANER = /[^NEWSnews\d\s.\-,]/g;

/**
 * @type {number}
 */
export const PREFER_LAT_FIRST = 0;

/**
 * @type {number}
 */
export const PREFER_LON_FIRST = 1;

/**
 * @type {string}
 */
const START_ = '^\\s*';

/**
 * @type {string}
 */
const MIDDLE_ = '[^\\w\\.+-]+';

/**
 * @type {string}
 */
const OPT_DIRECTION_ = '([NSEW]?)';

/**
 * @type {string}
 */
const REQUIRED_DIRECTION_ = '([NSEW])';

/**
 * @type {string}
 */
const END_ = '[^NSEW\\d]*$';

/**
 * Matches the longitude portion of a DMS coordinate.
 *  - Preceded by optional direction/white space/sign.
 *  - Degrees required as 1-3 digits. If 3 digits, the first must be a 0 or 1.
 *  - Minutes required as 2 digits.
 *  - Seconds required as 2 digits.
 *  - Optional decimal seconds, or milliarcseconds (3 digits without a decimal).
 *
 * @type {string}
 */
const DMS_LON_ = '([NSEW]?)[\\s]*([-+]?[01]?\\d{1,2})(\\d{2})(\\d{2}(\\.\\d*|\\d{3})?)[\\s]*';

/**
 * Matches the latitude portion of a DMS coordinate.
 *  - Preceded by optional direction/white space/sign.
 *  - Degrees required as 1-2 digits.
 *  - Minutes required as 2 digits.
 *  - Seconds required as 2 digits.
 *  - Optional decimal seconds, or milliarcseconds (3 digits without a decimal).
 *
 * @type {string}
 */
const DMS_LAT_ = '([NSEW]?)[\\s]*([-+]?\\d{1,2})(\\d{2})(\\d{2}(\\.\\d*|\\d{3})?)[\\s]*';

/**
 * @type {string}
 */
const DMS_RELAXED_ = '([NSEW]?)[\\s]*([-+]?\\d{1,3}[\\.]?)(\\d{2}[\\.]?)(\\d{2}(\\.\\d*|\\d{3})?)?[\\s]*';

/**
 * Matches the longitude portion of a DDM coordinate.
 *  - Preceded by optional direction/white space/sign.
 *  - Degrees required as 1-3 digits. If 3 digits, the first must be a 0 or 1.
 *  - Minutes required as 2 digits.
 *  - Optional decimal minutes.
 *
 * @type {string}
 */
const DDM_LON_ = '([NSEW]?)[\\s]*([-+]?[01]?\\d{1,2})(\\d{2}(?:\\.\\d*)?)[\\s]*';

/**
 * Matches the latitude portion of a DDM coordinate.
 *  - Preceded by optional direction/white space/sign.
 *  - Degrees required as 1-2 digits.
 *  - Minutes required as 2 digits.
 *  - Optional decimal minutes.
 *
 * @type {string}
 */
const DDM_LAT_ = '([NSEW]?)[\\s]*([-+]?\\d{1,2})(\\d{2}(?:\\.\\d*)?)[\\s]*';

/**
 * @type {string}
 */
const DDM_RELAXED_ = '([NSEW]?)[\\s]*([-+]?\\d{1,3}[\\.]?)(\\d{2}\\.\\d*)?[\\s]*';

/**
 * @type {string}
 */
const DDM_RELAXED_NO_DECIMAL_ = '([NSEW]?)[\\s]*([-+]?\\d{1,3}[\\.]?)(\\d{2})?[\\s]*';

/**
 * @type {string}
 */
const DMS_DELIMITED_LON_ = '([NSEW]?)[\\s]*([-+]?\\d{1,3})[\\s,:°]+' +
    '(\\d{1,2})([\\s\\\',:]+' +
    '(\\d{1,2}(\\.\\d*|\\d{3})?))?[\\s\\"\\\']*';

/**
 * @type {string}
 */
const DMS_DELIMITED_LAT_ = '([NSEW]?)[\\s]*([-+]?\\d{1,2})[\\s,:°]+' +
    '(\\d{1,2})([\\s\\\',:]+' +
    '(\\d{1,2}(\\.\\d*|\\d{3})?))?[\\s\\"\\\']*';

/**
 * @type {string}
 */
const DMS_DELIMITED_RELAXED_ = DMS_DELIMITED_LON_;

/**
 * @type {string}
 */
const DDM_DELIMITED_LON_ = '([NSEW]?)[\\s]*([-+]?\\d{1,3})[\\s,:°]+' +
    '(\\d{1,2}(\\.\\d*|\\d{3})?)?[\\s\\\']*';

/**
 * @type {string}
 */
const DDM_DELIMITED_LAT_ = '([NSEW]?)[\\s]*([-+]?\\d{1,2})[\\s,:°]+' +
    '(\\d{1,2}(\\.\\d*|\\d{3})?)?[\\s\\\']*';

/**
 * @type {string}
 */
const DDM_DELIMITED_RELAXED_ = DDM_DELIMITED_LON_;

/**
 * @type {string}
 */
const DECIMAL_LON_ = '([NSEW]?)[\\s]*([-+]?\\d{1,3}(\\.\\d*)?)[\\s,:°]*';

/**
 * @type {string}
 */
const DECIMAL_LAT_ = '([NSEW]?)[\\s]*([-+]?\\d{1,2}(\\.\\d*)?)[\\s,:°]*';

/**
 * @type {string}
 */
const DECIMAL_RELAXED_ = DECIMAL_LON_;

/**
 * @type {Array<Array<ParseConf>>}
 */
const parseConfigsDD_ = [
  [
    new ParseConf(
        new RegExp(START_ + DECIMAL_LAT_ + OPT_DIRECTION_ + MIDDLE_ + DECIMAL_LON_ +
            OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: null, sec: null, dir: [1, 4]}, {deg: 6, min: null, sec: null, dir: [5, 8]}])
  ],
  [
    new ParseConf(
        new RegExp(START_ + DECIMAL_LON_ + OPT_DIRECTION_ + MIDDLE_ + DECIMAL_LAT_ +
            OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: null, sec: null, dir: [1, 4]}, {deg: 6, min: null, sec: null, dir: [5, 8]}])
  ]
];

/**
 * @type {Array<Array<ParseConf>>}
 */
const parseConfigsDDNoMiddle_ = [
  [
    new ParseConf(
        new RegExp(START_ + DECIMAL_LAT_ + REQUIRED_DIRECTION_ + DECIMAL_LON_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: null, sec: null, dir: [1, 4]}, {deg: 6, min: null, sec: null, dir: [5, 8]}])
  ],
  [
    new ParseConf(
        new RegExp(START_ + DECIMAL_LAT_ + REQUIRED_DIRECTION_ + DECIMAL_LON_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: null, sec: null, dir: [1, 4]}, {deg: 6, min: null, sec: null, dir: [5, 8]}])
  ]
];

/**
 * @type {Array<ParseConf>}
 */
const parseConfigsDDRELAXED_ = [
  new ParseConf(
      new RegExp(START_ + DECIMAL_RELAXED_ + OPT_DIRECTION_ + MIDDLE_ +
          DECIMAL_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: null, sec: null, dir: [1, 4]}, {deg: 6, min: null, sec: null, dir: [5, 8]}])
];

/**
 * @type {Array<ParseConf>}
 */
const parseConfigsDDRELAXEDNoMiddle_ = [
  new ParseConf(
      new RegExp(START_ + DECIMAL_RELAXED_ + REQUIRED_DIRECTION_ + DECIMAL_RELAXED_ +
          REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: null, sec: null, dir: [1, 4]}, {deg: 6, min: null, sec: null, dir: [5, 8]}])
];

/**
 * @type {Array<Array<ParseConf>>}
 */
const parseConfigsDMS_ = [
  [
    new ParseConf(
        new RegExp(START_ + DMS_DELIMITED_LAT_ + OPT_DIRECTION_ + MIDDLE_ +
            DMS_DELIMITED_LON_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 5, dir: [1, 7]}, {deg: 9, min: 10, sec: 12, dir: [8, 14]}]),
    new ParseConf(
        new RegExp(START_ + DMS_LAT_ + OPT_DIRECTION_ + MIDDLE_ + DMS_LON_ +
            OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 10, dir: [7, 12]}]),
    new ParseConf(
        new RegExp(START_ + DMS_DELIMITED_LAT_ + OPT_DIRECTION_ + MIDDLE_ +
            DMS_LON_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 5, dir: [1, 7]}, {deg: 9, min: 10, sec: 11, dir: [8, 13]}]),
    new ParseConf(
        new RegExp(START_ + DMS_LAT_ + OPT_DIRECTION_ + MIDDLE_ +
            DMS_DELIMITED_LON_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 11, dir: [7, 13]}])
  ],
  [
    new ParseConf(
        new RegExp(START_ + DMS_DELIMITED_LON_ + OPT_DIRECTION_ + MIDDLE_ +
            DMS_DELIMITED_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 5, dir: [1, 7]}, {deg: 9, min: 10, sec: 12, dir: [8, 14]}]),
    new ParseConf(
        new RegExp(START_ + DMS_LON_ + OPT_DIRECTION_ + MIDDLE_ + DMS_LAT_ +
            OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 10, dir: [7, 12]}]),
    new ParseConf(
        new RegExp(START_ + DMS_DELIMITED_LON_ + OPT_DIRECTION_ + MIDDLE_ +
            DMS_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 5, dir: [1, 7]}, {deg: 9, min: 10, sec: 11, dir: [8, 13]}]),
    new ParseConf(
        new RegExp(START_ + DMS_LON_ + OPT_DIRECTION_ + MIDDLE_ +
            DMS_DELIMITED_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 11, dir: [7, 13]}])
  ]
];

/**
 * @type {Array<Array<ParseConf>>}
 */
const parseConfigsDMSNoMiddle_ = [
  [
    new ParseConf(
        new RegExp(START_ + DMS_DELIMITED_LAT_ + REQUIRED_DIRECTION_ + DMS_DELIMITED_LON_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 5, dir: [1, 7]}, {deg: 9, min: 10, sec: 12, dir: [8, 14]}]),
    new ParseConf(
        new RegExp(START_ + DMS_LAT_ + REQUIRED_DIRECTION_ + DMS_LON_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 10, dir: [7, 12]}]),
    new ParseConf(
        new RegExp(START_ + DMS_DELIMITED_LAT_ + REQUIRED_DIRECTION_ + DMS_LON_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 5, dir: [1, 7]}, {deg: 9, min: 10, sec: 11, dir: [8, 13]}]),
    new ParseConf(
        new RegExp(START_ + DMS_LAT_ + REQUIRED_DIRECTION_ + DMS_DELIMITED_LON_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 11, dir: [7, 13]}])
  ],
  [
    new ParseConf(
        new RegExp(START_ + DMS_DELIMITED_LON_ + REQUIRED_DIRECTION_ + MIDDLE_ +
            DMS_DELIMITED_LAT_ + REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 5, dir: [1, 7]}, {deg: 9, min: 10, sec: 12, dir: [8, 14]}]),
    new ParseConf(
        new RegExp(START_ + DMS_LON_ + REQUIRED_DIRECTION_ + DMS_LAT_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 10, dir: [7, 12]}]),
    new ParseConf(
        new RegExp(START_ + DMS_DELIMITED_LON_ + REQUIRED_DIRECTION_ + DMS_LAT_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 5, dir: [1, 7]}, {deg: 9, min: 10, sec: 11, dir: [8, 13]}]),
    new ParseConf(
        new RegExp(START_ + DMS_LON_ + REQUIRED_DIRECTION_ + DMS_DELIMITED_LAT_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 11, dir: [7, 13]}])
  ]
];

/**
 * @type {Array<ParseConf>}
 */
const parseConfigsDMSRELAXED_ = [
  new ParseConf(
      new RegExp(START_ + DMS_DELIMITED_RELAXED_ + OPT_DIRECTION_ + MIDDLE_ +
          DMS_DELIMITED_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 11, dir: [7, 13]}]),
  new ParseConf(
      new RegExp(START_ + DMS_RELAXED_ + OPT_DIRECTION_ + MIDDLE_ + DMS_RELAXED_ +
          OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 10, dir: [7, 12]}]),
  new ParseConf(
      new RegExp(START_ + DMS_DELIMITED_RELAXED_ + OPT_DIRECTION_ + MIDDLE_ +
          DMS_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: 5, dir: [1, 7]}, {deg: 9, min: 10, sec: 11, dir: [8, 13]}]),
  new ParseConf(
      new RegExp(START_ + DMS_RELAXED_ + OPT_DIRECTION_ + MIDDLE_ +
          DMS_DELIMITED_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 11, dir: [7, 13]}])
];

/**
 * @type {Array<ParseConf>}
 */
const parseConfigsDMSRELAXEDNoMiddle_ = [
  new ParseConf(
      new RegExp(START_ + DMS_DELIMITED_RELAXED_ + REQUIRED_DIRECTION_ +
          DMS_DELIMITED_RELAXED_ + REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 11, dir: [7, 13]}]),
  new ParseConf(
      new RegExp(START_ + DMS_RELAXED_ + REQUIRED_DIRECTION_ + DMS_RELAXED_ +
          REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 10, dir: [7, 12]}]),
  new ParseConf(
      new RegExp(START_ + DMS_DELIMITED_RELAXED_ + REQUIRED_DIRECTION_ + DMS_RELAXED_ +
          REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: 5, dir: [1, 7]}, {deg: 9, min: 10, sec: 11, dir: [8, 13]}]),
  new ParseConf(
      new RegExp(START_ + DMS_RELAXED_ + REQUIRED_DIRECTION_ + DMS_DELIMITED_RELAXED_ +
          REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: 4, dir: [1, 6]}, {deg: 8, min: 9, sec: 11, dir: [7, 13]}])
];

/**
 * @type {Array<Array<ParseConf>>}
 */
const parseConfigsDDM_ = [
  [
    new ParseConf(
        new RegExp(START_ + DDM_DELIMITED_LAT_ + OPT_DIRECTION_ + MIDDLE_ +
            DDM_DELIMITED_LON_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 10]}]),
    new ParseConf(
        new RegExp(START_ + DDM_LAT_ + OPT_DIRECTION_ + MIDDLE_ + DDM_LON_ +
            OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 8]}]),
    new ParseConf(
        new RegExp(START_ + DDM_DELIMITED_LAT_ + OPT_DIRECTION_ + MIDDLE_ +
            DMS_LON_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 10]}]),
    new ParseConf(
        new RegExp(START_ + DDM_LAT_ + OPT_DIRECTION_ + MIDDLE_ +
            DDM_DELIMITED_LON_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 9]}])
  ],
  [
    new ParseConf(
        new RegExp(START_ + DDM_DELIMITED_LON_ + OPT_DIRECTION_ + MIDDLE_ +
            DDM_DELIMITED_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 10]}]),
    new ParseConf(
        new RegExp(START_ + DDM_LON_ + OPT_DIRECTION_ + MIDDLE_ + DDM_LAT_ +
            OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 8]}]),
    new ParseConf(
        new RegExp(START_ + DDM_DELIMITED_LON_ + OPT_DIRECTION_ + MIDDLE_ +
            DMS_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 10]}]),
    new ParseConf(
        new RegExp(START_ + DDM_LON_ + OPT_DIRECTION_ + MIDDLE_ +
            DDM_DELIMITED_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 9]}])
  ]
];

/**
 * @type {Array<Array<ParseConf>>}
 */
const parseConfigsDDMNoMiddle_ = [
  [
    new ParseConf(
        new RegExp(START_ + DDM_DELIMITED_LAT_ + REQUIRED_DIRECTION_ + DDM_DELIMITED_LON_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 10]}]),
    new ParseConf(
        new RegExp(START_ + DDM_LAT_ + REQUIRED_DIRECTION_ + DDM_LON_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 8]}]),
    new ParseConf(
        new RegExp(START_ + DDM_DELIMITED_LAT_ + REQUIRED_DIRECTION_ + DMS_LON_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 10]}]),
    new ParseConf(
        new RegExp(START_ + DDM_LAT_ + REQUIRED_DIRECTION_ + DDM_DELIMITED_LON_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 9]}])
  ],
  [
    new ParseConf(
        new RegExp(START_ + DDM_DELIMITED_LON_ + REQUIRED_DIRECTION_ + DDM_DELIMITED_LAT_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 10]}]),
    new ParseConf(
        new RegExp(START_ + DDM_LON_ + REQUIRED_DIRECTION_ + DDM_LAT_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 8]}]),
    new ParseConf(
        new RegExp(START_ + DDM_DELIMITED_LON_ + REQUIRED_DIRECTION_ + DMS_LAT_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 10]}]),
    new ParseConf(
        new RegExp(START_ + DDM_LON_ + REQUIRED_DIRECTION_ + DDM_DELIMITED_LAT_ +
            REQUIRED_DIRECTION_ + END_, 'i'),
        [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 9]}])
  ]
];

/**
 * @type {Array<ParseConf>}
 */
const parseConfigsDDMRELAXED_ = [
  new ParseConf(
      new RegExp(START_ + DDM_DELIMITED_RELAXED_ + OPT_DIRECTION_ + MIDDLE_ +
          DDM_DELIMITED_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 10]}]),
  new ParseConf(
      new RegExp(START_ + DDM_RELAXED_ + OPT_DIRECTION_ + MIDDLE_ + DDM_RELAXED_ +
          OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 8]}]),
  new ParseConf(
      new RegExp(START_ + DDM_DELIMITED_RELAXED_ + OPT_DIRECTION_ + MIDDLE_ +
          DDM_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 9]}]),
  new ParseConf(
      new RegExp(START_ + DDM_RELAXED_ + OPT_DIRECTION_ + MIDDLE_ +
          DDM_DELIMITED_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 9]}]),
  new ParseConf(
      new RegExp(START_ + DDM_RELAXED_NO_DECIMAL_ + OPT_DIRECTION_ + MIDDLE_ +
          DDM_RELAXED_NO_DECIMAL_ + OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 8]}]),
  new ParseConf(
      new RegExp(START_ + DDM_DELIMITED_RELAXED_ + OPT_DIRECTION_ + MIDDLE_ +
          DDM_RELAXED_NO_DECIMAL_ + OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 9]}]),
  new ParseConf(
      new RegExp(START_ + DDM_RELAXED_NO_DECIMAL_ + OPT_DIRECTION_ + MIDDLE_ +
          DDM_DELIMITED_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 9]}])
];

/**
 * @type {Array<ParseConf>}
 */
const parseConfigsDDMRELAXEDNoMiddle_ = [
  new ParseConf(
      new RegExp(START_ + DDM_DELIMITED_RELAXED_ + REQUIRED_DIRECTION_ +
          DDM_DELIMITED_RELAXED_ + REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 10]}]),
  new ParseConf(
      new RegExp(START_ + DDM_RELAXED_ + REQUIRED_DIRECTION_ + DDM_RELAXED_ +
          REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 8]}]),
  new ParseConf(
      new RegExp(START_ + DDM_DELIMITED_RELAXED_ + REQUIRED_DIRECTION_ + DDM_RELAXED_ +
          REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 9]}]),
  new ParseConf(
      new RegExp(START_ + DDM_RELAXED_ + REQUIRED_DIRECTION_ + DDM_DELIMITED_RELAXED_ +
          REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 9]}]),
  new ParseConf(
      new RegExp(START_ + DDM_RELAXED_NO_DECIMAL_ + REQUIRED_DIRECTION_ +
          DDM_RELAXED_NO_DECIMAL_ + REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 8]}]),
  new ParseConf(
      new RegExp(START_ + DDM_DELIMITED_RELAXED_ + REQUIRED_DIRECTION_ +
          DDM_RELAXED_NO_DECIMAL_ + REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 5]}, {deg: 7, min: 8, sec: null, dir: [6, 9]}]),
  new ParseConf(
      new RegExp(START_ + DDM_RELAXED_NO_DECIMAL_ + REQUIRED_DIRECTION_ +
          DDM_DELIMITED_RELAXED_ + REQUIRED_DIRECTION_ + END_, 'i'),
      [{deg: 2, min: 3, sec: null, dir: [1, 4]}, {deg: 6, min: 7, sec: null, dir: [5, 9]}])
];

/**
 * Assumes lat/lon are in the same geo format ... if they aren't there are ways to detect that provided as well
 * @type {Array<Array<ParseConf>>}
 */
const parseConfigs_ = [
  parseConfigsDD_[PREFER_LAT_FIRST].concat(parseConfigsDDM_[PREFER_LAT_FIRST],
      parseConfigsDMS_[PREFER_LAT_FIRST], parseConfigsDDNoMiddle_[PREFER_LAT_FIRST],
      parseConfigsDDMNoMiddle_[PREFER_LAT_FIRST],
      parseConfigsDMSNoMiddle_[PREFER_LAT_FIRST]),
  parseConfigsDD_[PREFER_LON_FIRST].concat(parseConfigsDDM_[PREFER_LON_FIRST],
      parseConfigsDMS_[PREFER_LON_FIRST], parseConfigsDDNoMiddle_[PREFER_LON_FIRST],
      parseConfigsDDMNoMiddle_[PREFER_LON_FIRST],
      parseConfigsDMSNoMiddle_[PREFER_LON_FIRST])
];

/**
 * Parses a location from the given string. For decimal values, the two values
 * (lon/lat) can be separated by whitespace, a comma, or any combination of the
 * two. For sexagesimal (DMS) values, the six values (three for each lon/lat)
 * can be separated by whitespace, a comma, a colon, the typical degree/single
 * quote/double quote, or a period.
 *
 * @param {string} str The string to parse
 * @param {number=} opt_order The order that is assumed if not specified. The default is <code>PREFER_LAT_FIRST</code>
 * @param {string=} opt_format Custom format string
 * @return {?osx.geo.Location} The lat/lon object, or null if the
 * value could not be parsed.
 */
export const parseLatLon = function(str, opt_order, opt_format) {
  if (str) {
    var lon = NaN;
    var lat = NaN;
    var i;
    var n;
    var order = opt_order ? opt_order : 0;
    var confs = getLatLonFormatConfiguration(order, opt_format);
    str = str.trim().toUpperCase();

    var result = null;
    var conf = null;
    for (i = 0, n = confs.length; i < n; i++) {
      conf = confs[i];
      result = conf.regex.exec(str);

      if (result) {
        break;
      }
    }

    if (!result && opt_order === undefined) { // could be reversed
      order = 1;
      confs = getLatLonFormatConfiguration(order, opt_format);

      for (i = 0, n = confs.length; i < n; i++) {
        conf = confs[i];
        result = conf.regex.exec(str);

        if (result) {
          break;
        }
      }
    }

    if (result) {
      var ptIdx = result[conf.coords[0].deg].indexOf('.');
      var signIdx = result[conf.coords[0].deg].indexOf('-');
      // if no negative sign, check for explicit positive since the spec allows that too
      signIdx = signIdx == -1 ? result[conf.coords[0].deg].indexOf('+') : signIdx;
      var numDigits = signIdx != -1 ? 4 : 3;

      var dir0 = result[conf.coords[0].dir[0]] || result[conf.coords[0].dir[1]];
      var dir1 = result[conf.coords[1].dir[0]] || result[conf.coords[1].dir[1]];

      var firstLooksLikeLon = dir0 === '' && ptIdx >= numDigits;

      if (dir1 == 'N' || dir1 == 'S' || dir0 == 'E' || dir0 == 'W' ||
          firstLooksLikeLon || opt_order == PREFER_LON_FIRST) {
        // lon is first, lat is second
        lon = parse_(
            result[conf.coords[0].deg],
            result[conf.coords[0].min],
            result[conf.coords[0].sec],
            dir0);
        lat = parse_(
            result[conf.coords[1].deg],
            result[conf.coords[1].min],
            result[conf.coords[1].sec],
            dir1);
      } else {
        // lat is first, lon is second
        lat = parse_(
            result[conf.coords[0].deg],
            result[conf.coords[0].min],
            result[conf.coords[0].sec],
            dir0);
        lon = parse_(
            result[conf.coords[1].deg],
            result[conf.coords[1].min],
            result[conf.coords[1].sec],
            dir1);
      }
    }

    if (!isNaN(lat) && !isNaN(lon)) {
      // if our latitude is greater than 90, we probably got it backwards and
      // we need to switch them
      if (!(opt_order !== undefined || dir0 || dir1) && Math.abs(lat) > 90) {
        var tmp = lat;
        lat = lon;
        lon = tmp;
      }

      return /** @type {!osx.geo.Location} */ ({
        lat: lat,
        lon: lon
      });
    }
  }
  return null;
};

/**
 * Returns a specific config, with the relaxed standard
 *
 * @param {number} order
 * @param {string=} opt_format Custom format string
 * @return {Array<ParseConf>}
 */
export const getLatLonFormatConfiguration = function(order, opt_format) {
  if (opt_format !== undefined) { // only allow relaxed in manual override
    switch (opt_format) {
      case 'DD':
        return parseConfigsDDRELAXED_.concat(parseConfigsDDRELAXEDNoMiddle_);
      case 'DDM':
        return parseConfigsDDMRELAXED_.concat(parseConfigsDDMRELAXEDNoMiddle_);
      case 'DMS':
        return parseConfigsDMSRELAXED_.concat(parseConfigsDMSRELAXEDNoMiddle_);
      default:
        break;
    }
  }
  return parseConfigs_[order];
};

/**
 * Parses a lat/lon from a given string.
 *
 * For DMS values, the three values can be separated by whitespace, comma, single quote and double quote.
 *
 * @param {string} str The string to parse
 * @param {string=} opt_format Custom format string
 * @return {?number} The lat/lon parsed from the string, or NaN if a lat/lon could not be parsed.
 */
export const parseLon = function(str, opt_format) {
  if (!str) {
    return NaN; // this fixes a bug where 0 is returned if str is an empty string
  }

  var confs = [];

  if (opt_format != null) {
    switch (opt_format) {
      case 'DD':
        confs.push({
          regex: new RegExp(START_ + DECIMAL_RELAXED_ + END_, 'i'),
          coords: {deg: 2, min: null, sec: null, dir: [1, 4]}
        });
        break;
      case 'DDM':
        confs.push({
          regex: new RegExp(START_ + DDM_DELIMITED_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
          coords: {deg: 2, min: 3, sec: null, dir: [1, 5]}
        });
        confs.push({
          regex: new RegExp(START_ + DDM_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
          coords: {deg: 2, min: 3, sec: null, dir: [1, 4]}
        });
        confs.push({
          regex: new RegExp(START_ + DDM_RELAXED_NO_DECIMAL_ + OPT_DIRECTION_ + END_, 'i'),
          coords: {deg: 2, min: 3, sec: null, dir: [1, 4]}
        });
        break;
      case 'DMS':
        confs.push({
          regex: new RegExp(START_ + DMS_DELIMITED_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
          coords: {deg: 2, min: 3, sec: 5, dir: [1, 7]}
        });
        confs.push({
          regex: new RegExp(START_ + DMS_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
          coords: {deg: 2, min: 3, sec: 4, dir: [1, 6]}
        });
        break;
      default:
        break;
    }
  } else {
    confs = [ // autodetect
      {
        regex: new RegExp(START_ + DECIMAL_LON_ + OPT_DIRECTION_ + END_, 'i'),
        coords: {deg: 2, min: null, sec: null, dir: [1, 4]}
      },
      {
        regex: new RegExp(START_ + DDM_DELIMITED_LON_ + OPT_DIRECTION_ + END_, 'i'),
        coords: {deg: 2, min: 3, sec: null, dir: [1, 5]}
      },
      {
        regex: new RegExp(START_ + DDM_LON_ + OPT_DIRECTION_ + END_, 'i'),
        coords: {deg: 2, min: 3, sec: null, dir: [1, 4]}
      },
      {
        regex: new RegExp(START_ + DMS_DELIMITED_LON_ + OPT_DIRECTION_ + END_, 'i'),
        coords: {deg: 2, min: 3, sec: 5, dir: [1, 7]}
      },
      {
        regex: new RegExp(START_ + DMS_LON_ + OPT_DIRECTION_ + END_, 'i'),
        coords: {deg: 2, min: 3, sec: 4, dir: [1, 6]}
      }
    ];
  }

  var result = undefined;
  for (var i = 0, n = confs.length; i < n; i++) {
    var conf = confs[i];
    result = conf.regex.exec(str);
    if (result) {
      break;
    }
  }

  var d = NaN;
  if (result) {
    d = parse_(result[conf.coords.deg], result[conf.coords.min], result[conf.coords.sec],
        result[conf.coords.dir[0]] || result[conf.coords.dir[1]]);
  }

  return d;
};

/**
 * Parses a lat/lon from a given string.
 *
 * For DMS values, the three values can be separated by whitespace, comma, single quote and double quote.
 *
 * @param {string} str The string to parse
 * @param {string=} opt_format Custom format string
 * @return {?number} The lat/lon parsed from the string, or NaN if a lat/lon could not be parsed.
 */
export const parseLat = function(str, opt_format) {
  if (!str) {
    return NaN; // this fixes a bug where 0 is returned if str is an empty string
  }

  var confs = [];

  if (opt_format != null) {
    switch (opt_format) {
      case 'DD':
        confs.push({
          regex: new RegExp(START_ + DECIMAL_RELAXED_ + END_, 'i'),
          coords: {deg: 2, min: null, sec: null, dir: [1, 4]}
        });
        break;
      case 'DDM':
        confs.push({
          regex: new RegExp(START_ + DDM_DELIMITED_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
          coords: {deg: 2, min: 3, sec: null, dir: [1, 5]}
        });
        confs.push({
          regex: new RegExp(START_ + DDM_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
          coords: {deg: 2, min: 3, sec: null, dir: [1, 4]}
        });
        confs.push({
          regex: new RegExp(START_ + DDM_RELAXED_NO_DECIMAL_ + OPT_DIRECTION_ + END_, 'i'),
          coords: {deg: 2, min: 3, sec: null, dir: [1, 4]}
        });
        break;
      case 'DMS':
        confs.push({
          regex: new RegExp(START_ + DMS_DELIMITED_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
          coords: {deg: 2, min: 3, sec: 5, dir: [1, 7]}
        });
        confs.push({
          regex: new RegExp(START_ + DMS_RELAXED_ + OPT_DIRECTION_ + END_, 'i'),
          coords: {deg: 2, min: 3, sec: 4, dir: [1, 6]}
        });
        break;
      default:
        break;
    }
  } else {
    confs = [ // autodetect
      {
        regex: new RegExp(START_ + DECIMAL_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        coords: {deg: 2, min: null, sec: null, dir: [1, 4]}
      },
      {
        regex: new RegExp(START_ + DDM_DELIMITED_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        coords: {deg: 2, min: 3, sec: null, dir: [1, 5]}
      },
      {
        regex: new RegExp(START_ + DDM_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        coords: {deg: 2, min: 3, sec: null, dir: [1, 4]}
      },
      {
        regex: new RegExp(START_ + DMS_DELIMITED_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        coords: {deg: 2, min: 3, sec: 5, dir: [1, 7]}
      },
      {
        regex: new RegExp(START_ + DMS_LAT_ + OPT_DIRECTION_ + END_, 'i'),
        coords: {deg: 2, min: 3, sec: 4, dir: [1, 6]}
      }
    ];
  }

  var result = undefined;
  for (var i = 0, n = confs.length; i < n; i++) {
    var conf = confs[i];
    result = conf.regex.exec(str);
    if (result) {
      break;
    }
  }

  var d = NaN;
  if (result) {
    d = parse_(result[conf.coords.deg], result[conf.coords.min], result[conf.coords.sec],
        result[conf.coords.dir[0]] || result[conf.coords.dir[1]]);
  }

  return d;
};

/**
 * Parses a deg, min, sec, and direction string into a proper decimal coordinate
 *
 * @param {string} deg The degrees
 * @param {string} min The minutes
 * @param {string} sec The seconds
 * @param {string} dir The direction
 * @return {number} Decimal degree coordinate
 */
const parse_ = function(deg, min, sec, dir) {
  if (!min && !sec) {
    /** @type {number} */
    var i = deg.indexOf('.');

    if (i == -1) {
      i = deg.length;
    }

    /** @type {number} */
    var ptIdx = deg.indexOf('.');
    /** @type {number} */
    var signIdx = deg.indexOf('-');
    signIdx = signIdx == -1 ? deg.indexOf('+') : signIdx;
    /** @type {number} */
    var numOfDigits = signIdx != -1 ? 5 : 4;

    if ((ptIdx == -1 || ptIdx >= numOfDigits)) {
      // clearly someone means DMS
      if (ptIdx == -1) {
        ptIdx = deg.length;
      }

      var l;
      if (signIdx == -1) {
        l = ptIdx % 2 === 1 ? 3 : 2;
      } else {
        l = ptIdx % 2 === 0 ? 4 : 3;
      }

      /** @type {string} */
      var newDeg = deg.substring(0, Math.min(l, ptIdx));
      deg = deg.substring(newDeg.length);
      ptIdx -= newDeg.length;

      min = '00';
      sec = '00';

      if (ptIdx >= 2) {
        min = deg.substring(0, 2);
        deg = deg.substring(2);
        ptIdx -= 2;
      }

      if (ptIdx >= 2) {
        sec = deg;
      }

      deg = newDeg;
    }
  }

  // sec can be "XX", "XX.X", or "XXXXX". The latter must
  // insert the decimal in the correct spot for "XX.XXX"
  if (sec && sec.length > 2 && sec.indexOf('.') == -1) {
    sec = sec.substring(0, 2) + '.' + sec.substring(2);
  }

  var sign = 1;

  var d = parseFloat(deg);
  sign *= d < 0 || Object.is(d, -0) ? -1 : 1;

  var m = parseFloat(min);
  if (m < 0 || Object.is(m, -0)) {
    return NaN;
  }

  var s = parseFloat(sec);
  if (m < 0 || Object.is(m, -0)) {
    return NaN;
  }

  var val = Math.abs(d);

  if (!isNaN(m)) {
    val += Math.abs(m) / 60;
  }

  if (!isNaN(s)) {
    val += Math.abs(s) / 60 / 60;
  }

  sign *= dir == 'S' || dir == 'W' ? -1 : 1;
  return val * sign;
};

/**
 * Interpolates an arc defined by center point, radius, and angleRange with a defined number of points.
 *
 * @param {Array<number>} center Center coordinates in [lon, lat] format
 * @param {number} radius Radius of the arc in meters
 * @param {number} angleRange range of angle to draw arc in degrees (clockwise from north)
 * @param {number=} opt_startAngle center of arc, defaulting to 0
 * @param {number=} opt_points Number of points, defaulting to 20.
 * @param {string=} opt_method Optional interpolation method for the arcs.
 * @return {Array<Array<number>>} Array of locations as [[x1, y1], [x2, y2] ... [xn, yn]]
 */
export const interpolateArc = function(center, radius, angleRange, opt_startAngle, opt_points, opt_method) {
  var altitude = center.length > 2 ? center[2] : 0;
  angleRange = angleRange > 360 ? angleRange % 360 : angleRange;
  var points = opt_points || 20;
  var startAngle = opt_startAngle || 0;
  var angleDelta = angleRange / points;
  var locations = [];
  for (var i = 0; i <= points; ++i) {
    if (!opt_method) {
      opt_method = getInterpolateMethod();
    }

    var interpFn = opt_method === Method.GEODESIC ? osasm.geodesicDirect : osasm.rhumbDirect;
    var point = interpFn(center, startAngle - angleRange / 2 + i * angleDelta, radius);
    point.push(altitude);
    locations.push(point);
  }
  return locations;
};

/**
 * Interpolates a circle defined by center point and radius as a polygon with a defined number of points per quadrant.
 *
 * @param {Array<number>} center Center coordinates in [lon, lat] format
 * @param {number} radius Radius of the circle.
 * @param {number=} opt_pointsPerQuad Number of points per quadrant, defaulting to 10.
 * @return {Array<Array<number>>} Array of locations as [[x1, y1], [x2, y2] ... [xn, yn]]
 */
export const interpolateCircle = function(center, radius, opt_pointsPerQuad) {
  var pointsPerQuad = opt_pointsPerQuad || 10;
  var angleDelta = Math.PI / pointsPerQuad / 2;
  var unitCircle = [[1, 0]];
  unitCircle[pointsPerQuad] = [0, 1];
  unitCircle[pointsPerQuad * 2] = [-1, 0];
  unitCircle[pointsPerQuad * 3] = [0, -1];
  for (var i = 1; i < pointsPerQuad; ++i) {
    var angle = i * angleDelta;
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    unitCircle[i] = [cos, sin];
    unitCircle[i + pointsPerQuad] = [-sin, cos];
    unitCircle[i + pointsPerQuad * 2] = [-cos, -sin];
    unitCircle[i + pointsPerQuad * 3] = [sin, -cos];
  }
  unitCircle.push(unitCircle[0]);

  var locations = [];
  unitCircle.forEach(function(loc) {
    locations.push([center[0] + loc[0] * radius, center[1] + loc[1] * radius]);
  });

  return locations;
};

/**
 * Interpolates an ellipse defined by center point, axes and orientation with a defined number of points per half.
 *
 * @param {Array<number>} center Center point of the ellipse.
 * @param {number} a Semi-major axis of the ellipse in meters
 * @param {number} b Semi-minor axis of the ellipse in meters
 * @param {number} t Tilt/orientation of the ellipse in degrees clockwise from true north
 * @param {number=} opt_steps Number of points per each half of the ellipse, defaulting to 32.
 * @return {Array<Array<number>>} Array of locations as [[x1, y1], [x2, y2] ... [xn, yn]]
 */
export const interpolateEllipse = function(center, a, b, t, opt_steps) {
  var altitude = center.length > 2 ? center[2] : 0;
  var change = Math.PI;
  var easingFunc = getEllipseEasingFunction_(a, b);
  var offset = Math.PI / 2;
  var steps = opt_steps || 32; // steps is the number of steps for each half of the ellipse
  var tilt = D2R * (90 - t);

  var list = [];
  var point = undefined;
  var firstPoint = undefined;

  for (var k = 0; k < 2; k++) {
    for (var j = 0; j < steps; j++) {
      // compute theta
      var theta = easingFunc(j, offset, change, steps);

      // polar form of an ellipse at the center
      var r = a * b / Math.sqrt(Math.pow(a * Math.cos(theta), 2) + Math.pow(b * Math.sin(theta), 2));

      // get a lat/lon based on distance and bearing
      point = osasm.geodesicDirect(center, R2D * (theta - tilt), r);
      point[2] = altitude;

      list.push(point);

      if (!firstPoint) {
        firstPoint = point;
      }
    }

    offset += Math.PI;
  }

  list.push(firstPoint);

  return list;
};

/**
 * @param {number} value
 * @return {number}
 */
export const convertEllipseValue = function(value) {
  if (value < 250) {
    // assume we were given nautical miles, convert to m
    value *= 1852;
  }

  return value;
};

/**
 * Calculates an ending location from a location, distance, and bearing using Vincenty's algorithm.
 *
 * @param {Array<number>} location The start location
 * @param {number} distance The distance from the start location in kilometers
 * @param {number} bearing The bearing (in degrees) where north is 0
 * @param {Ellipsoid=} opt_ellipsoid The Vincenty Ellipsoid (with properties a, b, and f). Defaults to the WGS-84
 *     ellipsoid.
 * @return {Array<number>} The resulting location
 * @deprecated Please use osasm.geodesicDirect(location, bearing, distance) instead. NOTE: The units for the new one are
 *  meters and not kilometers
 */
export const calculateEndLocation = function(location, distance, bearing, opt_ellipsoid) {
  var ellipsoid = opt_ellipsoid || VINCENTY_ELLIPSOIDS.WGS84;
  var a = ellipsoid.a;
  var b = ellipsoid.b;
  var f = ellipsoid.f;

  var lon1 = location[0];
  var lat1 = location[1];
  var s = distance * 1000; // this should be in meters
  var alpha1 = D2R * bearing;
  var sinAlpha1 = Math.sin(alpha1);
  var cosAlpha1 = Math.cos(alpha1);

  var tanU1 = (1 - f) * Math.tan(D2R * lat1);
  var cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1));
  var sinU1 = tanU1 * cosU1;
  var sigma1 = Math.atan2(tanU1, cosAlpha1);
  var sinAlpha = cosU1 * sinAlpha1;
  var cosSqAlpha = 1 - sinAlpha * sinAlpha;
  var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
  var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

  var sigma = s / (b * A);
  var sigmaP = 2 * Math.PI;

  while (Math.abs(sigma - sigmaP) > 1e-12) {
    var cos2SigmaM = Math.cos(2 * sigma1 + sigma);
    var sinSigma = Math.sin(sigma);
    var cosSigma = Math.cos(sigma);
    var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 *
        cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    sigmaP = sigma;
    sigma = s / (b * A) + deltaSigma;
  }

  var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
  var lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1, (1 - f) * Math.sqrt(sinAlpha * sinAlpha +
      tmp * tmp));
  var lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
  var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
  var L = lambda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM *
      cos2SigmaM)));

  return [lon1 + R2D * L, R2D * lat2];
};

/**
 * Borrowed this from OL3 since they removed it. :(
 *
 * @param {Array<number>} c1 Coordinate 1.
 * @param {Array<number>} c2 Coordinate 2.
 * @param {Ellipsoid=} opt_ellipsoid The ellipsoid
 * @param {number=} opt_minDeltaLambda Minimum delta lambda for convergence.
 * @param {number=} opt_maxIterations Maximum iterations.
 * @return {{distance: number, initialBearing: number, finalBearing: number}} Vincenty.
 * @deprecated Please use the osasm.geodesicInverse(c1, c2) instead
 */
export const vincenty = function(c1, c2, opt_ellipsoid, opt_minDeltaLambda, opt_maxIterations) {
  var ellipsoid = opt_ellipsoid || VINCENTY_ELLIPSOIDS.WGS84;
  var minDeltaLambda = opt_minDeltaLambda != null ? opt_minDeltaLambda : 1e-12;
  var maxIterations = opt_maxIterations != null ? opt_maxIterations : 100;

  var f = ellipsoid.f;
  var lat1 = D2R * c1[1];
  var lat2 = D2R * c2[1];
  var deltaLon = D2R * (c2[0] - c1[0]);
  var U1 = Math.atan((1 - f) * Math.tan(lat1));
  var cosU1 = Math.cos(U1);
  var sinU1 = Math.sin(U1);
  var U2 = Math.atan((1 - f) * Math.tan(lat2));
  var cosU2 = Math.cos(U2);
  var sinU2 = Math.sin(U2);
  var lambda = deltaLon;
  var cosSquaredAlpha;
  var sinAlpha;
  var cosLambda;
  var deltaLambda = Infinity;
  var sinLambda;
  var cos2SigmaM;
  var cosSigma;
  var sigma;
  var sinSigma;
  var i;
  for (i = maxIterations; i > 0; --i) {
    cosLambda = Math.cos(lambda);
    sinLambda = Math.sin(lambda);
    var x = cosU2 * sinLambda;
    var y = cosU1 * sinU2 - sinU1 * cosU2 * cosLambda;
    sinSigma = Math.sqrt(x * x + y * y);
    if (sinSigma === 0) {
      return {
        distance: 0,
        initialBearing: 0,
        finalBearing: 0
      };
    }
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cosSquaredAlpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSquaredAlpha;
    if (isNaN(cos2SigmaM)) {
      cos2SigmaM = 0;
    }
    var C = f / 16 * cosSquaredAlpha * (4 + f * (4 - 3 * cosSquaredAlpha));
    var lambdaPrime = deltaLon + (1 - C) * f * sinAlpha * (sigma +
        C * sinSigma * (cos2SigmaM +
        C * cosSigma * (2 * cos2SigmaM * cos2SigmaM - 1)));
    deltaLambda = Math.abs(lambdaPrime - lambda);
    lambda = lambdaPrime;
    if (deltaLambda < minDeltaLambda) {
      break;
    }
  }
  if (i === 0) {
    return {
      distance: NaN,
      finalBearing: NaN,
      initialBearing: NaN
    };
  }
  var aSquared = ellipsoid.a * ellipsoid.a;
  var bSquared = ellipsoid.b * ellipsoid.b;
  var uSquared = cosSquaredAlpha * (aSquared - bSquared) / bSquared;
  var A = 1 + uSquared / 16384 *
      (4096 + uSquared * (uSquared * (320 - 175 * uSquared) - 768));
  var B = uSquared / 1024 *
      (256 + uSquared * (uSquared * (74 - 47 * uSquared) - 128));
  var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 *
      (cosSigma * (2 * cos2SigmaM * cos2SigmaM - 1) -
       B / 6 * cos2SigmaM * (4 * sinSigma * sinSigma - 3) *
       (4 * cos2SigmaM * cos2SigmaM - 3)));
  cosLambda = Math.cos(lambda);
  sinLambda = Math.sin(lambda);
  var alpha1 = Math.atan2(cosU2 * sinLambda,
      cosU1 * sinU2 - sinU1 * cosU2 * cosLambda);
  var alpha2 = Math.atan2(cosU1 * sinLambda,
      cosU1 * sinU2 * cosLambda - sinU1 * cosU2);
  return {
    distance: ellipsoid.b * A * (sigma - deltaSigma),
    initialBearing: R2D * alpha1,
    finalBearing: R2D * alpha2
  };
};

/**
 * Returns the distance from c1 to c2 using Vincenty.
 *
 * @param {Array<number>} c1 Coordinate 1.
 * @param {Array<number>} c2 Coordinate 1.
 * @param {Ellipsoid=} opt_ellipsoid The ellipsoid
 * @param {number=} opt_minDeltaLambda Minimum delta lambda for convergence.
 * @param {number=} opt_maxIterations Maximum iterations.
 * @return {number} Vincenty distance.
 * @deprecated Please use osasm.geodesicInverse(c1, c2).distance instead
 */
export const vincentyDistance = function(c1, c2, opt_ellipsoid, opt_minDeltaLambda, opt_maxIterations) {
  var vincentyResult = vincenty(c1, c2, opt_ellipsoid, opt_minDeltaLambda, opt_maxIterations);
  return vincentyResult.distance;
};

/**
 * Returns the final bearing from c1 to c2 using Vincenty.
 *
 * @param {Array<number>} c1 Coordinate 1.
 * @param {Array<number>} c2 Coordinate 1.
 * @param {Ellipsoid=} opt_ellipsoid The ellipsoid
 * @param {number=} opt_minDeltaLambda Minimum delta lambda for convergence.
 * @param {number=} opt_maxIterations Maximum iterations.
 * @return {number} Initial bearing.
 * @deprecated Please use the osasm.geodesicInverse(c1, c2).finalBearing instead
 */
export const vincentyFinalBearing = function(c1, c2, opt_ellipsoid, opt_minDeltaLambda, opt_maxIterations) {
  var vincentyResult = vincenty(c1, c2, opt_ellipsoid, opt_minDeltaLambda, opt_maxIterations);
  return vincentyResult.finalBearing;
};

/**
 * Returns the initial bearing from c1 to c2 using Vincenty.
 *
 * @param {Array<number>} c1 Coordinate 1.
 * @param {Array<number>} c2 Coordinate 1.
 * @param {Ellipsoid=} opt_ellipsoid The ellipsoid
 * @param {number=} opt_minDeltaLambda Minimum delta lambda for convergence.
 * @param {number=} opt_maxIterations Maximum iterations.
 * @return {number} Initial bearing.
 * @deprecated Please use the osasm.geodesicInverse(c1, c2).initialBearing instead
 */
export const vincentyInitialBearing = function(c1, c2, opt_ellipsoid, opt_minDeltaLambda, opt_maxIterations) {
  var vincentyResult = vincenty(c1, c2, opt_ellipsoid, opt_minDeltaLambda, opt_maxIterations);
  return vincentyResult.initialBearing;
};

/**
 * Gets the appropriate easing function for the provided ellipse axes.
 *
 * @param {number} a Semi-major axis of the ellipse.
 * @param {number} b Semi-minor axis of the ellipse.
 * @return {easing.EasingFunction} The easing function to use.
 */
const getEllipseEasingFunction_ = function(a, b) {
  var f = Math.max(a, b) / Math.min(a, b);

  if (f < 1.2) {
    return easing.easeLinear;
  }

  return easing.easeExpo;
};

/**
 * Tests to see if the coordinate array is closed (the first coordinate is the same as the last).
 *
 * @param {Array<Array<number>>} coords The coordinate array
 * @return {boolean} If the first coordinate is the same as the last
 */
export const isClosed = function(coords) {
  if (coords && coords.length > 0) {
    var first = coords[0];
    var last = coords[coords.length - 1];

    if (first && last) {
      return isSameCoordinate(first, last);
    }
  }

  return false;
};

/**
 * Tests to see if a set of coordinates represent a polygon.
 *
 * @param {Array<Array<number>>} coords The coordinate array
 * @return {boolean} If the set of coordinates represent a polygon
 */
export const isPolygon = function(coords) {
  var closed = isClosed(coords);
  return coords != null && ((closed && coords.length > 3) || (!closed && coords.length > 2));
};

/**
 * Calculates the center point of a set of polygonal coordinates.
 *
 * @param {Array<Array<number>>} coords The coordinate array
 * @return {Array<number>} If the set of coordinates represent a polygon
 */
export const calculateCenter = function(coords) {
  if (isPolygon(coords)) {
    var center = [0, 0];
    var i = isClosed(coords) ? coords.length - 1 : coords.length;
    var total = i;
    while (i--) {
      center[0] += coords[i][0];
      center[1] += coords[i][1];
    }
    center[0] /= total;
    center[1] /= total;
    return center;
  } else {
    return [];
  }
};

/**
 * Tests to see if a set of coordinates represent a rectangle.
 *
 * @param {Array<Array<number>>} coords The coordinate array of the os.geometry
 * @param {Array<number>} extent The extent of the os.geometry as [minx, miny, maxx, maxy]
 * @return {boolean} If the set of coordinates is rectangular
 */
export const isRectangular = function(coords, extent) {
  var closed = isClosed(coords);
  var polygon = isPolygon(coords);

  if (coords && closed && polygon && extent) {
    var i = coords.length;
    var nw = false;
    var ne = false;
    var sw = false;
    var se = false;

    while (i--) {
      if (isSameCoordinate(coords[i], [extent[0], extent[1]])) {
        sw = true;
      } else if (isSameCoordinate(coords[i], [extent[0], extent[3]])) {
        nw = true;
      } else if (isSameCoordinate(coords[i], [extent[2], extent[1]])) {
        se = true;
      } else if (isSameCoordinate(coords[i], [extent[2], extent[3]])) {
        ne = true;
      } else {
        return false;
      }
    }

    return ne && nw && se && sw;
  }

  return false;
};

/**
 * Tests if a geometry is rectangular.
 *
 * @param {Geometry|undefined} geometry The geometry to test
 * @return {boolean} If the geometry is rectangular.
 */
export const isGeometryRectangular = function(geometry) {
  if (geometry && geometry.getType() == GeometryType.POLYGON) {
    var polygon = /** @type {Polygon} */ (geometry);
    var rings = polygon.getLinearRings();
    if (rings && rings.length === 1 && rings[0]) {
      return isRectangular(rings[0].getCoordinates(), rings[0].getExtent());
    }
  }

  return false;
};

/**
 * Tests if a geometry is polygonal.
 *
 * @param {Geometry|RenderFeature|undefined} geometry The geometry to test
 * @param {boolean=} opt_testCollections If geometry collections should be inspected for polygons.
 * @return {boolean} If the feature/geometry is a polygon or multipolygon.
 */
export const isGeometryPolygonal = function(geometry, opt_testCollections) {
  if (geometry) {
    var geomType = geometry.getType();
    if (geomType == GeometryType.POLYGON || geomType == GeometryType.MULTI_POLYGON) {
      return true;
    } else if (opt_testCollections && geomType == GeometryType.GEOMETRY_COLLECTION) {
      var geomArray = /** @type {GeometryCollection} */ (geometry).getGeometriesArray();
      if (geomArray) {
        for (var i = 0; i < geomArray.length; i++) {
          if (isGeometryPolygonal(geomArray[i], true)) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

/**
 * Tests to see if any coordinate in coords has an altitude value.
 *
 * @param {Array<Array<number>>} coords The coordinate array of the os.geometry
 * @param {boolean=} opt_quick if true, only the 1st coordinate is checked.
 * @return {boolean} If coords has an element with altitude.
 */
export const hasAltitude = function(coords, opt_quick) {
  var ce;
  if (coords && coords.length > 0) {
    for (var i = 0; i < coords.length; i = i + 1) {
      ce = coords[i];
      if (ce && ce.length > 2 && ce[2] !== 0) {
        return true;
      }
      if (opt_quick) {
        return false;
      }
    }
  }
  return false;
};

/**
 * Tests to see if the geometry has altitude.
 *
 * @param {Geometry|undefined} geometry
 * @param {boolean=} opt_quick if true, only the 1st coordinate is checked.
 * @return {boolean} If geometry has coordinates with altitude.
 */
export const hasAltitudeGeometry = function(geometry, opt_quick) {
  var /** @type {boolean} */ result = false;
  var i;
  var x;
  var /** @type {Array<(Array<number>|null)>|null} */ coordinates = null;
  var /** @type {Array<(Array<(Array<number>|null)>|null)>|null} */ rings;
  switch (geometry.getType()) {
    case 'Point':
      var point = /** @type {Point} */ (geometry);
      var /** @type {Array<number>} */ coord = point.getCoordinates();
      if (coord) {
        result = /** @type {boolean} */ (coord && coord.length > 2 && coord[2] !== 0);
      }
      break;
    case 'LineString':
      var lineString = /** @type {LineString} */ (geometry);
      coordinates = lineString.getCoordinates();
      result = hasAltitude(coordinates, opt_quick);
      break;
    case 'MultiPoint':
      var multiPoint = /** @type {MultiPoint} */ (geometry);
      coordinates = multiPoint.getCoordinates();
      result = hasAltitude(coordinates, opt_quick);
      break;
    case 'MultiLineString':
      var multiLineString = /** @type {MultiLineString} */ (geometry);
      var /** @type {Array<(Array<(Array<number>|null)>|null)>|null} */ lines = multiLineString.getCoordinates();
      if (lines) {
        for (i = 0; i < lines.length; i = i + 1) {
          if (hasAltitude(lines[i], opt_quick)) {
            result = true;
            break;
          }
          if (opt_quick) {
            break;
          }
        }
      }
      break;
    case 'Polygon':
      var polygon = /** @type {Polygon} */ (geometry);
      rings = polygon.getCoordinates();
      if (rings) {
        for (i = 0; i < rings.length; i = i + 1) {
          if (hasAltitude(rings[i], opt_quick)) {
            result = true;
            break;
          }
          if (opt_quick) {
            break;
          }
        }
      }
      break;
    case 'MultiPolygon':
      var multiPolygon = /** @type {MultiPolygon} */ (geometry);
      var /** @type {Array<(Array<(Array<(Array<number>|null)>|null)>|null)>|null} */
          polygons = multiPolygon.getCoordinates();
      if (polygons) {
        for (x = 0; x < polygons.length; x = x + 1) {
          rings = polygons[x];
          for (i = 0; i < rings.length; i = i + 1) {
            if (hasAltitude(rings[i], opt_quick)) {
              result = true;
              x = polygons.length;
              break;
            }
            if (opt_quick) {
              x = polygons.length;
              break;
            }
          }
        }
      }
      break;
    case 'GeometryCollection':
      var geometryCollection = /** @type {GeometryCollection} */ (geometry);
      var /** @type {Array<Geometry>} */ geometries = geometryCollection.getGeometries();
      if (geometries) {
        for (i = 0; i < geometries.length; i = i + 1) {
          if (hasAltitudeGeometry(geometries[i])) {
            result = true;
            break;
          }
          if (opt_quick) {
            break;
          }
        }
      }
      break;
    case 'Circle':
      var circle = /** @type {Circle} */ (geometry);
      var /** @type {Array<number>} */ coord1 = circle.getFirstCoordinate();
      var /** @type {Array<number>} */ coord2 = circle.getLastCoordinate();
      if (coord1 && coord2) {
        result = ((coord1 && coord1.length > 2 && coord1[2] !== 0) ||
                (coord2 && coord2.length > 2 && coord2[2] !== 0));
      }
      break;
    default:
      result = false;
      break;
  }
  return result == null ? false : result;
};

/**
 * Returns the average of the altitude component for all coordinates in coords.
 *
 * @param {Array<Array<number>>} coords The coordinate array of the geometry
 * @return {number} Average of altitude compoments.
 */
export const getAverageAltitude = function(coords) {
  var ce;
  var ttl = 0;
  var count = 0;
  var result;
  if (coords && coords.length > 0) {
    for (var i = 0; i < coords.length; i = i + 1) {
      ce = coords[i];
      if (ce && ce.length > 2 && ce[2] !== 0) {
        count++;
        ttl += ce[2];
      }
    }
  }
  result = ttl / count;
  return isNaN(result) ? 0 : result;
};

/**
 * Tests if two coordinates share the same x/y value, within a tolerance of 1E-12. Altitude is not considered if
 * present.
 *
 * @param {Array<number>} c1 The first coordinate
 * @param {Array<number>} c2 The second coordinate
 * @return {boolean} If the coordinates are the same
 */
export const isSameCoordinate = function(c1, c2) {
  if (c1 == null || c2 == null || c1.length < 2 || c2.length < 2) {
    return false;
  }

  return Math.abs(c1[0] - c2[0]) <= EPSILON && Math.abs(c1[1] - c2[1]) <= EPSILON;
};

/**
 * Pads a coordinate value to 2 or 3 digits with an optional precision for decimal values.
 *
 * @param {number} n The coordinate value
 * @param {boolean=} opt_isLon If n is a longitudinal value (pads to 3 digits if true, 2 if false)
 * @param {number=} opt_precision Decimal precision
 * @return {string} The padded value
 */
export const padCoordinate = function(n, opt_isLon, opt_precision) {
  var isLon = opt_isLon !== undefined ? opt_isLon : false;
  var length = isLon ? 3 : 2;
  // padNumber does not handle negative numbers
  var neg = n < 0;
  var val = padNumber(Math.abs(n), length, opt_precision);
  return (neg ? '-' : '') + val;
};

/**
 * Parses a coordinate value into sexagesimal format.
 *
 * @param {number} coordinate The coordinate
 * @param {boolean=} opt_isLon If the coordinate is a longitudinal value (default true)
 * @param {boolean=} opt_symbols If symbols should be displayed (default true)
 * @param {number=} opt_decimalSeconds Number of decimals to display for seconds, default is 2
 * @return {string} The formatted coordinate
 */
export const toSexagesimal = function(coordinate, opt_isLon, opt_symbols, opt_decimalSeconds) {
  var isLon = opt_isLon !== undefined ? opt_isLon : true;
  var symbols = opt_symbols !== undefined ? opt_symbols : true;
  var isNegative = coordinate < 0;
  var degrees = coordinate > 0 ? Math.floor(coordinate) : Math.ceil(coordinate);
  var tMinutes = Math.abs((degrees - coordinate) * 60);
  var minutes = Math.floor(tMinutes);
  var seconds = (tMinutes - minutes) * 60;
  var paddedSeconds = padCoordinate(seconds, false, opt_decimalSeconds != null ? opt_decimalSeconds : 2);
  // Sometimes padding will round up.
  if (paddedSeconds.startsWith('60')) {
    seconds = Math.abs(Math.abs(seconds) - 60.0);
    paddedSeconds = padCoordinate(seconds, false, opt_decimalSeconds != null ? opt_decimalSeconds : 2);
    minutes += 1;
  }
  var paddedMinutes = padCoordinate(minutes);
  if (paddedMinutes.startsWith('60')) {
    minutes = Math.floor(Math.abs(tMinutes - 60.0));
    paddedMinutes = padCoordinate(minutes);
    degrees += (!isNegative ? 1.0 : -1.0);
  }
  return buildString(padCoordinate(Math.abs(degrees), isLon), (symbols ? '° ' : ''),
      paddedMinutes, (symbols ? '\' ' : ''),
      paddedSeconds, (symbols ? '" ' : ''),
      (isLon ? (isNegative ? 'W' : 'E') : (isNegative ? 'S' : 'N')));
};

/**
 * Parses a coordinate value into Degrees Decimal Minutes (DDM) format.
 *
 * @param {number} coordinate The coordinate
 * @param {boolean=} opt_isLon If the coordinate is a longitudinal value (default true)
 * @param {boolean=} opt_symbols If symbols should be displayed (default true)
 * @return {string} The formatted coordinate
 */
export const toDegreesDecimalMinutes = function(coordinate, opt_isLon, opt_symbols) {
  var isLon = opt_isLon !== undefined ? opt_isLon : true;
  var symbols = opt_symbols !== undefined ? opt_symbols : true;
  var isNegative = coordinate < 0;
  var degrees = coordinate > 0 ? Math.floor(coordinate) : Math.ceil(coordinate);
  var minutes = Math.abs((degrees - coordinate) * 60);
  var paddedMinutes = padCoordinate(minutes, false, 2);
  // Sometimes padding will round up.
  if (paddedMinutes.startsWith('60')) {
    minutes = Math.abs(Math.abs((degrees - coordinate) * 60) - 60.0);
    paddedMinutes = padCoordinate(minutes, false, 2);
    degrees += (!isNegative ? 1.0 : -1.0);
  }

  return buildString(padCoordinate(Math.abs(degrees), isLon), (symbols ? '° ' : ''),
      paddedMinutes, (symbols ? '\' ' : ''),
      (isLon ? (isNegative ? 'W' : 'E') : (isNegative ? 'S' : 'N')));
};

/**
 * Normalizes a latitude value to the given range
 *
 * @param {number} lat
 * @return {number}
 * @deprecated Please use os.geo2.normalizeLatitude instead as it does not require conversion to/from lonlat before/after
 */
export const normalizeLatitude = function(lat) {
  return lat > 90 ? 90 : lat < -90 ? -90 : lat;
};

/**
 * Takes a length 4 array of numbers (extent) and converts it to polygon coordinates
 *
 * @param {!Array<number>} extent
 * @return {!Array<!Array<number>>}
 */
export const extentToCoordinates = function(extent) {
  var topLeft = [extent[0], extent[3]];
  var topRight = [extent[2], extent[3]];
  var bottomLeft = [extent[0], extent[1]];
  var bottomRight = [extent[2], extent[1]];
  return [topLeft, topRight, bottomRight, bottomLeft, topLeft];
};

/**
 * Normalizes a longitude value to the given range
 *
 * @param {number} lon
 * @param {number=} opt_min
 * @param {number=} opt_max
 * @return {number}
 * @deprecated Please use os.geo2.normalizeLongitude instead as it does not require conversion to/from lonlat before/after
 */
export const normalizeLongitude = function(lon, opt_min, opt_max) {
  if (opt_min !== undefined && opt_max !== undefined) {
    // todo: the modulo version below is a bit faster, so
    // verify if that also works with an arbitrary range.
    while (lon < opt_min) {
      lon += 360;
    }

    while (lon > opt_max) {
      lon -= 360;
    }

    return lon;
  } else {
    return lon > 180 ? ((lon + 180) % 360) - 180 :
      lon < -180 ? ((lon - 180) % 360) + 180 :
        lon;
  }
};

/**
 * Determines if target crosses the dateline/
 * anti-meridian. Array format [xmin, ymin, xmax, ymax]
 *
 * @param {Array<number>|Geometry|Feature} target
 * @return {boolean}
 * @suppress {deprecated}
 */
export const crossesDateLine = function(target) {
  if (target) {
    var extent;

    if (target instanceof Array) {
      extent = target;
    }

    if (target instanceof Geometry) {
      if (target instanceof Point) {
        // points can't cross the date line
        return false;
      } else if (target instanceof LineString) {
        var flatCoordinates = target.getFlatCoordinates();
        var stride = target.getStride();
        var current = normalizeLongitude(flatCoordinates[0]);
        var crosses = false;
        for (var i = 0; i < flatCoordinates.length - stride; i += stride) {
          // normalize within +/- 180. if neither point is on the date line and the difference between longitudes is
          // greater than 180, assume the date line was crossed.
          var next = normalizeLongitude(flatCoordinates[i + stride]);
          if (Math.abs(current) != 180 && Math.abs(next) != 180 && Math.abs(next - current) > 180) {
            crosses = true;
            break;
          }

          // only compare closest points that are not on the date line
          if (Math.abs(next) != 180) {
            current = next;
          }
        }

        return crosses;
      } else if (target instanceof MultiLineString) {
        // if any of the lines cross, the geometry crosses
        var lineStrings = target.getLineStrings();
        return lineStrings.some(crossesDateLine);
      } else {
        // default to checking the extent of the geometry
        extent = target.getExtent();
      }
    }

    if (target instanceof Feature) {
      var geometry = target.getGeometry();
      return geometry ? crossesDateLine(geometry) : false;
    }

    if (extent && extent.length > 3) {
      var xmin = Math.min(extent[0], extent[2]);
      var xmax = Math.max(extent[0], extent[2]);
      return !((xmin < -180 && xmax < -180) || (xmin > 180 && xmax > 180) || (xmin > -180 && xmax < 180));
    }
  }
  return false;
};

/**
 * Normalize a set of coordinates.
 *
 * @param {?Array<Array<number>>} coordinates The coordinates to normalize.
 * @param {number=} opt_to The longitude to normalize to.
 * @deprecated Please use os.geo2.noralizeCoordinates instead as it does not require conversion to/from lonlat before/after
 * @suppress {deprecated}
 */
export const normalizeCoordinates = function(coordinates, opt_to) {
  if (coordinates && coordinates.length > 0) {
    var to = opt_to != null ? opt_to : normalizeLongitude(coordinates[0][0]);

    // normalize coords against the target
    for (var i = 0; i < coordinates.length; i++) {
      coordinates[i][0] = normalizeLongitude(coordinates[i][0], to - 180, to + 180);
      coordinates[i][1] = normalizeLatitude(coordinates[i][1]);
    }
  }
};

/**
 * Normalize polygon rings.
 *
 * @param {?Array<?Array<Array<number>>>} rings The rings to normalize.
 * @param {number=} opt_to The longitude to normalize to.
 * @deprecated Please use os.geo2.normalizeRings instead as it does not require conversion to/from lonlat before/after
 */
export const normalizeRings = function(rings, opt_to) {
  if (rings) {
    for (var i = 0; i < rings.length; i++) {
      normalizeCoordinates(rings[i], opt_to);
    }
  }
};

/**
 * @param {?Array<?Array<?Array<Array<number>>>>} polys The polygons to normalize.
 * @param {number=} opt_to The longitude to normalize to.
 * @deprecated Please use os.geo2.normalizePolygons instead as it does not require conversion to/from lonlat before/after
 */
export const normalizePolygons = function(polys, opt_to) {
  if (polys) {
    for (var i = 0; i < polys.length; i++) {
      normalizeRings(polys[i], opt_to);
    }
  }
};

/**
 * Returns true if geometry coordinates are normlized.
 *
 * @param {Geometry|undefined} geometry The geometry to normalize.
 * @param {number=} opt_to The longitude to normalize to.
 * @return {boolean} If the geometry was normalized.
 * @deprecated Please use os.geo2.normalizeGeometryCoordinates instead as it does not require conversion to/from lonlat before/after
 * @suppress {deprecated}
 */
export const normalizeGeometryCoordinates = function(geometry, opt_to) {
  if (geometry) {
    if (geometry.get(GeometryField.NORMALIZED) || isWorldQuery(geometry)) {
      return false;
    }

    var /** @type {Array<(Array<number>|null)>|null} */ coordinates = null;

    switch (geometry.getType()) {
      case GeometryType.POINT:
        var point = /** @type {Point} */ (geometry);
        var /** @type {Array<number>} */ coord = point.getCoordinates();
        var to = opt_to != null ? opt_to : 0;
        coord[0] = normalizeLongitude(coord[0], to - 180, to + 180);
        coord[1] = normalizeLatitude(coord[1]);
        point.setCoordinates(coord);
        return true;
      case GeometryType.LINE_STRING:
      case GeometryType.MULTI_POINT:
        var lineString = /** @type {LineString|MultiPoint} */ (geometry);
        coordinates = lineString.getCoordinates();
        normalizeCoordinates(coordinates, opt_to);
        lineString.setCoordinates(coordinates);
        return true;
      case GeometryType.POLYGON:
      case GeometryType.MULTI_LINE_STRING:
        var polygon = /** @type {Polygon|MultiLineString} */ (geometry);
        var /** @type {?Array<?Array<Array<number>>>} */ rings = polygon.getCoordinates();

        normalizeRings(rings, opt_to);
        polygon.setCoordinates(rings);
        return true;
      case GeometryType.MULTI_POLYGON:
        var multiPolygon = /** @type {MultiPolygon} */ (geometry);
        var polygons = /** @type {?Array<?Array<?Array<Array<number>>>>} */ (
          multiPolygon.getCoordinates());

        normalizePolygons(polygons, opt_to);
        multiPolygon.setCoordinates(polygons);
        return true;
      case GeometryType.GEOMETRY_COLLECTION:
        var geometryCollection = /** @type {GeometryCollection} */ (geometry);
        var /** @type {Array<Geometry>} */ geometries = geometryCollection.getGeometriesArray();
        for (var i = 0; i < geometries.length; i++) {
          normalizeGeometryCoordinates(geometries[i], opt_to);
        }
        return true;
      case 'Circle':
      default:
        break;
    }
  }

  return false;
};

/**
 * Linear easing function
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 * @deprecated Please use easing.easeLinear instead
 */
export const easeLinear = function(t, b, c, d) {
  return easing.easeLinear(t, b, c, d);
};

/**
 * Quintic easing function
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 * @deprecated Please use easing.easeQuintic instead
 */
export const easeQuintic = function(t, b, c, d) {
  return easing.easeQuintic(t, b, c, d);
};

/**
 * Quartic easing function
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 * @deprecated Please use easing.easeQuartic instead
 */
export const easeQuartic = function(t, b, c, d) {
  return easing.easeQuartic(t, b, c, d);
};

/**
 * Exponential easing function
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 * @deprecated Please use easing.easeExpo instead
 */
export const easeExpo = function(t, b, c, d) {
  return easing.easeExpo(t, b, c, d);
};

/**
 * Circular easing function (this is CircleIn, not CircleOut)
 *
 * @param {number} t The current step (out of the total duration)
 * @param {number} b The start value or offset
 * @param {number} c The amount to change the start value
 * @param {number} d The duration or total number of steps
 * @return {number}
 * @deprecated Please use easing.easeCircular instead
 */
export const easeCircular = function(t, b, c, d) {
  return easing.easeCircular(t, b, c, d);
};

/**
 * Test if a coordinate is inside an area bound by the provided vertices.
 *
 * @param {number} x Coordinate x value.
 * @param {number} y Coordinate y value.
 * @param {Array<number>} vertX The x values for vertices in the area.
 * @param {Array<number>} vertY The y values for vertices in the area.
 * @param {number} nVert The number of vertices.
 * @return {boolean}
 */
export const isCoordInArea = function(x, y, vertX, vertY, nVert) {
  var inArea = false;
  for (var i = 0, j = nVert - 1; i < nVert; j = i++) {
    if (((vertY[i] > y) != (vertY[j] > y)) &&
        (x < (vertX[j] - vertX[i]) * (y - vertY[i]) / (vertY[j] - vertY[i]) + vertX[i])) {
      inArea = !inArea;
    }
  }

  return inArea;
};

/**
 * Construct a polygon that caps one of the poles. Translated from Desktop's JTSUtilities.java#createPolarPolygon.
 *
 * @param {Array<Array<number>>} coordinates The polygon coordinates to convert.
 * @return {Array<Array<number>>} A polygon that circumscribes the pole closest to the input coordinates.
 *
 * @todo currently this only works for polygons which have no holes.
 * @suppress {deprecated}
 */
export const createPolarPolygon = function(coordinates) {
  var newCoords = [coordinates.length + 4];

  // normalize longitudes first or the correction could be made at the wrong index
  for (var i = 0; i < coordinates.length; i++) {
    coordinates[i][1] = normalizeLongitude(coordinates[i][1]);
  }

  for (var i = 1; i < coordinates.length; i++) {
    var dx = coordinates[i][0] - coordinates[i - 1][0];
    if (Math.abs(dx) > 180) {
      arrayCopy(coordinates, 0, newCoords, 0, i);
      arrayCopy(coordinates, i, newCoords, i + 4, coordinates.length - i);

      var polarLat = Math.sign(newCoords[i - 1][1]) * 90;
      if (dx < 180) {
        newCoords[i] = [180, newCoords[i - 1][1]];
        newCoords[i + 1] = [180, polarLat];
        newCoords[i + 2] = [-180, polarLat];
        newCoords[i + 3] = [-180, newCoords[i + 4][1]];
      } else {
        newCoords[i] = [-180, newCoords[i - 1][1]];
        newCoords[i + 1] = [-180, polarLat];
        newCoords[i + 2] = [180, polarLat];
        newCoords[i + 3] = [180, newCoords[i + 4][1]];
      }
    }
  }

  return newCoords;
};

/**
 * Check if a polygon caps one of the poles. Translated from Desktop's OGCFilterGenerator.java#processPolygon.
 *
 * @param {Array<Array<number>>} coordinates The polygon's exterior ring.
 * @return {boolean} If the polygon caps a pole
 */
export const isPolarPolygon = function(coordinates) {
  var total = 0;
  if (coordinates) {
    for (var i = 1; i < coordinates.length; i++) {
      var dx = coordinates[i][0] - coordinates[i - 1][0];
      if (dx > 180) {
        dx -= 360;
      } else if (dx < -180) {
        dx += 360;
      }
      total += dx;
    }
  }

  return Math.abs(total) > 1;
};

/**
 * Does this extent have valid lat lon min/max values?
 *
 * @param {ol.Extent} extent
 * @return {boolean}
 * @suppress {deprecated}
 */
export const isValidExtent = function(extent) {
  var invalid = false;

  invalid = extent[0] == extent[1] == extent[2] == extent[3];
  // If the values dont change when normalized, they are valid
  invalid = invalid || extent[1] != normalizeLatitude(extent[1]);
  invalid = invalid || extent[2] != normalizeLongitude(extent[2], extent[0], extent[0] + 360);
  invalid = invalid || extent[3] != normalizeLatitude(extent[3]);
  return !invalid;
};

/**
 * Stringifies an extent with the format `<minY>, <minX>, <maxY>, <maxX>`
 *
 * @param {ol.Extent} extent
 * @param {number=} opt_precision
 * @return {string}
 */
export const stringifyExtent = function(extent, opt_precision) {
  var s = '';

  if (opt_precision != null && opt_precision > 0) {
    s = extent[1].toFixed(opt_precision) + ', ' + extent[0].toFixed(opt_precision) + ', ' +
        extent[3].toFixed(opt_precision) + ', ' + extent[2].toFixed(opt_precision);
  } else {
    s = extent[1] + ', ' + extent[0] + ', ' + extent[3] + ', ' + extent[2];
  }

  return s;
};

/**
 * Determine if an array of coordinates is in counter-clockwise order. Returns false if the ring is not closed, or not
 * large enough (minimum of 4 coordinates).
 *
 * @param {!Array<ol.Coordinate>} coords Coordinates in the ring.
 * @return {boolean}
 */
export const isCCW = function(coords) {
  var diff = 0;

  if (coords.length > 3 && isClosed(coords)) {
    for (var i = 0; i < coords.length; i++) {
      var c1 = coords[i];
      var c2 = coords[(i + 1 == coords.length ? 0 : i + 1)];
      diff += (c2[0] - c1[0]) * (c2[1] + c1[1]);
    }
  }

  return diff < 0;
};

/**
 * Determine if we should normalize these Coordinates
 * If the set of coordinates are fully outside of -180 to 180, then normalize it
 * If its a mixture, don't so it shows across the dateline correctly
 *
 * @param {Array<Array<number>>} coords
 * @return {boolean} - if true, normalize the polygon
 */
export const shouldNormalize = function(coords) {
  if (coords && coords.length > 0) {
    var outsideOfNormal = undefined;
    return coords.every(function(coord) {
      var lon = coord[0];
      if (lon >= 180 || lon <= -180) {
        if (outsideOfNormal !== undefined && !outsideOfNormal) {
          return false;
        } else {
          outsideOfNormal = true;
        }
      } else if (outsideOfNormal !== undefined && outsideOfNormal) {
        return false;
      } else {
        outsideOfNormal = false;
      }
      return true;
    });
  }
  return false;
};

/**
 * @type {number}
 */
export const R2D = 180 / Math.PI;

/**
 * @type {number}
 */
export const D2R = Math.PI / 180;

/**
 * Flatten geometry collections containing a single geometry.
 *
 * @param {Geometry} geometry The original geometry.
 * @return {Geometry} The flattened geometry.
 */
export const flattenGeometry = function(geometry) {
  if (geometry instanceof GeometryCollection) {
    var geometries = geometry.getGeometriesArray();
    if (geometries.length === 1) {
      return flattenGeometry(geometries[0]);
    }
  }

  return geometry;
};

/**
 * Merges a `MultiLineString` geometry across the date line. Assumes the geometry was created by
 * `os.geo.splitOnDateLine`.
 *
 * @param {!(LineString|MultiLineString)} geometry The line geometry.
 * @return {!LineString} The merged line.
 */
export const mergeLineGeometry = function(geometry) {
  if (geometry instanceof LineString) {
    return geometry;
  }

  var flatCoordinates = geometry.getFlatCoordinates().slice();
  var layout = geometry.getLayout();
  var stride = geometry.getStride();
  var ends = geometry.getEnds();

  var i = ends.length;
  while (i--) {
    var index = ends[i];

    // if the coordinates are the same at a split, assume one was added by `os.geo.splitOnDateLine`. if longitude is
    // normalized on one side, the sum of those values will equal 360.
    if ((flatCoordinates[index - stride] === flatCoordinates[index] ||
        Math.abs(flatCoordinates[index - stride]) + Math.abs(flatCoordinates[index]) === 360) &&
        flatCoordinates[index - stride + 1] === flatCoordinates[index + 1] &&
        (stride < 3 || flatCoordinates[index - stride + 2] === flatCoordinates[index + 2])) {
      flatCoordinates.splice(index - stride, stride);
    }
  }

  var line = new LineString([], layout);
  line.setFlatCoordinates(layout, flatCoordinates);

  return line;
};

/**
 * Splits a geometry across the date line.
 *
 * @param {!Geometry} geometry The geometry.
 * @return {!Geometry} The split geometry, or the original if it couldn't be split.
 */
export const splitOnDateLine = function(geometry) {
  // only supports lines and multi-lines right now
  var geometryType = geometry.getType();
  if (geometryType !== GeometryType.LINE_STRING &&
      geometryType !== GeometryType.MULTI_LINE_STRING) {
    return geometry;
  }

  // if the geometry has already been normalized or does not cross the date line, don't try to split it
  if (geometry.get(GeometryField.NORMALIZED) || !crossesDateLine(geometry)) {
    return geometry;
  }

  var result;
  if (geometry instanceof LineString) {
    var resultCoordinates = splitLineOnDateLine_(geometry);
    result = createLineFromSegments_(resultCoordinates, geometry.getLayout());
  } else if (geometry instanceof MultiLineString) {
    var resultCoordinates = splitMultiLineOnDateLine_(geometry);
    result = createLineFromSegments_(resultCoordinates, geometry.getLayout());
  }
  if (result instanceof Geometry) {
    getFunctionalExtent(result);
  }

  // mark as normalized so coordinates will not be modified further
  result.set(GeometryField.NORMALIZED, true);

  return result;
};

/**
 * Create a line or multiline, depending on how many segments are provided.
 *
 * @param {!Array<!Array<!ol.Coordinate>>} segments The line segments.
 * @param {GeometryLayout} layout The geometry layout.
 * @return {!(LineString|MultiLineString)} The line or multiline.
 */
const createLineFromSegments_ = function(segments, layout) {
  return segments.length > 1 ?
    new MultiLineString(segments, layout) :
    new LineString(segments[0], layout);
};

/**
 * Splits a line geometry across the date line, returning the split coordinates.
 *
 * @param {!LineString} geometry The line geometry.
 * @return {!Array<!Array<!ol.Coordinate>>} The split line coordinates.
 * @suppress {deprecated}
 */
const splitLineOnDateLine_ = function(geometry) {
  // normalize longitude to +/- 180
  var coordinates = geometry.getCoordinates();
  coordinates.forEach(function(c) {
    c[0] = normalizeLongitude(c[0]);
  });

  var lineStart = 0;
  var resultCoordinates = [];

  for (var i = 0; i < coordinates.length - 1; i++) {
    var current = coordinates[i];
    var next = coordinates[i + 1];
    var lonDiff = next[0] - current[0];

    // assumes the date line was crossed if consecutive points are > 180 degrees longitude from one another
    if (Math.abs(lonDiff) > 180) {
      // add a copy of the next coordinate to avoid a gap in the line
      var lineCoords = coordinates.slice(lineStart, i + 1);
      var nextCopy = next.slice();

      // normalize the next longitude against the current line
      nextCopy[0] = lonDiff > 0 ? nextCopy[0] - 360 : nextCopy[0] + 360;
      lineCoords.push(nextCopy);

      // add the split segment
      resultCoordinates.push(lineCoords);
      lineStart = i + 1;
    }
  }

  // add the last segment if not on the last coordinate
  if (lineStart !== coordinates.length - 1) {
    resultCoordinates.push(coordinates.slice(lineStart));
  }

  return resultCoordinates;
};

/**
 * Splits a multiline geometry across the date line, returning the split coordinates.
 *
 * @param {!MultiLineString} geometry The multiline geometry.
 * @return {!Array<!Array<!ol.Coordinate>>} The split line coordinates.
 */
const splitMultiLineOnDateLine_ = function(geometry) {
  // split each line in the multiline
  var lineStrings = geometry.getLineStrings();
  return lineStrings.reduce(function(result, line) {
    var splitCoordinates = line ? splitLineOnDateLine_(line) : [];
    return result.concat(splitCoordinates);
  }, []);
};
