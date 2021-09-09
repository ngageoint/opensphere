goog.module('os.command.AbstractSource');

const State = goog.require('os.command.State');
const DataManager = goog.require('os.data.DataManager');

const ICommand = goog.requireType('os.command.ICommand');
const ISource = goog.requireType('os.source.ISource');


/**
 * Abstract command for interaction with sources
 *
 * @abstract
 * @implements {ICommand}
 */
class AbstractSource {
  /**
   * Constructor.
   * @param {!string} sourceId
   */
  constructor(sourceId) {
    /**
     * @inheritDoc
     */
    this.isAsync = false;

    /**
     * @inheritDoc
     */
    this.title = 'Source';

    /**
     * @inheritDoc
     */
    this.details = null;

    /**
     * @type {!string}
     * @protected
     */
    this.sourceId = sourceId;

    /**
     * @type {!State}
     */
    this.state = State.READY;
  }

  /**
   * @return {?ISource} The source
   */
  getSource() {
    return DataManager.getInstance().getSource(this.sourceId);
  }

  /**
   * Checks if the command is ready to execute.
   *
   * @return {boolean}
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state.';
      return false;
    }

    var source = this.getSource();
    if (!source) {
      this.state = State.ERROR;
      this.details = 'Data source "' + this.sourceId + '" does not exist';
      return false;
    }

    return true;
  }
}

exports = AbstractSource;
