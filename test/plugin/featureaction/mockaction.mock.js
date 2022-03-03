goog.module('plugin.im.action.feature.mock.MockAction');

const {default: AbstractImportAction} = goog.require('os.im.action.AbstractImportAction');


/**
 * Mock action that sets the field 'MATCH' to true on each object.
 * @extends {AbstractImportAction<Feature>}
 */
class MockAction extends AbstractImportAction {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
    this.label = 'Mock Feature Action';
    this.configUI = 'mockfeatureactionconfig'; // doesn't exist
    this.xmlType = 'mockFeatureAction';
  }

  /**
   * Execute the mock action.
   * @param {!Array<!Feature>} items The items.
   */
  execute(items) {
    items.forEach(function(item) {
      item.set('MATCH', true);
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

  /**
   * @inheritDoc
   */
  toXml() {
    return super.toXml();
  }

  /**
   * @inheritDoc
   */
  fromXml(xml) {
    // nothing to do
  }
}


/**
 * Mock action identifier.
 * @type {string}
 */
const ID = 'mockfeatureaction';


exports = MockAction;
