goog.module('os.command.SelectNone');
goog.module.declareLegacyNamespace();

const AbstractSelect = goog.require('os.command.AbstractSelect');


/**
 * Command for selecting all features in a source
 */
class SelectNone extends AbstractSelect {
  /**
   * Constructor.
   * @param {!string} sourceId
   */
  constructor(sourceId) {
    super(sourceId);

    var source = this.getSource();
    if (source) {
      this.title = 'Deselect all features on "' + source.getTitle() + '"';
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
      source.selectNone();
    }
  }
}

exports = SelectNone;
