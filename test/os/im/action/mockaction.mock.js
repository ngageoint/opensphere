goog.module('os.im.action.mock.MockAction');
goog.module.declareLegacyNamespace();

const AbstractImportAction = goog.require('os.im.action.AbstractImportAction');


/**
 * Mock action that sets the field 'MATCH' to true on each object.
 * @extends {AbstractImportAction<Object>}
 */
class MockAction extends AbstractImportAction {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = MockAction.ID;
    this.label = 'Mock Action';
    this.configUI = 'mockactionconfig'; // doesn't exist
  }

  /**
   * Execute the mock action.
   * @param {!Array<!Object>} items The items.
   */
  execute(items) {
    items.forEach(function(item) {
      item.MATCH = true;
    });
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    return super.persist(opt_to);
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    // nothing to do
  }
}

/**
 * Mock action identifier.
 * @type {string}
 */
MockAction.ID = 'mockaction';

exports = MockAction;
