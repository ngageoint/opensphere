goog.provide('plugin.file.shp');


/**
 * @enum {number}
 * @const
 */
plugin.file.shp.TYPE = {
  NULLRECORD: 0,
  POINT: 1,
  POLYLINE: 3,
  POLYGON: 5,
  MULTIPOINT: 8,
  POINTZ: 11,
  POLYLINEZ: 13,
  POLYGONZ: 15,
  MULTIPOINTZ: 18,
  POINTM: 21,
  POLYLINEM: 23,
  POLYGONM: 25,
  MULTIPOINTM: 28
};


/**
 * @typedef {{
 *   data: DataView,
 *   numRecords: number
 * }}
 */
plugin.file.shp.DBFData;


/**
 * Tests if the supplied content is for a DBF file.
 * @param {ArrayBuffer} content
 * @return {boolean}
 */
plugin.file.shp.isDBFFileType = function(content) {
  if (!content) {
    return false;
  }

  if (content.byteLength < 4) {
    return false;
  }
  var dv = new DataView(content.slice(0, 4));
  var type = dv.getUint32(0);

  // dBASE Header bytes:
  // 0: 3 indicates dBASE version 5, 4 indicates dBASE version 7
  // 1-3: YYMMDD, with YY representing number of years since 1900
  var date = type & 0xFF;
  var month = (type >> 8) & 0xFF;
  var version = (type >> 24) & 0xFF;
  return version == 3 && (date >= 1 && date <= 31) && (month >= 1 && month <= 12);
};


/**
 * Tests if the supplied content is for a SHP file.
 * @param {ArrayBuffer} content
 * @return {boolean}
 */
plugin.file.shp.isSHPFileType = function(content) {
  var dv = new DataView(content.slice(0, 4));
  try {
    return dv.getUint32(0) == 9994;
  } catch (e) {
    return false;
  }
};
