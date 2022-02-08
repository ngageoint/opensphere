goog.declareModuleId('os.command.FeaturesVisibility');

import AbstractSource from './abstractsourcecmd.js';
import State from './state.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * @implements {ICommand}
 */
export default class FeaturesVisibility extends AbstractSource {
  /**
   * Constructor.
   * @param {!string} sourceId
   * @param {Array<Feature>} features
   * @param {boolean} visibility
   */
  constructor(sourceId, features, visibility) {
    super(sourceId);

    /**
     * @type {Array<Feature>}
     * @protected
     */
    this.features = features;

    var source = this.getSource();
    if (source && this.features) {
      this.title = (visibility ? 'Show ' : 'Hide ') + features.length + ' feature' +
          (features.length === 1 ? '' : 's') + ' on "' + source.getTitle() + '"';
    }

    /**
     * @type {boolean}
     * @protected
     */
    this.visible = visibility;
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      var source = this.getSource();
      if (source && this.features) {
        if (this.visible) {
          source.showFeatures(this.features);
        } else {
          source.hideFeatures(this.features);
        }

        this.state = State.SUCCESS;
        return true;
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    var source = this.getSource();
    if (source && this.features) {
      if (!this.visible) {
        source.showFeatures(this.features);
      } else {
        source.hideFeatures(this.features);
      }

      this.state = State.READY;
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  canExecute() {
    if (!super.canExecute()) {
      return false;
    }

    if (!this.features) {
      this.state = State.ERROR;
      this.details = 'Features not provided';
      return false;
    }

    return true;
  }
}
