goog.module('os.command.AsyncMockCommand');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const MockCommand = goog.require('os.command.MockCommand');
const State = goog.require('os.command.State');

/**
 * Mock async command.
 */
class AsyncMockCommand extends EventTarget {
  /**
   * Constructor.
   * @param {boolean=} opt_manual If onExecute/onRevert will be manually called.
   */
  constructor(opt_manual = false) {
    super();

    this.isAsync = true;
    this.title = 'Test Async Command';
    this.details = 'Async Incremented value by 1';
    this.state = State.READY;
    this.manual = opt_manual;
  }

  /**
   * @inheritDoc
   */
  getState() {
    return this.state;
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;

    if (!this.manual) {
      // Defer execute until after this function returns.
      setTimeout(() => {
        this.onExecute();
      });
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  onExecute() {
    MockCommand.value++;
    this.state = State.SUCCESS;
    this.dispatchEvent(new GoogEvent('executed'));
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    if (!this.manual) {
      // Defer revert until after this function returns.
      setTimeout(() => {
        this.onRevert();
      });
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  onRevert() {
    MockCommand.value--;
    this.state = State.READY;
    this.dispatchEvent(new GoogEvent('reverted'));
  }
}

exports = AsyncMockCommand;
