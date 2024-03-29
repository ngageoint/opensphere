goog.declareModuleId('os.geo.conv.UTM');

const {toDegrees, toRadians} = goog.require('goog.math');
const Coordinate = goog.require('goog.math.Coordinate');


/**
 */
export default class UTM {
  /**
   * Constructor.
   * @param {number} z
   * @param {string} h
   * @param {number} e
   * @param {number} n
   */
  constructor(z, h, e, n) {
    /**
     * @type {number}
     */
    this.zone = z;

    /**
     * @type {string}
     */
    this.hemisphere = h;

    /**
     * @type {number}
     */
    this.easting = e;

    /**
     * @type {number}
     */
    this.northing = n;
  }

  /**
   * @param {number} a Semi-major axis of ellipsoid in meters
   * @param {number} f Flattening of ellipsoid
   */
  setParameters(a, f) {
    this.utmA = a;
    this.utmF = f;

    var invF = 1 / f;
    if (a <= 0.0) {
      throw new Error('Error: Semi-major axis must be greater than zero.');
    }
    if (invF < 250 || invF > 350) {
      throw new Error('Error: Inverse flattening must be between 250 and 350');
    }
  }

  /**
   * @inheritDoc
   */
  toString() {
    return 'UTM{zone: ' + this.zone + ' hemisphere: ' + this.hemisphere + ' easting: ' + this.easting + ' northing: ' +
        this.northing + ' a: ' + this.utmA + ' f: ' + this.utmF + '}';
  }

  /**
   * Converts a UTM coordinate to longitude/latitude.
   *
   * @return {Coordinate}
   */
  convertToLonLat() {
    var latitude = 0.0;
    var longitude = 0.0;

    if (this.hemisphere == 'S') {
      this.northing = 10000000 - this.northing;
    }

    // The following is the example from IBM http://www.ibm.com/developerworks/java/library/j-coordconvert
    var arc = this.northing / UTM.SCALE;
    var mu = arc / (UTM.SEMI_MAJOR * (1 - Math.pow(UTM.E, 2) / 4.0 - 3 *
          Math.pow(UTM.E, 4) / 64.0 - 5 * Math.pow(UTM.E, 6) / 256.0));

    var ei = (1 - Math.pow((1 - UTM.E * UTM.E), (1 / 2.0))) / (1 +
        Math.pow((1 - UTM.E * UTM.E), (1 / 2.0)));

    var ca = 3 * ei / 2 - 27 * Math.pow(ei, 3) / 32.0;

    var cb = 21 * Math.pow(ei, 2) / 16 - 55 * Math.pow(ei, 4) / 32;
    var cc = 151 * Math.pow(ei, 3) / 96;
    var cd = 1097 * Math.pow(ei, 4) / 512;
    var phi1 = mu + ca * Math.sin(2 * mu) + cb * Math.sin(4 * mu) + cc * Math.sin(6 * mu) + cd * Math.sin(8 * mu);

    var n0 = UTM.SEMI_MAJOR / Math.pow((1 - Math.pow((UTM.E * Math.sin(phi1)), 2)), (1 / 2.0));

    var r0 = UTM.SEMI_MAJOR * (1 - UTM.E * UTM.E) /
        Math.pow((1 - Math.pow((UTM.E * Math.sin(phi1)), 2)), (3 / 2.0));
    var fact1 = n0 * Math.tan(phi1) / r0;

    var _a1 = 500000 - this.easting;
    var dd0 = _a1 / (n0 * UTM.SCALE);
    var fact2 = dd0 * dd0 / 2;

    var t0 = Math.pow(Math.tan(phi1), 2);
    var Q0 = UTM.E1SQ * Math.pow(Math.cos(phi1), 2);
    var fact3 = (5 + 3 * t0 + 10 * Q0 - 4 * Q0 * Q0 - 9 * UTM.E1SQ) * Math.pow(dd0, 4) / 24;

    var fact4 = (61 + 90 * t0 + 298 * Q0 + 45 * t0 * t0 - 252 * UTM.E1SQ - 3 * Q0 * Q0) *
        Math.pow(dd0, 6) / 720;

    var lof1 = _a1 / (n0 * UTM.SCALE);
    var lof2 = (1 + 2 * t0 + Q0) * Math.pow(dd0, 3) / 6.0;
    var lof3 = (5 - 2 * Q0 + 28 * t0 - 3 * Math.pow(Q0, 2) + 8 * UTM.E1SQ + 24 * Math.pow(t0, 2)) *
        Math.pow(dd0, 5) / 120;
    var _a2 = (lof1 - lof2 + lof3) / Math.cos(phi1);
    var _a3 = toDegrees(_a2);


    latitude = toDegrees(phi1 - fact1 * (fact2 + fact3 + fact4));
    var zoneCentralMeridian = 0;
    if (this.zone > 0) {
      zoneCentralMeridian = 6 * this.zone - 183.0;
    } else {
      zoneCentralMeridian = 3.0;
    }

    longitude = zoneCentralMeridian - _a3;
    if (this.hemisphere == 'S') {
      latitude = -latitude;
    }

    return new Coordinate(longitude, latitude);
  }

  /**
   * Converts lon/lat coordinates to UTM.
   *
   * @param {number} longitude
   * @param {number} latitude
   * @return {UTM}
   */
  static convertFromLonLat(longitude, latitude) {
    // Make sure the longitude is in the -180 to 180 range.
    if (longitude >= 180.) {
      longitude -= Math.floor((longitude + 180.) / 360.) * 360.;
    } else if (longitude < -180.) {
      longitude += Math.floor((longitude - 180.) / 360.) * 360.;
    }

    // First find the zone number.
    var zone = UTM.findZone(longitude, latitude);

    var zoneHalfWidth = 3.;
    var originLongitude = (zone - 1) * 6 - 180. + zoneHalfWidth;

    var latR = toRadians(latitude);
    var sinLatR = Math.sin(latR);
    var cosLatR = Math.cos(latR);
    var tanLatR = sinLatR / cosLatR;
    var lonR = toRadians(longitude);

    var n = UTM.SEMI_MAJOR / Math.sqrt(1 - UTM.E1SQ * sinLatR * sinLatR);
    var t = tanLatR * tanLatR;
    var c = UTM.E1PRIMESQ * cosLatR * cosLatR;
    var a = cosLatR * (lonR - toRadians(originLongitude));
    var a2 = a * a;
    var a4 = a2 * a2;

    var m = UTM.SEMI_MAJOR *
        ((1 - UTM.E1SQ / 4 - 3 * UTM.E1POW4 / 64 - 5 * UTM.E1POW6 / 256) *
        latR - (3 * UTM.E1SQ / 8 + 3 * UTM.E1POW4 / 32 + 45 * UTM.E1POW6 / 1024) *
        Math.sin(2 * latR) + (15 * UTM.E1POW4 / 256 + 45 * UTM.E1POW6 / 1024) *
        Math.sin(4 * latR) - (35 * UTM.E1POW6 / 3072) * Math.sin(6 * latR));

    var easting = UTM.SCALE * n * (a + (1 - t + c) * a2 * a / 6 + (5 - 18 * t + t * t + 72 * c - 58 *
        UTM.E1PRIMESQ) * a4 * a / 120) + 500000;

    var northing = UTM.SCALE * (m + n * tanLatR * (a2 / 2 + (5 - t + 9 * c + 4 * c * c) * a2 * a2 / 24 +
        (61 - 58 * t + t * t + 600 * c - 330 * UTM.E1PRIMESQ) * a4 * a2 / 720));

    // Check for northing offset in southern hemisphere. And set hemisphere.
    var hemisphere = undefined;
    if (latitude < 0.) {
      northing += UTM.MAX_NORTHING;
      hemisphere = 'S';
    } else {
      hemisphere = 'N';
    }

    return new UTM(zone, hemisphere, easting, northing);
  }

  /**
   * Determines the zone from the longitude (accounts for special cases).
   * This assumes that the latitude is in [-90, 90] and the longitude is in [-180, 180).
   *
   * @param {number} longitude The longitude (degrees).
   * @param {number} latitude The latitude (degrees).
   * @return {number} The zone.
   */
  static findZone(longitude, latitude) {
    var zone = Math.floor((longitude + 180) / 6) + 1;

    // There are special cases that we need to check for.
    // Norway
    if (latitude >= 56 && latitude < 64) {
      if (longitude >= 3 && longitude < 12) {
        zone = 32;
      }
    // X band in artic circle
    } else if (latitude >= 72 && latitude < 84) {
      if (longitude >= 0 && longitude < 9) {
        zone = 31;
      } else if (longitude >= 9 && longitude < 21) {
        zone = 33;
      } else if (longitude >= 21 && longitude < 33) {
        zone = 35;
      } else if (longitude >= 33 && longitude < 42) {
        zone = 37;
      }
    }

    return zone;
  }
}

/**
 * @type {number}
 * @const
 */
UTM.MIN_LAT = toRadians(-80.5);

/**
 * @type {number}
 * @const
 */
UTM.MAX_LAT = toRadians(84.5);

/**
 * Semi-Major axis of UTM ellipsoid
 * @type {number}
 * @const
 */
UTM.SEMI_MAJOR = 6378137;

/**
 * Semi-Minor axis of UTM ellipsoid
 * @type {number}
 * @const
 */
UTM.SEMI_MINOR = 6356752.314;

/**
 * (First Eccentricty)^2
 * @type {number}
 * @const
 */
UTM.E1SQ = (UTM.SEMI_MAJOR * UTM.SEMI_MAJOR -
    UTM.SEMI_MINOR * UTM.SEMI_MINOR) /
    UTM.SEMI_MAJOR / UTM.SEMI_MAJOR;

/**
 * Eccentricity
 * @type {number}
 * @const
 */
UTM.E = Math.sqrt(UTM.E1SQ);

/**
 * (First Eccentricty)^4
 * @type {number}
 * @const
 */
UTM.E1POW4 = UTM.E1SQ * UTM.E1SQ;

/**
 * (First Eccentricty)^6
 * @type {number}
 * @const
 */
UTM.E1POW6 = UTM.E1POW4 * UTM.E1SQ;

/**
 * Scale factor
 * @type {number}
 * @const
 */
UTM.SCALE = 0.9996;

/**
 * Eccentricity prime squared.
 * @type {number}
 * @const
 */
UTM.E1PRIMESQ = UTM.E1SQ / (1 - UTM.E1SQ);

/**
 * @type {number}
 * @const
 */
UTM.MIN_EASTING = 100000;

/**
 * @type {number}
 * @const
 */
UTM.MAX_EASTING = 900000;

/**
 * @type {number}
 * @const
 */
UTM.MIN_NORTHING = 0;

/**
 * @type {number}
 * @const
 */
UTM.MAX_NORTHING = 10000000;

/**
 * Semi-major axis of ellipsoid in meters
 * @type {number}
 */
UTM.prototype.utmA = 6378137.0;

/**
 * Flattening of ellipsoid
 * @type {number}
 */
UTM.prototype.utmF = 1 / 298.257223563;
