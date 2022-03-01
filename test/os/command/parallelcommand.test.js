goog.require('os.array');
goog.require('os.command.AsyncMockCommand');
goog.require('os.command.AsyncMockCommandString');
goog.require('os.command.EventType');
goog.require('os.command.MockCommand');
goog.require('os.command.MockCommandString');
goog.require('os.command.ParallelCommand');
goog.require('os.command.State');

describe('os.command.ParallelCommand', function() {
  const {default: ParallelCommand} = goog.module.get('os.command.ParallelCommand');
  const {default: State} = goog.module.get('os.command.State');

  const AsyncMockCommandString = goog.module.get('os.command.AsyncMockCommandString');
  const MockCommand = goog.module.get('os.command.MockCommand');
  const MockCommandString = goog.module.get('os.command.MockCommandString');

  var cmd = new ParallelCommand();

  it('should execute synchronous commands in parallel', function() {
    MockCommand.value = 0;
    MockCommandString.str = '';
    cmd.setCommands([
      new MockCommandString(),
      new MockCommandString(),
      new MockCommandString()
    ]);
    expect(cmd.isAsync).toBe(false);
    var success = cmd.execute();
    expect(success).toBe(true);
    expect(MockCommandString.str).toBe('abc');
    expect(cmd.state).toBe(State.SUCCESS);
  });

  it('should revert synchronous commands in parallel', function() {
    var success = cmd.revert();
    expect(success).toBe(true);
    expect(MockCommandString.str).toBe('');
    expect(cmd.state).toBe(State.READY);
  });

  it('should execute asynchronous commands in parallel', function() {
    MockCommand.value = 0;
    MockCommandString.str = '';
    cmd.setCommands([
      new AsyncMockCommandString(),
      new AsyncMockCommandString(),
      new AsyncMockCommandString()]);

    var success;
    runs(function() {
      expect(cmd.isAsync).toBe(true);
      success = cmd.execute();
    });

    waitsFor(function() {
      return MockCommand.value === 3;
    }, 'command to finish executing');

    runs(function() {
      expect(success).toBe(true);
      expect(MockCommandString.str).toMatch(/(abc|acb|bac|bca|cab|cba)/);
      expect(cmd.state).toBe(State.SUCCESS);
    });
  });

  it('should revert asynchronous commands in parallel', function() {
    var success;
    runs(function() {
      success = cmd.revert();
    });

    waitsFor(function() {
      return MockCommandString.str == '';
    }, 'command to finish reverting');

    runs(function() {
      expect(success).toBe(true);
      expect(MockCommandString.str).toBe('');
      expect(cmd.state).toBe(State.READY);
    });
  });

  it('should execute mixed commands in parallel', function() {
    MockCommand.value = 0;
    MockCommandString.str = '';
    cmd.setCommands([
      new MockCommandString(),
      new AsyncMockCommandString(),
      new MockCommandString()
    ]);

    var success;
    runs(function() {
      expect(cmd.isAsync).toBe(true);
      success = cmd.execute();
    });

    waitsFor(function() {
      return MockCommand.value === 3;
    }, 'command to finish executing');

    runs(function() {
      expect(success).toBe(true);
      expect(MockCommandString.str).toMatch(/(abc|acb|bac|bca|cab|cba)/);
      expect(cmd.state).toBe(State.SUCCESS);
    });
  });

  it('should revert mixed commands in parallel', function() {
    var success;
    runs(function() {
      success = cmd.revert();
    });

    waitsFor(function() {
      return MockCommandString.str == '';
    }, 'command to finish reverting');

    runs(function() {
      expect(success).toBe(true);
      expect(MockCommandString.str).toBe('');
      expect(cmd.state).toBe(State.READY);
    });
  });

  /** @todo fix these when we actually use ParallelCommand */

  xit('does not execute again if currently executing', function() {
    throw new Error('implement me');
  });

  xit('does not execute again if already executed successfully', function() {
    throw new Error('implement me');
  });

  xit('does not execute again if already executed and failed', function() {
    throw new Error('implement me');
  });
});

describe('os.command.ParallelCommand error handling', function() {
  const osArray = goog.module.get('os.array');
  const {default: EventType} = goog.module.get('os.command.EventType');
  const {default: ParallelCommand} = goog.module.get('os.command.ParallelCommand');
  const {default: State} = goog.module.get('os.command.State');

  const AsyncMockCommand = goog.module.get('os.command.AsyncMockCommand');
  const MockCommand = goog.module.get('os.command.MockCommand');
  const MockCommandString = goog.module.get('os.command.MockCommandString');

  var addTitlesTo = function(commands) {
    osArray.forEach(commands, function(command, index) {
      command.title = jasmine.getEnv().currentSpec.description + ' [' + index + ']';
    });
  };

  var errorListener = jasmine.createSpy('onSequenceError');
  var batch;

  beforeEach(function() {
    errorListener.reset();
    batch = new ParallelCommand();
    batch.listen(EventType.EXECUTED, errorListener);
    MockCommand.value = 0;
    MockCommandString.str = '';
  });

  afterEach(function() {
    expect(errorListener.calls.length).toEqual(1);
    expect(errorListener.mostRecentCall.args[0].type).toBe(EventType.EXECUTED);
    expect(errorListener.mostRecentCall.args[0].target).toBe(batch);
    expect(batch.state).toBe(State.ERROR);
    MockCommand.value = 0;
    MockCommandString.str = '';
  });

  it('stops executing when the first sync sub-command fails', function() {
    var commands = [
      new MockCommand(),
      new MockCommand(),
      new MockCommand()
    ];
    addTitlesTo(commands);
    spyOn(commands[0], 'execute').andReturn(false);
    spyOn(commands[1], 'execute').andCallThrough();
    spyOn(commands[2], 'execute').andCallThrough();
    batch.setCommands(commands);
    var success = batch.execute();
    expect(success).toBe(false);
    expect(commands[0].execute.calls.length).toEqual(1);
    expect(commands[1].execute).not.toHaveBeenCalled();
    expect(commands[2].execute).not.toHaveBeenCalled();
  });

  it('stops executing when an intermediate sync sub-command fails', function() {
    var commands = [
      new MockCommand(),
      new MockCommand(),
      new MockCommand()
    ];
    addTitlesTo(commands);
    spyOn(commands[0], 'execute').andCallThrough();
    spyOn(commands[1], 'execute').andReturn(false);
    spyOn(commands[2], 'execute').andCallThrough();
    batch.setCommands(commands);
    var success = batch.execute();
    expect(success).toBe(false);
    expect(commands[0].execute.calls.length).toEqual(1);
    expect(commands[1].execute.calls.length).toEqual(1);
    expect(commands[2].execute).not.toHaveBeenCalled();
  });

  it('fails when the last sync sub-command fails', function() {
    var commands = [
      new MockCommand(),
      new MockCommand(),
      new MockCommand()
    ];
    addTitlesTo(commands);
    spyOn(commands[0], 'execute').andCallThrough();
    spyOn(commands[1], 'execute').andCallThrough();
    spyOn(commands[2], 'execute').andReturn(false);
    batch.setCommands(commands);
    var success = batch.execute();
    expect(success).toBe(false);
    expect(commands[0].execute.calls.length).toEqual(1);
    expect(commands[1].execute.calls.length).toEqual(1);
    expect(commands[2].execute.calls.length).toEqual(1);
  });

  it('stops executing when the first async sub-command fails', function() {
    var commands = [
      new AsyncMockCommand(),
      new AsyncMockCommand(),
      new AsyncMockCommand()
    ];
    spyOn(commands[0], 'execute').andReturn(false);
    spyOn(commands[1], 'execute').andCallThrough();
    spyOn(commands[2], 'execute').andCallThrough();
    batch.setCommands(commands);

    var success;
    runs(function() {
      success = batch.execute();
    });

    waitsFor(function() {
      return batch.state !== State.EXECUTING;
    }, 'batch to complete');

    runs(function() {
      expect(success).toBe(false);
      expect(commands[0].execute.calls.length).toEqual(1);
      expect(commands[1].execute).not.toHaveBeenCalled();
      expect(commands[2].execute).not.toHaveBeenCalled();
    });
  });

  it('stops executing when an intermediate async sub-command fails', function() {
    var commands = [
      new AsyncMockCommand(),
      new AsyncMockCommand(),
      new AsyncMockCommand()
    ];
    addTitlesTo(commands);
    spyOn(commands[0], 'execute').andCallThrough();
    spyOn(commands[1], 'execute').andReturn(false);
    spyOn(commands[2], 'execute').andCallThrough();
    batch.setCommands(commands);

    var success;
    runs(function() {
      success = batch.execute();
    });

    waitsFor(function() {
      return batch.state !== State.EXECUTING && MockCommand.value == 1;
    }, 'batch to complete');

    runs(function() {
      expect(success).toBe(false);
      expect(commands[0].execute.calls.length).toEqual(1);
      expect(commands[1].execute.calls.length).toEqual(1);
      expect(commands[2].execute).not.toHaveBeenCalled();
    });
  });

  it('fails when the last async sub-command fails', function() {
    var commands = [
      new AsyncMockCommand(),
      new AsyncMockCommand(),
      new AsyncMockCommand()
    ];
    spyOn(commands[0], 'execute').andCallThrough();
    spyOn(commands[1], 'execute').andCallThrough();
    spyOn(commands[2], 'execute').andReturn(false);
    batch.setCommands(commands);

    var success;
    runs(function() {
      success = batch.execute();
    });

    waitsFor(function() {
      return batch.state !== State.EXECUTING && MockCommand.value == 2;
    }, 'batch to complete');

    runs(function() {
      expect(success).toBe(false);
      expect(commands[0].execute.calls.length).toEqual(1);
      expect(commands[1].execute.calls.length).toEqual(1);
      expect(commands[2].execute.calls.length).toEqual(1);
    });
  });
});
