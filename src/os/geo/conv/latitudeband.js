goog.module('os.geo.conv.LatitudeBand');
goog.module.declareLegacyNamespace();


/**
 */
class LatitudeBand {
  /**
   * Constructor.
   * @param {number} l Letter representing latitude band
   * @param {number} mn Minimum northing for latitude band
   * @param {number} n Upper latitude for latitude band
   * @param {number} s Lower latitude for latitude band
   * @param {number} no Latitude band northing offset
   */
  constructor(l, mn, n, s, no) {
    this.letter = l;
    this.minNorthing = mn;
    this.north = n;
    this.south = s;
    this.northingOffset = no;
  }
}

exports = LatitudeBand;
