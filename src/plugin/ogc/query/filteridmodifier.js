goog.module('plugin.ogc.query.FilterIDModifier');
goog.module.declareLegacyNamespace();

const googString = goog.require('goog.string');
const ParamModifier = goog.require('os.net.ParamModifier');
const ModifierConstants = goog.require('os.ogc.filter.ModifierConstants');


/**
 * Modifier for adding WFS relation filters to OGC queries.
 */
class FilterIDModifier extends ParamModifier {
  /**
   * Constructor.
   * @param {Object} columnValueMap
   */
  constructor(columnValueMap) {
    var replacement = '<Or>';
    var columns = [];
    var valueLength = 0;
    for (var columnId in columnValueMap) {
      columns.push(columnId);
      valueLength = columnValueMap[columnId].length;
    }

    // for all of the values, pair all of the column values together in an AND wrapped in one big OR
    for (var y = 0; y < valueLength; y++) {
      var filterValue = '<And>';
      for (var x = 0; x < columns.length; x++) {
        var propEquals = '<PropertyIsEqualTo><PropertyName>' + columns[x] + '</PropertyName><Literal>{{' + columns[x] +
            '}}</Literal></PropertyIsEqualTo>';
        filterValue = googString.buildString(filterValue, propEquals.replace('{{' + columns[x] + '}}',
            columnValueMap[columns[x]][y]));
      }
      filterValue += '</And>';

      if (replacement.indexOf(filterValue) < 0) { // no dupes
        replacement += filterValue;
      }
    }

    replacement += '</Or>';

    super('relateLayer', 'filter', ModifierConstants.IDENTIFIERS, replacement);
  }
}

exports = FilterIDModifier;
