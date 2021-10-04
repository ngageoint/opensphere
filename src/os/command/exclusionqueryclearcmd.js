goog.declareModuleId('os.command.ExclusionQueryClear');

import QueryClear from './queryclearcmd.js';


/**
 * Command to add a exclusion query to the map.
 */
export default class ExclusionQueryClear extends QueryClear {
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
