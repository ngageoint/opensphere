goog.require('os.command.AsyncMockCommandString');
goog.require('os.command.MockCommand');
goog.require('os.command.MockCommandString');
goog.require('os.command.ParallelCommand');

describe('os.command.ParallelCommand', function() {
  var cmd = new os.command.ParallelCommand();

  it('should execute synchronous commands in parallel', function() {
    os.command.MockCommand.value = 0;
    os.command.MockCommandString.str = '';
    cmd.setCommands([
      new os.command.MockCommandString(),
      new os.command.MockCommandString(),
      new os.command.MockCommandString()]);
    expect(cmd.isAsync).toBe(false);
    var success = cmd.execute();
    expect(success).toBe(true);
    expect(os.command.MockCommandString.str).toBe('abc');
    expect(cmd.state).toBe(os.command.State.SUCCESS);
  });

  it('should revert synchronous commands in parallel', function() {
    var success = cmd.revert();
    expect(success).toBe(true);
    expect(os.command.MockCommandString.str).toBe('');
    expect(cmd.state).toBe(os.command.State.READY);
  });

  it('should execute asynchronous commands in parallel', function() {
    os.command.MockCommand.value = 0;
    os.command.MockCommandString.str = '';
    cmd.setCommands([
      new os.command.AsyncMockCommandString(),
      new os.command.AsyncMockCommandString(),
      new os.command.AsyncMockCommandString()]);

    var success;
    runs(function() {
      expect(cmd.isAsync).toBe(true);
      success = cmd.execute();
    });

    waitsFor(function() {
      return os.command.MockCommand.value === 3;
    }, 'command to finish executing');

    runs(function() {
      expect(success).toBe(true);
      expect(os.command.MockCommandString.str).toMatch(/(abc|acb|bac|bca|cab|cba)/);
      expect(cmd.state).toBe(os.command.State.SUCCESS);
    });
  });

  it('should revert asynchronous commands in parallel', function() {
    var success;
    runs(function() {
      success = cmd.revert();
    });

    waitsFor(function() {
      return os.command.MockCommandString.str == '';
    }, 'command to finish reverting');

    runs(function() {
      expect(success).toBe(true);
      expect(os.command.MockCommandString.str).toBe('');
      expect(cmd.state).toBe(os.command.State.READY);
    });
  });

  it('should execute mixed commands in parallel', function() {
    os.command.MockCommand.value = 0;
    os.command.MockCommandString.str = '';
    cmd.setCommands([
      new os.command.MockCommandString(),
      new os.command.AsyncMockCommandString(),
      new os.command.MockCommandString()]);

    var success;
    runs(function() {
      expect(cmd.isAsync).toBe(true);
      success = cmd.execute();
    });

    waitsFor(function() {
      return os.command.MockCommand.value === 3;
    }, 'command to finish executing');

    runs(function() {
      expect(success).toBe(true);
      expect(os.command.MockCommandString.str).toMatch(/(abc|acb|bac|bca|cab|cba)/);
      expect(cmd.state).toBe(os.command.State.SUCCESS);
    });
  });

  it('should revert mixed commands in parallel', function() {
    var success;
    runs(function() {
      success = cmd.revert();
    });

    waitsFor(function() {
      return os.command.MockCommandString.str == '';
    }, 'command to finish reverting');

    runs(function() {
      expect(success).toBe(true);
      expect(os.command.MockCommandString.str).toBe('');
      expect(cmd.state).toBe(os.command.State.READY);
    });
  });

  /** @todo fix these when we actually use ParallelCommand */

  xit('does not execute again if currently executing', function() {
    throw 'implement me';
  });

  xit('does not execute again if already executed successfully', function() {
    throw 'implement me';
  });

  xit('does not execute again if already executed and failed', function() {
    throw 'implement me';
  });
});

describe('os.command.ParallelCommand error handling', function() {
  var addTitlesTo = function(commands) {
    goog.array.forEach(commands, function(command, index) {
      command.title = jasmine.getEnv().currentSpec.description + ' [' + index + ']';
    })
  };

  var errorListener = jasmine.createSpy('onSequenceError');
  var batch;

  beforeEach(function() {
    errorListener.reset();
    batch = new os.command.ParallelCommand();
    batch.listen(os.command.EventType.EXECUTED, errorListener);
    os.command.MockCommand.value = 0;
    os.command.MockCommandString.str = '';
  });

  afterEach(function() {
    expect(errorListener.calls.length).toEqual(1);
    expect(errorListener.mostRecentCall.args[0].type).toBe(os.command.EventType.EXECUTED);
    expect(errorListener.mostRecentCall.args[0].target).toBe(batch);
    expect(batch.state).toBe(os.command.State.ERROR);
    os.command.MockCommand.value = 0;
    os.command.MockCommandString.str = '';
  });

  it('stops executing when the first sync sub-command fails', function() {
    var commands = [
      new os.command.MockCommand(),
      new os.command.MockCommand(),
      new os.command.MockCommand()
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
      new os.command.MockCommand(),
      new os.command.MockCommand(),
      new os.command.MockCommand()
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
      new os.command.MockCommand(),
      new os.command.MockCommand(),
      new os.command.MockCommand()
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
      new os.command.AsyncMockCommand(),
      new os.command.AsyncMockCommand(),
      new os.command.AsyncMockCommand()
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
      return batch.state !== os.command.State.EXECUTING;
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
      new os.command.AsyncMockCommand(),
      new os.command.AsyncMockCommand(),
      new os.command.AsyncMockCommand()
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
      return batch.state !== os.command.State.EXECUTING && os.command.MockCommand.value == 1;
    }, 'batch to complete');

    runs(function() {
      expect(success).toBe(false);
      expect(commands[0].execute.calls.length).toEqual(1);
      expect(commands[1].execute.calls.length).toEqual(1);
      expect(commands[2].execute).not.toHaveBeenCalled();
    })
  });

  it('fails when the last async sub-command fails', function() {
    var commands = [
      new os.command.AsyncMockCommand(),
      new os.command.AsyncMockCommand(),
      new os.command.AsyncMockCommand()
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
      return batch.state !== os.command.State.EXECUTING && os.command.MockCommand.value == 2;
    }, 'batch to complete');

    runs(function() {
      expect(success).toBe(false);
      expect(commands[0].execute.calls.length).toEqual(1);
      expect(commands[1].execute.calls.length).toEqual(1);
      expect(commands[2].execute.calls.length).toEqual(1);
    });
  });

});
