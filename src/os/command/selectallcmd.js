goog.declareModuleId('os.command.SelectAll');

import AbstractSelect from './abstractselectcmd.js';


/**
 * Command for selecting all features in a source
 */
export default class SelectAll extends AbstractSelect {
  /**
   * Constructor.
   * @param {!string} sourceId
   */
  constructor(sourceId) {
    super(sourceId);

    var source = this.getSource();
    if (source) {
      this.title = 'Select all features on "' + source.getTitle() + '"';
    }

    /**
     * @type {?Array<!ol.Feature>}
     * @protected
     */
    this.previous = null;
  }

  /**
   * @inheritDoc
   */
  select() {
    var source = this.getSource();
    if (source) {
      source.selectAll();
    }
  }
}
