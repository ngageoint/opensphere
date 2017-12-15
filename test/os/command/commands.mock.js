goog.provide('os.command.AsyncMockCommand');
goog.provide('os.command.AsyncMockCommandString');
goog.provide('os.command.MockCommand');
goog.provide('os.command.MockCommandString');

goog.require('os.command.State');
goog.require('goog.disposable.IDisposable');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');



/**
 * Implement a couple of test commands.  MockCommand is a synchronous command.
 * @implements {goog.disposable.IDisposable}
 * @constructor
 */
os.command.MockCommand = function() {
  this.title = jasmine.getEnv().currentSpec.description;
  this.disposed = false;
};

os.command.MockCommand.value = 0;

os.command.MockCommand.prototype.state = os.command.State.READY;

os.command.MockCommand.prototype.getState = function() {
  return this.state;
};

os.command.MockCommand.prototype.execute = function() {
  os.command.MockCommand.value++;
  this.state = os.command.State.SUCCESS;
  return true;
};

os.command.MockCommand.prototype.revert = function() {
  os.command.MockCommand.value--;
  this.state = os.command.State.READY;
  return true;
};

os.command.MockCommand.prototype.dispose = function() {
  this.disposed = true;
};

os.command.MockCommand.prototype.isDisposed = function() {
  return this.disposed;
};

os.command.MockCommand.prototype.isAsync = false;
os.command.MockCommand.prototype.title = 'Test Command';
os.command.MockCommand.prototype.details = 'Incremented value by 1';

// AsyncMockCommand is an asynchronous command
os.command.AsyncMockCommand = function() {
  goog.base(this);
};
goog.inherits(os.command.AsyncMockCommand, goog.events.EventTarget);

os.command.AsyncMockCommand.prototype.state = os.command.State.READY;

os.command.AsyncMockCommand.prototype.getState = function() {
  return this.state;
};

os.command.AsyncMockCommand.prototype.execute = function() {
  var me = this;

  me.state = os.command.State.EXECUTING;
  setTimeout(function() {
    me.onExecute();
  }, 100);

  return true;
};

os.command.AsyncMockCommand.prototype.onExecute = function() {
  os.command.MockCommand.value++;
  this.state = os.command.State.SUCCESS;
  this.dispatchEvent(new goog.events.Event('executed'));
};

os.command.AsyncMockCommand.prototype.revert = function() {
  var me = this;

  me.state = os.command.State.REVERTING;
  setTimeout(function() {
    me.onRevert();
  }, 100);

  return true;
};

os.command.AsyncMockCommand.prototype.onRevert = function() {
  os.command.MockCommand.value--;
  this.state = os.command.State.READY;
  this.dispatchEvent(new goog.events.Event('reverted'));
};

os.command.AsyncMockCommand.prototype.isAsync = true;
os.command.AsyncMockCommand.prototype.title = 'Test Async Command';
os.command.AsyncMockCommand.prototype.details = 'Async Incremented value by 1';

// MockCommandString helps test command sets
os.command.MockCommandString = function() {
  goog.base(this);
};
goog.inherits(os.command.MockCommandString, os.command.MockCommand);

os.command.MockCommandString.source = 'abcdefghijklmnop';
os.command.MockCommandString.str = '';

os.command.MockCommandString.prototype.execute = function() {
  os.command.MockCommandString.str += os.command.MockCommandString.source.charAt(os.command.MockCommand.value);
  os.command.MockCommandString.superClass_.execute.call(this);
  return true;
};

os.command.MockCommandString.prototype.revert = function() {
  os.command.MockCommandString.superClass_.revert.call(this);
  os.command.MockCommandString.str = os.command.MockCommandString.str.substring(0, os.command.MockCommand.value);
  return true;
};

// here's the Async version of that
os.command.AsyncMockCommandString = function() {
  goog.base(this);
};
goog.inherits(os.command.AsyncMockCommandString, os.command.AsyncMockCommand);

os.command.AsyncMockCommandString.prototype.onExecute = function() {
  os.command.MockCommandString.str += os.command.MockCommandString.source.charAt(os.command.MockCommand.value);
  os.command.MockCommand.value++;
  this.state = os.command.State.SUCCESS;
  this.dispatchEvent(new goog.events.Event('executed'));
};

os.command.AsyncMockCommandString.prototype.onRevert = function() {
  os.command.MockCommand.value--;
  os.command.MockCommandString.str = os.command.MockCommandString.str.substring(0, os.command.MockCommand.value);
  this.state = os.command.State.READY;
  this.dispatchEvent(new goog.events.Event('reverted'));
};
