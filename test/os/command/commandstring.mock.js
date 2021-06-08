goog.module('os.command.MockCommandString');
goog.module.declareLegacyNamespace();

const MockCommand = goog.require('os.command.MockCommand');

/**
 * Helps test command sets.
 */
class MockCommandString extends MockCommand {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  execute() {
    MockCommandString.str += MockCommandString.source.charAt(MockCommand.value);
    super.execute();
    return true;
  }

  /**
   * @inheritDoc
   */
  revert() {
    super.revert();
    MockCommandString.str = MockCommandString.str.substring(0, MockCommand.value);
    return true;
  }
}

MockCommandString.source = 'abcdefghijklmnop';
MockCommandString.str = '';

exports = MockCommandString;
