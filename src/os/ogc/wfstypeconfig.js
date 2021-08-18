goog.module('os.ogc.WFSTypeConfig');
goog.module.declareLegacyNamespace();

/**
 * Typedef describing available WFS format types (GML, GeoJSON, etc.)
 * @typedef {{
 *   type: !string,
 *   regex: !RegExp,
 *   parser: !string,
 *   priority: !number,
 *   responseType: (string|undefined)
 * }}
 */
let WFSTypeConfig;

exports = WFSTypeConfig;
