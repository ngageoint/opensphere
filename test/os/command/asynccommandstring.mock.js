goog.module('os.command.AsyncMockCommandString');

const GoogEvent = goog.require('goog.events.Event');
const AsyncMockCommand = goog.require('os.command.AsyncMockCommand');
const MockCommand = goog.require('os.command.MockCommand');
const MockCommandString = goog.require('os.command.MockCommandString');
const {default: State} = goog.require('os.command.State');


/**
 * Helps test command sets.
 */
class AsyncMockCommandString extends AsyncMockCommand {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  onExecute() {
    MockCommandString.str += MockCommandString.source.charAt(MockCommand.value);
    MockCommand.value++;
    this.state = State.SUCCESS;
    this.dispatchEvent(new GoogEvent('executed'));
  }

  /**
   * @inheritDoc
   */
  onRevert() {
    MockCommand.value--;
    MockCommandString.str = MockCommandString.str.substring(0, MockCommand.value);
    this.state = State.READY;
    this.dispatchEvent(new GoogEvent('reverted'));
  }
}

exports = AsyncMockCommandString;
