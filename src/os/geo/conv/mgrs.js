goog.provide('os.geo.conv.MGRS');
goog.require('goog.math');
goog.require('goog.math.Coordinate');
goog.require('goog.string');
goog.require('os.geo');
goog.require('os.geo.conv.LatitudeBand');
goog.require('os.geo.conv.UTM');



/**
 * This is a partial port of GeoTrans 2.4.2. It allows conversion from
 * an MGRS grid coordinate to a Lon/Lat Point. You can also get lower-left and
 * upper-right lon/lat coordinates for the grid by doing the following:
 *
 * var grid = new MGRS(mgrsString);
 * var lowerLeft = grid.convertToGeodetic();
 * grid.toMaxEastNorth();
 * var upperRight = grid.convertToGeodetic();
 *
 * @param {string} mgrs
 * @constructor
 * @deprecated Use osasm.toMGRS() and osasm.toLonLat(). This implementation does not support polar regions.
 */
os.geo.conv.MGRS = function(mgrs) {
  /**
   * @type {number|undefined}
   */
  this.zone = undefined;

  /**
   * @type {Array.<number>}
   */
  this.letters = [];

  /**
   * @type {number}
   */
  this.easting = 0;

  /**
   * @type {number}
   */
  this.northing = 0;

  /**
   * @type {number|undefined}
   */
  this.precision = undefined;

  /**
   * @type {number}
   */
  this.maxEasting = 0;

  /**
   * @type {number}
   */
  this.minEasting = 0;

  /**
   * @type {number}
   */
  this.maxNorthing = 0;

  /**
   * @type {number}
   */
  this.minNorthing = 0;

  /**
   * @type {boolean}
   */
  this.validZone = true;

  this.initialize_(mgrs);
};


/**
 * @param {string} mgrs
 * @private
 */
os.geo.conv.MGRS.prototype.initialize_ = function(mgrs) {
  mgrs = mgrs.replace(/\s+/, '');  // mgrs.replaceAll("\\s", "");
  mgrs = mgrs.toUpperCase(); // mgrs.trim().toUpperCase();

  // check that the string is a valid MGRS string
  var match = mgrs.match(os.geo.conv.MGRS.REGEXP);

  if (match != null && match.length > 0) {
    var zoneStr = '';
    var i = 0;
    while (i < mgrs.length && goog.string.isNumeric(mgrs.charAt(i))) {
      zoneStr += mgrs.charAt(i);
      i++;
    }

    // get the zone number
    try {
      this.zone = parseInt(zoneStr, 10);
    } catch (e) {
      this.validZone = false;
    }

    // add the letter indices

    while (i < mgrs.length && goog.string.isAlpha(mgrs.charAt(i))) {
      var index = os.geo.conv.MGRS.LETTERS.indexOf(mgrs.charAt(i));
      if (index >= 0) {
        this.letters.push(index);
      }
      i++;
    }

    var rest = mgrs.substring(i);
    if (rest.length > 0) {
      if (rest.length % 2 == 0) {
        this.precision = rest.length / 2;
        this.easting = parseFloat(rest.substring(0, this.precision)) * Math.pow(10, 5 - this.precision);
        this.northing = parseFloat(rest.substring(this.precision)) * Math.pow(10, 5 - this.precision);
      } else {
        throw new Error('The MGRS string "' + mgrs + '" was not valid');
      }
    } else {
      this.precision = 0;
      this.easting = 0;
      this.northing = 0;
    }

    var max = Math.pow(10, 5 - this.precision);
    this.minEasting = this.easting;
    this.minNorthing = this.northing;
    this.maxEasting = this.easting + max;
    this.maxNorthing = this.northing + max;
  } else {
    throw new Error('The MGRS string "' + mgrs + '" was not valid');
  }
};


/**
 * @type {RegExp}
 * @const
 */
os.geo.conv.MGRS.REGEXP = os.geo.MGRS_REGEXP;


/**
 * @type {string}
 * @const
 */
os.geo.conv.MGRS.LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';


/**
 * Array indices for each letter.
 * @enum {number}
 * @const
 */
os.geo.conv.MGRS.LETTER = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
  I: 8,
  J: 9,
  K: 10,
  L: 11,
  M: 12,
  N: 13,
  O: 14,
  P: 15,
  Q: 16,
  R: 17,
  S: 18,
  T: 19,
  U: 20,
  V: 21,
  W: 22,
  X: 23,
  Y: 24,
  Z: 25
};


/**
 * One hundred thousand
 * @type {number}
 * @const
 */
os.geo.conv.MGRS.ONEHT = 100000.0;


/**
 * Two million
 * @type {number}
 * @const
 */
os.geo.conv.MGRS.TWOMIL = 2000000.0;


/**
 * Semi-major axis of ellipsoid in meters
 * @type {number}
 * @const
 */
os.geo.conv.MGRS.MGRS_A = 6378137.0;


/**
 * Flattening of ellipsoid
 * @type {number}
 * @const
 */
os.geo.conv.MGRS.MGRS_F = 1 / 298.257223563;


/**
 * @type {string}
 * @const
 */
os.geo.conv.MGRS.MGRS_ELLIPSOID_CODE = 'WE';


/**
 * @type {string}
 * @const
 */
os.geo.conv.MGRS.CLARKE_1866 = 'CC';


/**
 * @type {string}
 * @const
 */
os.geo.conv.MGRS.CLARKE_1880 = 'CD';


/**
 * @type {string}
 * @const
 */
os.geo.conv.MGRS.BESSEL_1841 = 'BR';


/**
 * @type {string}
 * @const
 */
os.geo.conv.MGRS.BESSEL_1841_NAMIBIA = 'BN';


/**
 * Latitude band lookup table
 * @type {Array.<os.geo.conv.LatitudeBand>}
 * @const
 */
os.geo.conv.MGRS.LATITUDE_BANDS = [
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.C, 1100000.0, -72.0, -80.5, 0.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.D, 2000000.0, -64.0, -72.0, 2000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.E, 2800000.0, -56.0, -64.0, 2000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.F, 3700000.0, -48.0, -56.0, 2000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.G, 4600000.0, -40.0, -48.0, 4000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.H, 5500000.0, -32.0, -40.0, 4000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.J, 6400000.0, -24.0, -32.0, 6000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.K, 7300000.0, -16.0, -24.0, 6000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.L, 8200000.0, -8.0, -16.0, 8000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.M, 9100000.0, 0.0, -8.0, 8000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.N, 0.0, 8.0, 0.0, 0.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.P, 800000.0, 16.0, 8.0, 0.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.Q, 1700000.0, 24.0, 16.0, 0.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.R, 2600000.0, 32.0, 24.0, 2000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.S, 3500000.0, 40.0, 32.0, 2000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.T, 4400000.0, 48.0, 40.0, 4000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.U, 5300000.0, 56.0, 48.0, 4000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.V, 6200000.0, 64.0, 56.0, 6000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.W, 7000000.0, 72.0, 64.0, 6000000.0),
  new os.geo.conv.LatitudeBand(os.geo.conv.MGRS.LETTER.X, 7900000.0, 84.5, 72.0, 6000000.0)
];


/**
 * Converts the MGRS grid coordinate to a lon/lat point that represents the lower-left corner of the grid.
 * To get the upper-right coordinate, use the toMaxEastNorth() method and then call this method.
 *
 * @return {goog.math.Coordinate} Coordinate representing lon/lat in degrees
 */
os.geo.conv.MGRS.prototype.convertToGeodetic = function() {
  if (this.validZone) {
    var utm = this.convertToUTM();
    utm.setParameters(os.geo.conv.MGRS.MGRS_A, os.geo.conv.MGRS.MGRS_F);

    return utm.convertToLonLat();
    // add the maximum easting and northing for the given precision
  } else {
    // We aren't supporting UPS coordinates yet
    //      UPS ups = convertMGRSToUPS(MGRS);
    //      ups.setParameters(MGRS_a, MGRS_f);
    //      return ups.convertToGeodetic();
    throw new Error('MGRS UPS conversion not implemented.');
  }
};


/**
 * Translate coordinates to the upper left corner.
 */
os.geo.conv.MGRS.prototype.toUpperLeft = function() {
  this.easting = this.minEasting;
  this.northing = this.maxNorthing;
};


/**
 * Translate coordinates to the upper right corner.
 */
os.geo.conv.MGRS.prototype.toUpperRight = function() {
  this.easting = this.maxEasting;
  this.northing = this.maxNorthing;
};


/**
 * Translate coordinates to the lower right corner.
 */
os.geo.conv.MGRS.prototype.toLowerRight = function() {
  this.easting = this.maxEasting;
  this.northing = this.minNorthing;
};


/**
 * Translate coordinates to the lower left corner.
 */
os.geo.conv.MGRS.prototype.toLowerLeft = function() {
  this.easting = this.minEasting;
  this.northing = this.minNorthing;
};


/**
 * Calculates the center point of this MGRS grid/cell
 * @return {goog.math.Coordinate} Coordinate representing the center point of this MGRS grid/cell
 */
os.geo.conv.MGRS.prototype.getCenterPoint = function() {
  // Get opposite corners
  this.toLowerLeft();
  var lowerLeft = this.convertToGeodetic();
  this.toUpperRight();
  var upperRight = this.convertToGeodetic();

  // Now find the center point of the box
  var lonDist = upperRight.x - lowerLeft.x;
  var latDist = upperRight.y - lowerLeft.y;

  var centerLon = (lowerLeft.x + (lonDist / 2));
  var centerLat = (lowerLeft.y + (latDist / 2));

  return new goog.math.Coordinate(centerLon, centerLat);
};


/**
 * Converts this MGRS to UTM.
 * @return {os.geo.conv.UTM}
 * @throws {Error} If the MGRS instance can't be converted
 */
os.geo.conv.MGRS.prototype.convertToUTM = function() {
  var hemisphere = '1';

  if (!goog.isDef(this.zone)) {
    throw new Error('Zone must be defined to convert to UTM!');
  } else if (this.letters[0] == os.geo.conv.MGRS.LETTER.X &&
      ((this.zone == 32) || (this.zone == 34) || (this.zone == 36))) {
    throw new Error('Cannot convert to UTM');
  } else if (this.letters[0] < os.geo.conv.MGRS.LETTER.N) {
    hemisphere = 'S';
  } else {
    hemisphere = 'N';
  }

  var ltr2LowValue = 0;
  var ltr2HighValue = 0;
  var patternOffset;
  var number = this.zone % 6;

  // false northing on appears to be correct
  var falseNorthing = true;

  if ((number == 1) || (number == 4)) {
    ltr2LowValue = os.geo.conv.MGRS.LETTER.A;
    ltr2HighValue = os.geo.conv.MGRS.LETTER.H;
  } else if ((number == 2) || (number == 5)) {
    ltr2LowValue = os.geo.conv.MGRS.LETTER.J;
    ltr2HighValue = os.geo.conv.MGRS.LETTER.R;
  } else if ((number == 3) || (number == 0)) {
    ltr2LowValue = os.geo.conv.MGRS.LETTER.S;
    ltr2HighValue = os.geo.conv.MGRS.LETTER.Z;
  }

  /* False northing at A for second letter of grid square */
  if (falseNorthing) {
    if ((number % 2) == 0) {
      patternOffset = 500000.0;
    } else {
      patternOffset = 0.0;
    }
  } else if ((number % 2) == 0) {
    patternOffset = 1500000.0;
  } else {
    patternOffset = 1000000.00;
  }

  // Check that the second letter of the MGRS string is within
  // the range of valid second letter values. Also check that
  // the third letter is valid

  if (this.letters[1] < ltr2LowValue || this.letters[1] > ltr2HighValue ||
      this.letters[2] > os.geo.conv.MGRS.LETTER.V) {
    // Log.error("Letter2: " + letters[1] + " Range: " + ltr2LowValue + " - " + ltr2HighValue, 'MGRS');
    // Log.error("Letter3: " + letters[2], 'MGRS');
    throw new Error('MGRS Second letter is not in valid range.');
  }

  var rowLetterNorthing = Number((this.letters[2]) * os.geo.conv.MGRS.ONEHT);
  var gridEasting = os.geo.conv.MGRS.findGridEasting_(this.letters[1], ltr2LowValue);

  if (this.letters[2] > os.geo.conv.MGRS.LETTER.O) {
    rowLetterNorthing = rowLetterNorthing - os.geo.conv.MGRS.ONEHT;
  }

  if (this.letters[2] > os.geo.conv.MGRS.LETTER.I) {
    rowLetterNorthing = rowLetterNorthing - os.geo.conv.MGRS.ONEHT;
  }

  if (rowLetterNorthing >= os.geo.conv.MGRS.TWOMIL) {
    rowLetterNorthing -= os.geo.conv.MGRS.TWOMIL;
  }

  var band = os.geo.conv.MGRS.getLatitudeBand_(this.letters[0]);
  var gridNorthing = rowLetterNorthing - patternOffset;
  if (gridNorthing < 0) {
    gridNorthing += os.geo.conv.MGRS.TWOMIL;
  }

  gridNorthing += band.northingOffset;

  if (gridNorthing < band.minNorthing) {
    gridNorthing += os.geo.conv.MGRS.TWOMIL;
  }

  var utmEasting = gridEasting + this.easting;
  var utmNorthing = gridNorthing + this.northing;

  return new os.geo.conv.UTM(this.zone, hemisphere, utmEasting, utmNorthing);
};


/**
 * @param {number} letter
 * @return {os.geo.conv.LatitudeBand}
 * @private
 */
os.geo.conv.MGRS.getLatitudeBand_ = function(letter) {
  var value = null;

  if ((letter >= os.geo.conv.MGRS.LETTER.C) && (letter <= os.geo.conv.MGRS.LETTER.H)) {
    value = os.geo.conv.MGRS.LATITUDE_BANDS[letter - 2];
  } else if ((letter >= os.geo.conv.MGRS.LETTER.J) && (letter <= os.geo.conv.MGRS.LETTER.N)) {
    value = os.geo.conv.MGRS.LATITUDE_BANDS[letter - 3];
  } else if ((letter >= os.geo.conv.MGRS.LETTER.P) && (letter <= os.geo.conv.MGRS.LETTER.X)) {
    value = os.geo.conv.MGRS.LATITUDE_BANDS[letter - 4];
  }

  return value;
};


/**
 * @inheritDoc
 */
os.geo.conv.MGRS.prototype.toString = function() {
  var l = this.letters.join(', ');
  return 'MGRS{zone: ' + this.zone + ' letters: ' + l + ' easting: ' + this.easting + ' northing: ' + this.northing +
      ' precision: ' + this.precision + '}';
};


/**
 * Utility function to get the center point of an MGRS location
 * @param {string} mgrsValue The MGRS string
 * @return {goog.math.Coordinate} Coordinate representing the lon/lat center point
 */
os.geo.conv.MGRS.computeCenterPoint = function(mgrsValue) {
  var mgrs = new os.geo.conv.MGRS(mgrsValue);
  return mgrs.getCenterPoint();
};


/**
 * Creates an MGRS string from a latitude and longitude.
 *
 * @param {number} latitude The latitude in degrees.
 * @param {number} longitude The longitude in degrees.
 * @return {string} The MGRS formatted string.
 */
os.geo.conv.MGRS.createString = function(latitude, longitude) {
  // Make sure the longitude is in the -180 to 180 range.
  if (longitude >= 180.) {
    longitude -= Math.floor((longitude + 180.) / 360.) * 360.;
  } else if (longitude < -180.) {
    longitude -= Math.floor((longitude - 180.) / 360.) * 360.;
  }

  var utm = os.geo.conv.UTM.convertFromLonLat(longitude, latitude);

  var precision = 5;

  // Round easting and northing values.
  var divisor = Math.pow(10, 5 - precision);
  var easting = Math.floor(os.geo.conv.MGRS.roundNumber_(utm.easting / divisor) * divisor);
  var northing = Math.floor(os.geo.conv.MGRS.roundNumber_(utm.northing / divisor) * divisor);

  var latBand = os.geo.conv.MGRS.getLatBand_(latitude);
  if (!latBand) {
    return '';
  }

  var latBandIndex = latBand.letter;
  var latBandLetter = os.geo.conv.MGRS.LETTERS.charAt(latBandIndex);

  var number = utm.zone % 6;

  // Find false northing at A for second letter of grid square
  var falseNorthing = 0.;
  if (number % 2 == 0) {
    falseNorthing = 1500000;
  }

  var lowValueIndex = os.geo.conv.MGRS.findLowValueIndex_(utm.zone);

  var squareLetter1Index = os.geo.conv.MGRS.find2ndMGRSLetter_(easting, latBandIndex, utm.zone, lowValueIndex);
  var sqLetter1 = os.geo.conv.MGRS.LETTERS.charAt(squareLetter1Index);

  var squareLetter2Index = os.geo.conv.MGRS.find3rdMGRSLetter_(northing, falseNorthing);
  var sqLetter2 = os.geo.conv.MGRS.LETTERS.charAt(squareLetter2Index);

  // Now go back and calculate grid Easting and grid Northing
  // to find original easting and northing values.
  var band = os.geo.conv.MGRS.getLatitudeBand_(latBandIndex);
  var gridNorthing = os.geo.conv.MGRS.findGridNorthing_(squareLetter2Index, falseNorthing, band.minNorthing);

  // Find grid easting
  var gridEasting = os.geo.conv.MGRS.findGridEasting_(squareLetter1Index, lowValueIndex);

  var mgrsEast = os.geo.conv.MGRS.roundNumber_(easting - gridEasting);
  var mgrsNorth = os.geo.conv.MGRS.roundNumber_(northing - gridNorthing);
  while (mgrsNorth < 0.) {
    mgrsNorth += os.geo.conv.MGRS.TWOMIL;
  }

  return os.geo.conv.MGRS.constructMGRSString_(utm.zone, latBandLetter, sqLetter1, sqLetter2, 5, mgrsEast, mgrsNorth);
};


/**
 * Construct an MGRS string from the given parameters.
 * @param {number} zone The int zone.
 * @param {string} latBand The latitude band.
 * @param {string} square1 The square1 label.
 * @param {string} square2 The square2 label.
 * @param {number} precision The int describing precision (1 - 5).
 * @param {number} easting The easting.
 * @param {number} northing The northing.
 * @return {string} An MGRS string.
 * @private
 */
os.geo.conv.MGRS.constructMGRSString_ = function(zone, latBand, square1, square2, precision, easting, northing) {
  var divisor = Math.pow(10, 5 - precision);
  var modifiedEasting = easting / divisor;
  var modifiedNorthing = northing / divisor;

  var strEasting = String(modifiedEasting);
  var strNorthing = String(modifiedNorthing);

  if (strEasting.length > precision) {
    strEasting = strEasting.substring(0, precision);
  } else if (strEasting.length < precision) {
    while (strEasting.length < precision) {
      strEasting = '0' + strEasting;
    }
  }

  if (strNorthing.length > precision) {
    strNorthing = strNorthing.substring(0, precision);
  } else {
    while (strNorthing.length < precision) {
      strNorthing = '0' + strNorthing;
    }
  }

  // if single digit zone, add a '0' to the beginning.
  var pre = String(zone).length == 1 ? '0' : '';
  return goog.string.buildString(pre, zone, latBand, square1, square2, strEasting, strNorthing);
};


/**
 * Find the latitude band that comprises a given latitude.
 *
 * @param {number} latitude The latitude in degrees.
 * @return {?os.geo.conv.LatitudeBand} The band, or null if the latitude is invalid.
 * @private
 */
os.geo.conv.MGRS.getLatBand_ = function(latitude) {
  for (var i = 0, n = os.geo.conv.MGRS.LATITUDE_BANDS.length; i < n; i++) {
    var band = os.geo.conv.MGRS.LATITUDE_BANDS[i];
    if (latitude < band.north && latitude >= band.south) {
      return band;
    }
  }
  return null;
};


/**
 * Round value to the nearest integer. If the value is equidistant from
 * the two nearest integers, the result is the even integer.
 *
 * @param {number} value The value to round.
 * @return {number} The rounded integer value.
 * @private
 */
os.geo.conv.MGRS.roundNumber_ = function(value) {
  var intValue = Math.floor(value);
  var fraction = value - intValue;

  if (fraction > 0.5 || fraction == 0.5 && intValue % 2 != 0) {
    intValue++;
  }
  return intValue;
};


/**
 * Find the grid easting value.
 * @param {number} index The index of the second MGRS letter.
 * @param {number} lowValueIndex The index of the lower range letter.
 * @return {number} The grid easting value.
 * @private
 */
os.geo.conv.MGRS.findGridEasting_ = function(index, lowValueIndex) {
  var gridEasting = (index - lowValueIndex + 1) * os.geo.conv.MGRS.ONEHT;

  if ((lowValueIndex == os.geo.conv.MGRS.LETTER.J) && (index > os.geo.conv.MGRS.LETTER.O)) {
    gridEasting -= os.geo.conv.MGRS.ONEHT;
  }
  return gridEasting;
};


/**
 * Find the grid northing value.
 * @param {number} index The third MGRS letter index.
 * @param {number} falseNorthing The false northing.
 * @param {number} minNorthing The minimum northing.
 * @return {number} The calculated grid northing value.
 * @private
 */
os.geo.conv.MGRS.findGridNorthing_ = function(index, falseNorthing, minNorthing) {
  var gridNorthing = index * os.geo.conv.MGRS.ONEHT + falseNorthing;
  if (index > os.geo.conv.MGRS.LETTER.O) {
    gridNorthing = gridNorthing - os.geo.conv.MGRS.ONEHT;
  }

  if (index > os.geo.conv.MGRS.LETTER.I) {
    gridNorthing = gridNorthing - os.geo.conv.MGRS.ONEHT;
  }

  if (gridNorthing >= os.geo.conv.MGRS.TWOMIL) {
    gridNorthing = gridNorthing - os.geo.conv.MGRS.TWOMIL;
  }

  var scaledMinNorthing = minNorthing;
  while (scaledMinNorthing >= os.geo.conv.MGRS.TWOMIL) {
    scaledMinNorthing -= os.geo.conv.MGRS.TWOMIL;
  }
  gridNorthing -= scaledMinNorthing;

  if (gridNorthing < 0.) {
    gridNorthing += os.geo.conv.MGRS.TWOMIL;
  }
  gridNorthing += minNorthing;

  return gridNorthing;
};


/**
 * Find the lower letter range index for 2nd mgrs grid letter.
 * @param {number} zone The utm zone.
 * @return {number} Index value of letter.
 * @private
 */
os.geo.conv.MGRS.findLowValueIndex_ = function(zone) {
  var number = zone % 6;
  var lowerRangeIndex = -1;

  if (number == 1 || number == 4) {
    lowerRangeIndex = os.geo.conv.MGRS.LETTER.A;
  } else if (number == 2 || number == 5) {
    lowerRangeIndex = os.geo.conv.MGRS.LETTER.J;
  } else if (number == 3 || number == 0) {
    lowerRangeIndex = os.geo.conv.MGRS.LETTER.S;
  }
  return lowerRangeIndex;
};


/**
 * Determine the second MGRS letter (Useful when converting from utm to mgrs).
 * @param {number} easting The easting value.
 * @param {number} latBandIndex The letter index (int) of latitude band.
 * @param {number} zone The zone.
 * @param {number} lowValueIndex The lower letter range index for 2nd mgrs grid letter.
 * @return {number} The index of the second MGRS letter.
 * @private
 */
os.geo.conv.MGRS.find2ndMGRSLetter_ = function(easting, latBandIndex, zone, lowValueIndex) {
  // Use easting to find 2nd letter of MGRS.
  if (latBandIndex == os.geo.conv.MGRS.LETTER.V && zone == 31 && easting == 500000) {
    easting--;
  }

  var secondMGRSLetterIndex = lowValueIndex + Math.floor(easting / 100000) - 1;
  if (lowValueIndex == os.geo.conv.MGRS.LETTER.J && secondMGRSLetterIndex > os.geo.conv.MGRS.LETTER.N) {
    secondMGRSLetterIndex++;
  }

  return secondMGRSLetterIndex;
};


/**
 * Determine the third mgrs letter (Useful when converting from utm to mgrs).
 * @param {number} northing The northing value.
 * @param {number} falseNorthing The false northing value.
 * @return {number} The index of the third mgrs letter.
 * @private
 */
os.geo.conv.MGRS.find3rdMGRSLetter_ = function(northing, falseNorthing) {
  // Use northing to find 3rd letter of MGRS.
  if (northing == 1e7) {
    northing--;
  }

  while (northing >= os.geo.conv.MGRS.TWOMIL) {
    northing -= os.geo.conv.MGRS.TWOMIL;
  }
  northing -= falseNorthing;

  if (northing < 0.0) {
    northing += os.geo.conv.MGRS.TWOMIL;
  }

  var thirdMGRSLetterIndex = Math.floor(northing / os.geo.conv.MGRS.ONEHT);
  if (thirdMGRSLetterIndex > os.geo.conv.MGRS.LETTER.H) {
    thirdMGRSLetterIndex++;
  }

  if (thirdMGRSLetterIndex > os.geo.conv.MGRS.LETTER.N) {
    thirdMGRSLetterIndex++;
  }

  return thirdMGRSLetterIndex;
};
