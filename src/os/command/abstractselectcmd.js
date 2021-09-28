goog.declareModuleId('os.command.AbstractSelect');

import AbstractSource from './abstractsourcecmd.js';
import State from './state.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Abstract command for performing selections on a source
 *
 * @abstract
 * @implements {ICommand}
 */
export default class AbstractSelect extends AbstractSource {
  /**
   * Constructor.
   * @param {!string} sourceId
   */
  constructor(sourceId) {
    super(sourceId);

    /**
     * @type {?Array<number|string|undefined>}
     * @protected
     */
    this.previous = null;
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      var source = this.getSource();
      this.previous = source.getSelectedItems().map(
          /**
           * @param {ol.Feature} feature
           * @return {number|string|undefined}
           */
          function(feature) {
            return feature.getId();
          });


      this.select();
      this.state = State.SUCCESS;
      return true;
    }

    return false;
  }

  /**
   * Does the selection.
   */
  select() {}

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    var source = this.getSource();

    if (source) {
      if (this.previous) {
        var src = /** @type {ol.source.Vector} */ (source);
        var s = this.previous.map(
            /**
             * @param {number|string|undefined} id
             * @return {ol.Feature}
             */
            function(id) {
              return src.getFeatureById(id || 0);
            });

        source.setSelectedItems(s);
      } else {
        source.selectNone();
      }
    }

    this.state = State.READY;
    return true;
  }
}
