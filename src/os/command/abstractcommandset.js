goog.module('os.command.AbstractCommandSet');
goog.module.declareLegacyNamespace();

const EventTarget = goog.require('goog.events.EventTarget');
const osArray = goog.require('os.array');
const State = goog.require('os.command.State');

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const ICommand = goog.requireType('os.command.ICommand');


/**
 * Abstract class that contains a set of commands. Note that nested command
 * sets should always have their command set added before adding that set
 * to its parent set (this ensures that isAsync gets set properly).
 *
 * @implements {IDisposable}
 */
class AbstractCommandSet extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The set of commands
     * @type {Array<ICommand>}
     * @private
     */
    this.cmds_ = null;

    /**
     * The title
     * @type {?string}
     */
    this.title = null;

    /**
     * The current state of the command
     * @type {!State}
     */
    this.state = State.READY;

    /**
     * Whether or not this is an asyncronous command; true if any sub-command isAsync
     * @type {boolean}
     */
    this.isAsync = false;

    /**
     * The details
     * @type {?string}
     */
    this.details = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    goog.disposeAll(this.getCommands());
    super.disposeInternal();
  }

  /**
   * Gets the set of commands
   *
   * @return {Array<ICommand>} The set of commands
   */
  getCommands() {
    return this.cmds_;
  }

  /**
   * Sets the set of commands
   *
   * @param {Array<ICommand>} set The set of commands
   */
  setCommands(set) {
    this.cmds_ = set;

    if (set) {
      this.isAsync = false;

      // see if any of the commands are asynchronous
      /** @type {number} */ var i;
      /** @type {number} */ var n;
      for (i = 0, n = set.length; i < n; i++) {
        if (set[i].isAsync) {
          this.isAsync = true;
        }
      }

      if (!this.title) {
        /** @type {Array<string>} */ var titles = [];
        osArray.forEach(set, function(ele, idx, arr) {
          var command = /** @type {ICommand} */ (ele);
          if (command.title) {
            titles.push(command.title);
          }
        });
        this.title = '[ ' + titles.join(', ') + ' ]';
      }
    }
  }
}

exports = AbstractCommandSet;
