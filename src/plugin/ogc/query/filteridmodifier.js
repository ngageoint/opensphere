goog.declareModuleId('plugin.ogc.query.FilterIDModifier');

import ParamModifier from '../../../os/net/parammodifier.js';
import ModifierConstants from '../../../os/ogc/filter/modifierconstants.js';

const googString = goog.require('goog.string');


/**
 * Modifier for adding WFS relation filters to OGC queries.
 */
export default class FilterIDModifier extends ParamModifier {
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
