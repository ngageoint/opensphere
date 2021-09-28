goog.declareModuleId('plugin.file.gml.GMLParserConfig');

import ImportManager from '../../../os/ui/im/importmanager.js';
import * as osUiSlickColumn from '../../../os/ui/slick/column.js';

const FileParserConfig = goog.require('os.parse.FileParserConfig');


/**
 * Configuration for a GML parser.
 * @unrestricted
 */
export default class GMLParserConfig extends FileParserConfig {
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
    var im = ImportManager.getInstance();
    var parser = /** @type {plugin.file.gml.GMLParser} */ (im.getParser('gml'));
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
