goog.require('goog.Timer');
goog.require('goog.events.Event');
goog.require('os.array');
goog.require('os.command.AsyncMockCommandString');
goog.require('os.command.EventType');
goog.require('os.command.MockCommand');
goog.require('os.command.MockCommandString');
goog.require('os.command.SequenceCommand');
goog.require('os.command.State');

describe('os.command.SequenceCommand', function() {
  const Timer = goog.module.get('goog.Timer');
  const GoogEvent = goog.module.get('goog.events.Event');
  const osArray = goog.module.get('os.array');
  const EventType = goog.module.get('os.command.EventType');
  const SequenceCommand = goog.module.get('os.command.SequenceCommand');
  const State = goog.module.get('os.command.State');

  const AsyncMockCommand = goog.module.get('os.command.AsyncMockCommand');
  const AsyncMockCommandString = goog.module.get('os.command.AsyncMockCommandString');
  const MockCommand = goog.module.get('os.command.MockCommand');
  const MockCommandString = goog.module.get('os.command.MockCommandString');

  var syncSet = [
    new MockCommandString(),
    new MockCommandString(),
    new MockCommandString()
  ];
  osArray.forEach(syncSet, function(command, index) {
    command.title = 'sync-' + index;
  });

  var asyncSet = [
    new AsyncMockCommandString(),
    new AsyncMockCommandString(),
    new AsyncMockCommandString()
  ];
  osArray.forEach(asyncSet, function(command, index) {
    command.title = 'async-' + index;
  });

  var mixedSet = [
    new MockCommandString(),
    new AsyncMockCommandString(),
    new MockCommandString()
  ];
  osArray.forEach(mixedSet, function(command, index) {
    command.title = 'mixed-' + index;
  });

  var cmd = new SequenceCommand();

  it('should automatically create a title if one doesnt exist', function() {
    cmd.setCommands(syncSet);
    expect(cmd.title).toBe('[ sync-0, sync-1, sync-2 ]');
  });

  it('should not overwrite an existing title', function() {
    cmd.title = 'test title';
    cmd.setCommands(syncSet);
    expect(cmd.title).toBe('test title');
  });

  it('should handle executing all synchronous commands', function() {
    MockCommand.value = 0;
    MockCommandString.str = '';
    cmd.setCommands(syncSet);
    expect(cmd.isAsync).toBe(false);
    expect(cmd.execute()).toBe(true);
    expect(MockCommandString.str).toBe('abc');
    expect(cmd.state).toBe(State.SUCCESS);
  });

  it('should handle reverting all synchronous commands', function() {
    expect(cmd.revert()).toBe(true);
    expect(MockCommandString.str).toBe('');
    expect(cmd.state).toBe(State.READY);
  });

  it('should handle executing all asynchronous commands', function() {
    MockCommand.value = 0;
    MockCommandString.str = '';
    cmd.setCommands(asyncSet);

    runs(function() {
      expect(cmd.isAsync).toBe(true);
      expect(cmd.execute()).toBe(true);
      expect(cmd.state).toBe(State.EXECUTING);
    });

    waitsFor(function() {
      return MockCommandString.str == 'abc' && cmd.state !== State.EXECUTING;
    }, 'the command to finish executing');

    runs(function() {
      expect(MockCommandString.str).toBe('abc');
      expect(cmd.current_).toBe(3);
      expect(cmd.state).toBe(State.SUCCESS);
    });
  });

  it('should handle reverting all asynchronous commands', function() {
    runs(function() {
      expect(cmd.revert()).toBe(true);
      expect(cmd.state).toBe(State.REVERTING);
    });

    waitsFor(function() {
      return MockCommandString.str == '' && cmd.state !== State.REVERTING;
    }, 'the command to finish reverting');

    runs(function() {
      expect(MockCommandString.str).toBe('');
      expect(cmd.current_).toBe(0);
      expect(cmd.state).toBe(State.READY);
    });
  });

  it('should handle executing mixed commands', function() {
    MockCommand.value = 0;
    MockCommandString.str = '';
    cmd.setCommands(mixedSet);

    runs(function() {
      expect(cmd.isAsync).toBe(true);
      expect(cmd.execute()).toBe(true);
      expect(cmd.state).toBe(State.EXECUTING);
    });

    waitsFor(function() {
      return MockCommandString.str === 'abc';
    }, 'the command to finish executing');

    runs(function() {
      expect(MockCommandString.str).toBe('abc');
      expect(cmd.current_).toBe(3);
      expect(cmd.state).toBe(State.SUCCESS);
    });
  });

  it('should handle reverting mixed commands', function() {
    runs(function() {
      expect(cmd.revert()).toBe(true);
      expect(cmd.state).toBe(State.REVERTING);
    });

    waitsFor(function() {
      return MockCommandString.str === '';
    }, 'the command to finish reverting');

    runs(function() {
      expect(MockCommandString.str).toBe('');
      expect(cmd.current_).toBe(0);
      expect(cmd.state).toBe(State.READY);
    });
  });

  it('should handle already executed sub-commands', function() {
    MockCommand.value = 0;
    MockCommandString.str = '';

    var commands = [new MockCommand(), new MockCommand()];
    commands[0].execute();
    commands[1].execute();

    spyOn(commands[0], 'execute').andCallThrough();
    spyOn(commands[0], 'revert').andCallThrough();
    spyOn(commands[1], 'execute').andCallThrough();
    spyOn(commands[1], 'revert').andCallThrough();

    cmd.setCommands(commands);
    expect(cmd.state).toBe(State.SUCCESS);

    // revert
    cmd.revert();
    expect(MockCommand.value).toBe(0);
    expect(commands[0].revert.calls.length).toEqual(1);
    expect(commands[1].revert.calls.length).toEqual(1);
    expect(cmd.state).toBe(State.READY);

    // execute
    cmd.execute();
    expect(MockCommand.value).toBe(2);
    expect(commands[0].execute.calls.length).toEqual(1);
    expect(commands[1].execute.calls.length).toEqual(1);
    expect(cmd.state).toBe(State.SUCCESS);
  });

  it('does not execute again if already executed successfully', function() {
    osArray.forEach(cmd.getCommands(), function(command) {
      spyOn(command, 'execute').andReturn(true);
    });
    expect(cmd.state).toBe(State.SUCCESS);
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(State.SUCCESS);
    osArray.forEach(cmd.getCommands(), function(command) {
      expect(command.execute).not.toHaveBeenCalled();
    });
  });

  it('does not execute again if currently executing', function() {
    runs(function() {
      expect(cmd.revert()).toBe(true);
    });

    waitsFor(function() {
      return cmd.state === State.READY;
    }, 'command to revert');

    runs(function() {
      MockCommand.value = 0;
      MockCommandString.str = '';

      cmd.setCommands(asyncSet);

      var proceed = spyOn(asyncSet[0], 'execute').andReturn(true).originalValue.bind(asyncSet[0]);

      expect(cmd.state).toBe(State.READY);
      expect(cmd.execute()).toBe(true);
      expect(cmd.state).toBe(State.EXECUTING);
      expect(cmd.execute()).toBe(false);

      proceed();
    });

    waitsFor(function() {
      return MockCommand.value == 3 && cmd.state !== State.EXECUTING;
    }, 'command to execute');

    runs(function() {
      expect(cmd.getCommands()[0].execute.calls.length).toBe(1);
      expect(cmd.state).toBe(State.SUCCESS);
      expect(MockCommand.value).toBe(3);
      expect(MockCommandString.str).toEqual('abc');
    });
  });

  it('does not revert again if currently reverting', function() {
    runs(function() {
      var proceed = spyOn(asyncSet[2], 'revert').andReturn(true).originalValue.bind(asyncSet[2]);

      expect(cmd.state).toBe(State.SUCCESS);
      expect(cmd.revert()).toBe(true);
      expect(cmd.state).toBe(State.REVERTING);
      expect(cmd.revert()).toBe(false);

      proceed();
    });

    waitsFor(function() {
      return cmd.state !== State.REVERTING;
    }, 'command to revert');

    runs(function() {
      expect(cmd.getCommands()[2].revert.calls.length).toBe(1);
      expect(cmd.state).toBe(State.READY);
      expect(MockCommand.value).toBe(0);
      expect(MockCommandString.str).toEqual('');
    });
  });

  it('does not execute again if already executed and failed', function() {
    spyOn(asyncSet[0], 'execute');
    expect(cmd.state).toBe(State.READY);
    cmd.state = State.ERROR;
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(State.ERROR);
    expect(asyncSet[0].execute).not.toHaveBeenCalled();
  });

  it('does not revert if already executed and failed', function() {
    expect(cmd.state).toBe(State.ERROR);
    osArray.forEach(asyncSet, function(command) {
      spyOn(command, 'revert').andCallThrough();
    });
    expect(cmd.revert()).toBe(false);
    expect(cmd.state).toBe(State.ERROR);
    osArray.forEach(asyncSet, function(command) {
      expect(command.revert).not.toHaveBeenCalled();
    });
  });

  describe('execute error handling', function() {
    var errorListener = jasmine.createSpy('onSequenceError');
    var seq;

    beforeEach(function() {
      errorListener.reset();
      seq = new SequenceCommand();
      seq.listen(EventType.EXECUTED, errorListener);
      MockCommand.value = 0;
      MockCommandString.str = '';
    });

    afterEach(function() {
      expect(errorListener.calls.length).toEqual(1);
      expect(errorListener.mostRecentCall.args[0].type).toBe(EventType.EXECUTED);
      expect(errorListener.mostRecentCall.args[0].target).toBe(seq);
      expect(seq.state).toBe(State.ERROR);
      MockCommand.value = 0;
      MockCommandString.str = '';
    });

    it('stops executing when the first sync sub-command fails', function() {
      var commands = [
        new MockCommand(),
        new MockCommand()
      ];
      spyOn(commands[0], 'execute').andReturn(false);
      spyOn(commands[1], 'execute').andCallThrough();
      seq.setCommands(commands);
      var success = seq.execute();
      expect(success).toBe(false);
      expect(commands[0].execute.calls.length).toEqual(1);
      expect(commands[1].execute).not.toHaveBeenCalled();
    });

    it('stops executing when an intermediate sync sub-command fails', function() {
      var commands = [
        new MockCommand(),
        new MockCommand(),
        new MockCommand()
      ];
      spyOn(commands[0], 'execute').andCallThrough();
      spyOn(commands[1], 'execute').andReturn(false);
      spyOn(commands[2], 'execute').andCallThrough();
      seq.setCommands(commands);
      var success = seq.execute();
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
      spyOn(commands[0], 'execute').andCallThrough();
      spyOn(commands[1], 'execute').andCallThrough();
      spyOn(commands[2], 'execute').andReturn(false);
      seq.setCommands(commands);
      var success = seq.execute();
      expect(success).toBe(false);
      expect(commands[0].execute.calls.length).toEqual(1);
      expect(commands[1].execute.calls.length).toEqual(1);
      expect(commands[2].execute.calls.length).toEqual(1);
    });

    it('stops executing when the first async sub-command fails fast', function() {
      var commands = [
        new MockCommand(),
        new MockCommand(),
        new AsyncMockCommand(),
        new AsyncMockCommand()
      ];
      var firstAsync = 2;

      seq.setCommands(commands);
      spyOn(seq.getCommands()[firstAsync], 'execute').andReturn(false);
      osArray.forEach(seq.getCommands(), function(command, index) {
        if (index != firstAsync) {
          spyOn(command, 'execute').andCallThrough();
        }
      });

      var success;
      runs(function() {
        success = seq.execute();
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING;
      }, 'sequence to complete');

      runs(function() {
        expect(success).toBe(false);
        expect(seq.state).toBe(State.ERROR);
        osArray.forEach(seq.getCommands(), function(command, index) {
          if (index < firstAsync) {
            expect(command.execute.calls.length).toEqual(1);
          } else if (index > firstAsync) {
            expect(command.execute).not.toHaveBeenCalled();
          }
        });
      });
    });

    it('stops executing when an intermediate async sub-command fails fast', function() {
      var commands = [
        new AsyncMockCommand(),
        new AsyncMockCommand(),
        new AsyncMockCommand(),
        new AsyncMockCommand()
      ];

      spyOn(commands[0], 'execute').andCallThrough();
      failSpy = spyOn(commands[1], 'execute').andCallFake(function() {
        failSpy.originalValue.call(commands[1]);
        return false;
      });
      osArray.forEach(commands, function(command, index) {
        if (index > 1) {
          spyOn(command, 'execute').andCallThrough();
        }
      });

      seq.setCommands(commands);

      var success;
      runs(function() {
        success = seq.execute();
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(success).toBe(true);
        expect(seq.state).toBe(State.ERROR);
        osArray.forEach(seq.getCommands(), function(command, index) {
          if (index > 1) {
            expect(command.execute).not.toHaveBeenCalled();
          } else {
            expect(command.execute.calls.length).toEqual(1);
          }
        });
      });
    });

    it('stops executing when a sync sub-command fails before any async sub-command', function() {
      var commands = [
        new MockCommand(),
        new MockCommand(),
        new AsyncMockCommand(),
        new MockCommand()
      ];

      spyOn(commands[1], 'execute').andReturn(false);
      osArray.forEach(commands, function(command, index) {
        if (index != 1) {
          spyOn(command, 'execute').andCallThrough();
        }
      });

      seq.setCommands(commands);

      var success;
      runs(function() {
        success = seq.execute();
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(success).toBe(false);
        expect(seq.state).toBe(State.ERROR);
        expect(seq.getCommands()[0].execute).toHaveBeenCalled();
        osArray.forEach(seq.getCommands(), function(command, index) {
          if (index > 1) {
            expect(command.execute).not.toHaveBeenCalled();
          } else {
            expect(command.execute.calls.length).toEqual(1);
          }
        });
      });
    });

    it('stops executing when a sync sub-command throws an error', function() {
      var commands = [
        new MockCommand(),
        new MockCommand()
      ];
      spyOn(commands[0], 'execute').andThrow('command error');
      spyOn(commands[1], 'execute');

      seq.setCommands(commands);

      var success;
      runs(function() {
        success = seq.execute();
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(seq.state).toBe(State.ERROR);
        expect(success).toBe(false);
        expect(commands[0].execute.calls.length).toEqual(1);
        expect(commands[1].execute).not.toHaveBeenCalled();
      });
    });

    it('stops executing when the first async sub-command throws an error', function() {
      var commands = [
        new AsyncMockCommand(),
        new MockCommand(),
        new MockCommand()
      ];
      spyOn(commands[0], 'execute').andThrow('command error');
      spyOn(commands[1], 'execute');
      spyOn(commands[2], 'execute');

      seq.setCommands(commands);

      var success;
      runs(function() {
        success = seq.execute();
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(seq.state).toBe(State.ERROR);
        expect(success).toBe(false);
        expect(commands[0].execute.calls.length).toEqual(1);
        expect(commands[1].execute).not.toHaveBeenCalled();
        expect(commands[2].execute).not.toHaveBeenCalled();
      });
    });

    it('stops executing when an intermediate async sub-command throws an error', function() {
      var commands = [
        new AsyncMockCommand(),
        new AsyncMockCommand(),
        new AsyncMockCommand()
      ];

      spyOn(commands[0], 'execute').andCallThrough();
      spyOn(commands[1], 'execute').andThrow('command error');
      spyOn(commands[2], 'execute');

      seq.setCommands(commands);

      var success;
      runs(function() {
        success = seq.execute();
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(seq.state).toBe(State.ERROR);
        expect(success).toBe(true);
        expect(commands[0].execute.calls.length).toEqual(1);
        expect(commands[1].execute.calls.length).toEqual(1);
        expect(commands[2].execute).not.toHaveBeenCalled();
      });
    });

    it('stops executing when an async sub-command executes with error', function() {
      var commands = [
        new AsyncMockCommand(),
        new MockCommand(),
        new MockCommand()
      ];

      spyOn(commands[0], 'execute').andCallFake(function() {
        Timer.callOnce(function() {
          this.state = State.ERROR;
          this.dispatchEvent(new GoogEvent(EventType.EXECUTED));
        }, 100, this);
        return true;
      });
      spyOn(commands[1], 'execute').andCallThrough();
      spyOn(commands[2], 'execute').andCallThrough();

      seq.setCommands(commands);

      var success;
      runs(function() {
        success = seq.execute();
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(seq.state).toBe(State.ERROR);
        expect(success).toBe(true);
        expect(commands[0].execute.calls.length).toEqual(1);
        expect(commands[1].execute).not.toHaveBeenCalled();
        expect(commands[2].execute).not.toHaveBeenCalled();
        expect(MockCommand.value).toBe(0);
      });
    });
  });

  describe('revert error handling', function() {
    var errorListener = jasmine.createSpy('onSequenceError');
    var seq;

    beforeEach(function() {
      errorListener.reset();
      seq = new SequenceCommand();
      seq.listen(EventType.REVERTED, errorListener);
      MockCommand.value = 0;
      MockCommandString.str = '';
    });

    afterEach(function() {
      expect(errorListener.calls.length).toEqual(1);
      expect(errorListener.mostRecentCall.args[0].type).toBe(EventType.REVERTED);
      expect(errorListener.mostRecentCall.args[0].target).toBe(seq);
      expect(seq.state).toBe(State.ERROR);
      MockCommand.value = 0;
      MockCommandString.str = '';
    });

    it('stops reverting when a sync sub-command fails fast', function() {
      var commands = [
        new MockCommand(),
        new MockCommand(),
        new MockCommand()
      ];
      spyOn(commands[2], 'revert').andReturn(false);
      spyOn(commands[1], 'revert').andCallThrough();
      spyOn(commands[0], 'revert').andCallThrough();
      seq.setCommands(commands);
      expect(seq.execute()).toBe(true);
      expect(seq.revert()).toBe(false);
      expect(commands[1].revert).not.toHaveBeenCalled();
      expect(commands[0].revert).not.toHaveBeenCalled();
    });

    it('stops reverting when a sync sub-command throws an error', function() {
      var commands = [
        new MockCommand(),
        new MockCommand(),
        new MockCommand()
      ];
      spyOn(commands[2], 'revert').andThrow('revert error');
      spyOn(commands[1], 'revert').andCallThrough();
      spyOn(commands[0], 'revert').andCallThrough();
      seq.setCommands(commands);
      expect(seq.execute()).toBe(true);
      expect(seq.revert()).toBe(false);
      expect(commands[1].revert).not.toHaveBeenCalled();
      expect(commands[0].revert).not.toHaveBeenCalled();
    });

    it('fails fast when the first async sub-command fails fast', function() {
      var commands = [
        new MockCommand(),
        new AsyncMockCommand(),
        new AsyncMockCommand()
      ];
      spyOn(commands[2], 'revert').andCallThrough();
      spyOn(commands[1], 'revert').andReturn(false);
      spyOn(commands[0], 'revert').andCallThrough();
      seq.setCommands(commands);

      runs(function() {
        expect(seq.execute()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING && MockCommand.value == 3;
      }, 'sequence to execute');

      runs(function() {
        expect(seq.revert()).toBe(true);
      });

      waitsFor(function() {
        return seq.state === State.ERROR && MockCommand.value == 2;
      }, 'sequence to revert');

      runs(function() {
        expect(commands[0].revert).not.toHaveBeenCalled();
      });
    });

    it('stops reverting when an async sub-command fails fast', function() {
      var commands = [
        new AsyncMockCommand(),
        new AsyncMockCommand(),
        new AsyncMockCommand()
      ];
      spyOn(commands[2], 'revert').andCallThrough();
      spyOn(commands[1], 'revert').andReturn(false);
      spyOn(commands[0], 'revert').andCallThrough();
      seq.setCommands(commands);

      runs(function() {
        expect(seq.execute()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING && MockCommand.value == 3;
      }, 'sequence to execute');

      runs(function() {
        expect(seq.revert()).toBe(true);
      });

      waitsFor(function() {
        return seq.state === State.ERROR && MockCommand.value == 2;
      }, 'sequence to revert');

      runs(function() {
        expect(commands[0].revert).not.toHaveBeenCalled();
      });
    });

    it('stops reverting when an async sub-command throws an error', function() {
      var commands = [
        new AsyncMockCommand(),
        new AsyncMockCommand(),
        new AsyncMockCommand()
      ];
      spyOn(commands[2], 'revert').andCallThrough();
      spyOn(commands[1], 'revert').andThrow('revert error');
      spyOn(commands[0], 'revert').andCallThrough();
      seq.setCommands(commands);

      runs(function() {
        expect(seq.execute()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING && MockCommand.value == 3;
      }, 'sequence to execute');

      runs(function() {
        expect(seq.revert()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== State.REVERTING && MockCommand.value == 2;
      }, 'sequence to revert');

      runs(function() {
        expect(commands[0].revert).not.toHaveBeenCalled();
      });
    });

    it('stops reverting when an async sub-command reverts with error state', function() {
      var commands = [
        new AsyncMockCommand(),
        new AsyncMockCommand(),
        new AsyncMockCommand()
      ];
      spyOn(commands[2], 'revert').andCallThrough();
      spyOn(commands[1], 'revert').andCallFake(function() {
        Timer.callOnce(function() {
          this.state = State.ERROR;
          this.dispatchEvent(new GoogEvent(EventType.REVERTED));
        }, 100, this);
        return true;
      });
      spyOn(commands[0], 'revert').andCallThrough();
      seq.setCommands(commands);

      runs(function() {
        expect(seq.execute()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== State.EXECUTING && MockCommand.value == 3;
      }, 'sequence to execute');

      runs(function() {
        expect(seq.revert()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== State.REVERTING;
      }, 'sequence to revert');

      runs(function() {
        expect(commands[0].revert).not.toHaveBeenCalled();
      });
    });
  });
});
