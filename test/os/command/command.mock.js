goog.module('os.command.MockCommand');

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const {default: State} = goog.require('os.command.State');


/**
 * Implement a couple of test commands.  MockCommand is a synchronous command.
 * @implements {IDisposable}
 * @constructor
 */
class MockCommand {
  /**
   * Constructor.
   */
  constructor() {
    this.disposed = false;
    this.details = 'Incremented value by 1';
    this.isAsync = false;
    this.title = jasmine.getEnv().currentSpec.description;
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
    MockCommand.value++;
    this.state = State.SUCCESS;
    return true;
  }

  /**
   * @inheritDoc
   */
  revert() {
    MockCommand.value--;
    this.state = State.READY;
    return true;
  }

  /**
   * @inheritDoc
   */
  dispose() {
    this.disposed = true;
  }

  /**
   * @inheritDoc
   */
  isDisposed() {
    return this.disposed;
  }
}

MockCommand.value = 0;

exports = MockCommand;
