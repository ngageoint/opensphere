goog.require('goog.events.Event');
goog.require('os.command.AsyncMockCommand');
goog.require('os.command.CommandProcessor');
goog.require('os.command.EventType');
goog.require('os.command.MockCommand');
goog.require('os.command.MockCommandString');
goog.require('os.command.State');

describe('os.command.CommandProcessor', function() {
  const GoogEvent = goog.module.get('goog.events.Event');
  const CommandProcessor = goog.module.get('os.command.CommandProcessor');
  const EventType = goog.module.get('os.command.EventType');
  const State = goog.module.get('os.command.State');

  const AsyncMockCommand = goog.module.get('os.command.AsyncMockCommand');
  const MockCommand = goog.module.get('os.command.MockCommand');
  const MockCommandString = goog.module.get('os.command.MockCommandString');

  var cp = new CommandProcessor();

  it('should not die a horrible death if calling undo with no commands', function() {
    var fn = function() {
      cp.undo();
    };

    expect(fn).not.toThrow();
  });

  it('should not die a horrible death if calling redo with no commands', function() {
    var fn = function() {
      cp.redo();
    };

    expect(fn).not.toThrow();
  });

  it('should execute a synchronous command on add', function() {
    var c = new MockCommand();
    cp.addCommand(c);
    expect(cp.getHistory()).toContain(c);
    expect(MockCommand.value).toBe(1);
    expect(cp.getCurrent()).toBe(0);
    expect(cp.isProcessing()).toBe(false);
  });

  it('should be able to undo the previous command', function() {
    cp.undo();
    expect(MockCommand.value).toBe(0);
    expect(cp.getCurrent()).toBe(-1);
    expect(cp.isProcessing()).toBe(false);
  });

  it('should be able to redo the command', function() {
    cp.redo();
    expect(MockCommand.value).toBe(1);
    expect(cp.getCurrent()).toBe(0);
    expect(cp.isProcessing()).toBe(false);
  });

  it('should be able to handle multiple commands', function() {
    for (var i = 0; i < 5; i++) {
      cp.addCommand(new MockCommand());
    }
    expect(MockCommand.value).toBe(6);
    expect(cp.getCurrent()).toBe(5);
    expect(cp.isProcessing()).toBe(false);
  });

  it('should not add a failed command to the queue', function() {
    var current = cp.getCurrent();

    var command = new MockCommand();
    spyOn(command, 'execute').andReturn(false);
    cp.addCommand(command);
    expect(cp.getCurrent()).toEqual(current);
    expect(cp.isProcessing()).toBe(false);

    command = new AsyncMockCommand();
    spyOn(command, 'execute').andReturn(false);
    cp.addCommand(command);
    expect(cp.getCurrent()).toEqual(current);
    expect(cp.isProcessing()).toBe(false);
  });

  it('should not add a command that throws an error', function() {
    var current = cp.getCurrent();

    var command = new MockCommand();
    spyOn(command, 'execute').andThrow('command error');
    cp.addCommand(command);
    expect(cp.getCurrent()).toEqual(current);
    expect(cp.isProcessing()).toBe(false);

    command = new AsyncMockCommand();
    spyOn(command, 'execute').andThrow('command error');
    cp.addCommand(command);
    expect(cp.getCurrent()).toEqual(current);
    expect(cp.isProcessing()).toBe(false);
  });

  it('should not add an executed failed command to the queue', function() {
    var current = cp.getCurrent();
    var length = cp.getHistory().length;

    var command = new MockCommand();
    spyOn(command, 'execute').andCallThrough();
    command.state = State.ERROR;
    cp.addCommand(command);
    expect(cp.getCurrent()).toEqual(current);
    expect(cp.getHistory().length).toEqual(length);
    expect(cp.isProcessing()).toBe(false);
    expect(command.execute).not.toHaveBeenCalled();

    var command = new AsyncMockCommand();
    spyOn(command, 'execute').andCallThrough();
    command.state = State.ERROR;
    cp.addCommand(command);
    expect(cp.getCurrent()).toEqual(current);
    expect(cp.getHistory().length).toEqual(length);
    expect(cp.isProcessing()).toBe(false);
    expect(command.execute).not.toHaveBeenCalled();
  });

  it('should be able to revert back to a specific index', function() {
    // revert back to just the first two
    cp.setIndex(1);
    expect(MockCommand.value).toBe(2);
    expect(cp.getCurrent()).toBe(1);
    expect(cp.getHistory().length).toBe(6);
    expect(cp.isProcessing()).toBe(false);
  });

  it('should be able to execute forward to a specific index', function() {
    cp.setIndex(2);
    expect(MockCommand.value).toBe(3);
    expect(cp.getCurrent()).toBe(2);
    expect(cp.getHistory().length).toBe(6);
    expect(cp.isProcessing()).toBe(false);
  });

  it('should clear out the history beginning at the current index when a new command is added', function() {
    cp.addCommand(new MockCommand());
    expect(MockCommand.value).toBe(4);
    expect(cp.getCurrent()).toBe(3);
    expect(cp.getHistory().length).toBe(4);
    expect(cp.isProcessing()).toBe(false);
  });

  it('should execute an asynchronous command on add', function() {
    cp.setIndex(-1);

    runs(function() {
      expect(MockCommand.value).toBe(0);
      cp.addCommand(new AsyncMockCommand());
    });

    waitsFor(function() {
      return MockCommand.value === 1;
    }, 'the command to finish executing');

    runs(function() {
      expect(cp.getHistory().length).toBe(1);
      expect(cp.getCurrent()).toBe(0);
      expect(cp.isProcessing()).toBe(false);
    });
  });

  it('should be able to undo the asynchronous command', function() {
    runs(function() {
      cp.undo();
    });

    waitsFor(function() {
      return MockCommand.value === 0;
    }, 'the command to finish reverting');

    runs(function() {
      expect(cp.getHistory().length).toBe(1);
      expect(cp.getCurrent()).toBe(-1);
      expect(cp.isProcessing()).toBe(false);
    });
  });

  it('should be able to redo the asynchronous command', function() {
    runs(function() {
      cp.redo();
    });

    waitsFor(function() {
      return MockCommand.value === 1;
    }, 'the command to finish executing');

    runs(function() {
      expect(cp.getHistory().length).toBe(1);
      expect(cp.getCurrent()).toBe(0);
      expect(cp.isProcessing()).toBe(false);
    });
  });

  it('should queue up commands added while asynchronous commands are executing', function() {
    runs(function() {
      cp.addCommand(new AsyncMockCommand());
      cp.addCommand(new MockCommand());
      cp.addCommand(new MockCommand());
      cp.addCommand(new AsyncMockCommand());
    });

    waitsFor(function() {
      return MockCommand.value === 5;
    }, 'the commands to finish executing');

    runs(function() {
      expect(cp.getHistory().length).toBe(5);
      expect(cp.getCurrent()).toBe(4);
      expect(cp.isProcessing()).toBe(false);
    });
  });

  it('should not add an async command to the history after error', function() {
    var current = cp.getCurrent();
    var length = cp.getHistory().length;

    var command = new AsyncMockCommand();
    spyOn(command, 'execute').andCallFake(function() {
      setTimeout(function() {
        command.state = State.ERROR;
        command.dispatchEvent(EventType.EXECUTED);
      }, 100);
      return true;
    });

    var executed = jasmine.createSpy('onExecuted');
    cp.listen(EventType.COMMAND_EXECUTED, executed);

    runs(function() {
      cp.addCommand(command);
    });

    waitsFor(function() {
      return executed.calls.length > 0;
    }, 'command to process');

    runs(function() {
      expect(cp.getCurrent()).toEqual(current);
      expect(cp.getHistory().length).toEqual(length);
      expect(cp.getHistory()).not.toContain(command);
    });
  });

  it('should remove a sync command if re-execution fails fast', function() {
    var failCommand = cp.getHistory()[2];
    expect(failCommand instanceof MockCommand).toBe(true);
    expect(cp.getHistory().length).toBe(5);

    runs(function() {
      cp.setIndex(-1);
    });

    waitsFor(function() {
      return cp.getCurrent() == -1 && MockCommand.value == 0;
    }, 'commands to revert');

    runs(function() {
      spyOn(failCommand, 'execute').andReturn(false);
      cp.setIndex(3);
    });

    waitsFor(function() {
      return MockCommand.value == 3;
    });

    runs(function() {
      expect(failCommand.execute.calls.length).toBe(1);
      expect(cp.getHistory().length).toBe(4);
      expect(cp.getHistory()).not.toContain(failCommand);
      expect(cp.getCurrent()).toBe(2);
    });
  });

  it('should remove a sync command if re-execution results in error', function() {
    var failCommand = cp.getHistory()[2];
    expect(failCommand instanceof MockCommand).toBe(true);
    expect(cp.getHistory().length).toBe(4);

    runs(function() {
      cp.setIndex(-1);
    });

    waitsFor(function() {
      return cp.getCurrent() == -1 && MockCommand.value == 0;
    }, 'commands to revert');

    runs(function() {
      spyOn(failCommand, 'execute').andCallFake(function() {
        this.state = State.ERROR;
        return true;
      });
      cp.setIndex(3);
    });

    waitsFor(function() {
      return MockCommand.value == 3;
    });

    runs(function() {
      expect(failCommand.execute.calls.length).toBe(1);
      expect(cp.getHistory().length).toBe(3);
      expect(cp.getHistory()).not.toContain(failCommand);
      expect(cp.getCurrent()).toBe(2);
    });
  });

  it('should remove an async command if re-execution fails fast', function() {
    var failCommand = cp.getHistory()[1];
    expect(failCommand instanceof AsyncMockCommand).toBe(true);
    expect(cp.getHistory().length).toBe(3);

    runs(function() {
      cp.setIndex(-1);
    });

    waitsFor(function() {
      return cp.getCurrent() == -1 && MockCommand.value == 0;
    }, 'commands to revert');

    runs(function() {
      spyOn(failCommand, 'execute').andReturn(false);
      cp.setIndex(3);
    });

    waitsFor(function() {
      return MockCommand.value == 2 && failCommand.execute.calls.length == 1;
    });

    runs(function() {
      expect(failCommand.execute.calls.length).toBe(1);
      expect(cp.getHistory().length).toBe(2);
      expect(cp.getHistory()).not.toContain(failCommand);
      expect(cp.getCurrent()).toBe(1);
    });
  });

  it('should remove an async command if re-execution results in error', function() {
    var failCommand = cp.getHistory()[1];
    expect(failCommand instanceof AsyncMockCommand).toBe(true);
    expect(cp.getHistory().length).toBe(2);

    runs(function() {
      cp.setIndex(-1);
    });

    waitsFor(function() {
      return cp.getCurrent() == -1 && MockCommand.value == 0;
    }, 'commands to revert');

    runs(function() {
      spyOn(failCommand, 'execute').andCallFake(function() {
        setTimeout(function() {
          failCommand.state = State.ERROR;
          failCommand.dispatchEvent(new GoogEvent(EventType.EXECUTED));
        }, 100);
        return true;
      });
      cp.setIndex(2);
    });

    waitsFor(function() {
      return cp.getHistory().length == 1;
    }, 'command to fail');

    runs(function() {
      expect(MockCommand.value).toBe(1);
      expect(failCommand.execute.calls.length).toBe(1);
      expect(cp.getHistory().length).toBe(1);
      expect(cp.getHistory()).not.toContain(failCommand);
      expect(cp.getCurrent()).toBe(0);
    });
  });

  it('should be able to set the history limit', function() {
    for (var i = 0; i < 5; i++) {
      cp.addCommand(new MockCommand());
    }
    cp.setHistoryLimit(4);
    expect(cp.getHistory().length).toBe(4);
    expect(cp.getCurrent()).toBe(3);
    expect(MockCommand.value).toBe(6);
  });

  it('should never get bigger than the history limit', function() {
    cp.addCommand(new MockCommand());
    cp.addCommand(new MockCommand());
    cp.addCommand(new MockCommand());
    cp.addCommand(new MockCommand());
    expect(MockCommand.value).toBe(10);
    expect(cp.getHistory().length).toBe(4);
    expect(cp.getCurrent()).toBe(3);
  });

  it('should handle already executed commands', function() {
    MockCommand.value = 0;
    MockCommandString.str = '';

    var command = new MockCommand();
    command.execute();

    spyOn(command, 'revert').andCallThrough();
    spyOn(command, 'execute').andCallThrough();

    cp.addCommand(command);
    expect(command.execute).not.toHaveBeenCalled();

    cp.undo();
    expect(MockCommand.value).toBe(0);
    expect(command.revert.calls.length).toEqual(1);

    cp.redo();
    expect(MockCommand.value).toBe(1);
    expect(command.execute.calls.length).toEqual(1);
  });

  it('should properly dispose of commands that are removed from the stack', function() {
    var comOne = new MockCommand();
    var comTwo = new MockCommand();

    expect(comOne.isDisposed()).toBe(false);
    expect(comTwo.isDisposed()).toBe(false);

    cp.setHistoryLimit(1);
    cp.addCommand(comOne);
    cp.addCommand(comTwo);

    expect(comOne.isDisposed()).toBe(true);
    expect(comTwo.isDisposed()).toBe(false);
  });

  it('handles setting the index while commands are executing', function() {
    var cp = new CommandProcessor();

    MockCommand.value = 0;
    MockCommandString.str = '';

    var hanger = new AsyncMockCommand(true);
    spyOn(hanger, 'execute').andCallThrough();
    spyOn(hanger, 'revert').andCallThrough();
    spyOn(hanger, 'onRevert').andCallThrough();

    runs(function() {
      cp.addCommand(new MockCommand());
      cp.addCommand(new MockCommand());
      cp.addCommand(hanger);
    });

    waitsFor(function() {
      return hanger.execute.calls.length > 0;
    }, 'processing to hang');

    runs(function() {
      expect(cp.getCurrent()).toBe(1);
      expect(MockCommand.value).toBe(2);

      cp.setIndex(0);

      expect(hanger.revert).not.toHaveBeenCalled();
      expect(MockCommand.value).toBe(2);

      hanger.onExecute();
    });

    waitsFor(function() {
      return hanger.revert.calls.length > 0;
    }, 'revert to be called on the hanger');

    runs(function() {
      expect(cp.getCurrent()).toBe(2);
      expect(hanger.revert.calls.length).toBe(1);
      expect(MockCommand.value).toBe(3);

      hanger.onRevert();
    });

    waitsFor(function() {
      return hanger.onRevert.calls.length > 0;
    }, 'hanger to be reverted');

    runs(function() {
      expect(cp.getCurrent()).toBe(0);
      expect(hanger.onRevert.calls.length).toBe(1);
      expect(MockCommand.value).toBe(1);
    });
  });

  it('should be in the processing state if a command in the history is executing', function() {
    var cp = new CommandProcessor();
    var c = new MockCommand();

    MockCommand.value = 0;
    MockCommandString.str = '';

    cp.addCommand(c);

    c.state = State.EXECUTING;
    expect(cp.isProcessing()).toBe(true);

    c.state = State.EXECUTED;
    expect(cp.isProcessing()).toBe(false);
  });
});
