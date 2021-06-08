goog.module('os.command.ExclusionQueryClear');
goog.module.declareLegacyNamespace();

const QueryClear = goog.require('os.command.QueryClear');


/**
 * Command to add a exclusion query to the map.
 */
class ExclusionQueryClear extends QueryClear {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.value = false;

    /**
     * @inheritDoc
     */
    this.title = 'Clear exclusion areas';
  }
}

exports = ExclusionQueryClear;
