goog.declareModuleId('plugin.georss.GeoRSSImportUI');

import FileParserConfig from 'opensphere/src/os/parse/fileparserconfig.js';
import FileImportUI from 'opensphere/src/os/ui/im/fileimportui.js';


/**
 * GeoRSS import UI.
 */
export default class GeoRSSImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'GeoRSS';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    const config = new FileParserConfig();

    // if an existing config was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    config['file'] = file;
    config['title'] = file.getFileName();

    // our config is all set up but we have no UI to launch yet!
  }
}
