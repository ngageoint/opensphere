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
   */
  constructor() {
    super();

    this.isAsync = true;
    this.title = 'Test Async Command';
    this.details = 'Async Incremented value by 1';
    this.state = State.READY;
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

    setTimeout(() => {
      this.onExecute();
    }, 1000);

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

    setTimeout(() => {
      this.onRevert();
    }, 1000);

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
