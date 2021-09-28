goog.declareModuleId('plugin.file.geojson.GeoJSONParserConfig');

import FileParserConfig from '../../os/parse/fileparserconfig.js';
import ImportManager from '../../os/ui/im/importmanager.js';
import * as osUiSlickColumn from '../../os/ui/slick/column.js';


/**
 * Configuration for a GeoJSON parser.
 * @unrestricted
 */
export default class GeoJSONParserConfig extends FileParserConfig {
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
    var parser = /** @type {plugin.file.geojson.GeoJSONParser} */ (im.getParser('geojson'));
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
