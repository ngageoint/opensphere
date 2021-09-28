goog.declareModuleId('plugin.file.csv.CSVParserConfig');

import * as osUiSlickColumn from '../../../os/ui/slick/column.js';
import CSVParser from './csvparser.js';

const CsvParserConfig = goog.require('os.parse.csv.CsvParserConfig');

const Feature = goog.requireType('ol.Feature');


/**
 * Configuration for a CSV parser.
 * @extends {CsvParserConfig<Feature>}
 * @unrestricted
 */
export default class CSVParserConfig extends CsvParserConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  updatePreview(opt_mappings) {
    var parser = new CSVParser(this);
    var features = parser.parsePreview(this['file'].getContent(), opt_mappings);

    this['preview'] = features || [];
    this['columns'] = parser.getColumns() || [];

    for (var i = 0, n = this['columns'].length; i < n; i++) {
      var column = this['columns'][i];
      column['width'] = 0;
      osUiSlickColumn.autoSizeColumn(column);
    }

    parser.dispose();
  }
}
