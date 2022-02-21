goog.declareModuleId('plugin.file.shp.SHPParserConfig');

import EventType from '../../../os/events/eventtype.js';
import FileParserConfig from '../../../os/parse/fileparserconfig.js';
import * as osUiSlickColumn from '../../../os/ui/slick/column.js';
import SHPParser from './shpparser.js';

const googEvents = goog.require('goog.events');


/**
 * Configuration for a SHP parser.
 * @unrestricted
 */
export default class SHPParserConfig extends FileParserConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {OSFile}
     */
    this['file2'] = null;

    /**
     * @type {OSFile}
     */
    this['zipFile'] = null;

    /**
     * @type {number}
     */
    this['lineAlpha'] = SHPParserConfig.DEFAULT_LINE_ALPHA;

    /**
     * @type {number}
     */
    this['fillAlpha'] = SHPParserConfig.DEFAULT_FILL_ALPHA;

    /**
     * @type {number}
     */
    this['append'] = SHPParserConfig.DEFAULT_APPEND;
  }

  /**
   * @param {Function} callback
   */
  updateZipPreview(callback) {
    this['columns'] = [];
    this['preview'] = [];
    var parser = new SHPParser(this);
    parser.setSource(this['zipFile'].getContent());

    googEvents.listen(parser, EventType.COMPLETE, function() {
      this['preview'] = parser.parsePreview();
      this['columns'] = parser.getColumns() || [];

      for (var i = 0, n = this['columns'].length; i < n; i++) {
        var column = this['columns'][i];
        column['width'] = 0;
        osUiSlickColumn.autoSizeColumn(column);
      }

      callback();

      parser.dispose();
    }.bind(this), false, this);
  }

  /**
   * @inheritDoc
   */
  updatePreview(opt_mappings) {
    this['columns'] = [];
    this['preview'] = [];

    if (this['file'] || this['file2']) {
      var source = [];
      if (this['file']) {
        source.push(this['file'].getContent());
      }
      if (this['file2']) {
        source.push(this['file2'].getContent());
      }

      var parser = new SHPParser(this);
      parser.setSource(source);

      this['preview'] = parser.parsePreview();
      this['columns'] = parser.getColumns() || [];

      for (var i = 0, n = this['columns'].length; i < n; i++) {
        var column = this['columns'][i];
        column['width'] = 0;
        osUiSlickColumn.autoSizeColumn(column);
      }

      parser.dispose();
    }
  }
}


/**
 * @type {number}
 * @const
 */
SHPParserConfig.DEFAULT_LINE_ALPHA = 1;


/**
 * @type {number}
 * @const
 */
SHPParserConfig.DEFAULT_FILL_ALPHA = 0.5;


/**
 * @type {boolean}
 * @const
 */
SHPParserConfig.DEFAULT_APPEND = true;
