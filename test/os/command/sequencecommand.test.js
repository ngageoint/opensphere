goog.require('os.command.AsyncMockCommandString');
goog.require('os.command.MockCommand');
goog.require('os.command.MockCommandString');
goog.require('os.command.SequenceCommand');
goog.require('os.command.State');


describe('os.command.SequenceCommand', function() {
  var syncSet = [
    new os.command.MockCommandString(),
    new os.command.MockCommandString(),
    new os.command.MockCommandString()];
  goog.array.forEach(syncSet, function(command, index) {
    command.title = 'sync-' + index;
  });

  var asyncSet = [
    new os.command.AsyncMockCommandString(),
    new os.command.AsyncMockCommandString(),
    new os.command.AsyncMockCommandString()];
  goog.array.forEach(asyncSet, function(command, index) {
    command.title = 'async-' + index;
  });

  var mixedSet = [
    new os.command.MockCommandString(),
    new os.command.AsyncMockCommandString(),
    new os.command.MockCommandString()];
  goog.array.forEach(mixedSet, function(command, index) {
    command.title = 'mixed-' + index;
  });

  var cmd = new os.command.SequenceCommand();

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
    os.command.MockCommand.value = 0;
    os.command.MockCommandString.str = '';
    cmd.setCommands(syncSet);
    expect(cmd.isAsync).toBe(false);
    expect(cmd.execute()).toBe(true);
    expect(os.command.MockCommandString.str).toBe('abc');
    expect(cmd.state).toBe(os.command.State.SUCCESS);
  });

  it('should handle reverting all synchronous commands', function() {
    expect(cmd.revert()).toBe(true);
    expect(os.command.MockCommandString.str).toBe('');
    expect(cmd.state).toBe(os.command.State.READY);
  });

  it('should handle executing all asynchronous commands', function() {
    os.command.MockCommand.value = 0;
    os.command.MockCommandString.str = '';
    cmd.setCommands(asyncSet);

    runs(function() {
      expect(cmd.isAsync).toBe(true);
      expect(cmd.execute()).toBe(true);
      expect(cmd.state).toBe(os.command.State.EXECUTING);
    });

    waitsFor(function() {
      return os.command.MockCommandString.str == 'abc' && cmd.state !== os.command.State.EXECUTING;
    }, 'the command to finish executing');

    runs(function() {
      expect(os.command.MockCommandString.str).toBe('abc');
      expect(cmd.current_).toBe(3);
      expect(cmd.state).toBe(os.command.State.SUCCESS);
    });
  });

  it('should handle reverting all asynchronous commands', function() {
    runs(function() {
      expect(cmd.revert()).toBe(true);
      expect(cmd.state).toBe(os.command.State.REVERTING);
    });

    waitsFor(function() {
      return os.command.MockCommandString.str == '' && cmd.state !== os.command.State.REVERTING;
    }, 'the command to finish reverting');

    runs(function() {
      expect(os.command.MockCommandString.str).toBe('');
      expect(cmd.current_).toBe(0);
      expect(cmd.state).toBe(os.command.State.READY);
    });
  });

  it('should handle executing mixed commands', function() {
    os.command.MockCommand.value = 0;
    os.command.MockCommandString.str = '';
    cmd.setCommands(mixedSet);

    runs(function() {
      expect(cmd.isAsync).toBe(true);
      expect(cmd.execute()).toBe(true);
      expect(cmd.state).toBe(os.command.State.EXECUTING);
    });

    waitsFor(function() {
      return os.command.MockCommandString.str === 'abc';
    }, 'the command to finish executing');

    runs(function() {
      expect(os.command.MockCommandString.str).toBe('abc');
      expect(cmd.current_).toBe(3);
      expect(cmd.state).toBe(os.command.State.SUCCESS);
    });
  });

  it('should handle reverting mixed commands', function() {
    runs(function() {
      expect(cmd.revert()).toBe(true);
      expect(cmd.state).toBe(os.command.State.REVERTING);
    });

    waitsFor(function() {
      return os.command.MockCommandString.str === '';
    }, 'the command to finish reverting');

    runs(function() {
      expect(os.command.MockCommandString.str).toBe('');
      expect(cmd.current_).toBe(0);
      expect(cmd.state).toBe(os.command.State.READY);
    });
  });

  it('should handle already executed sub-commands', function() {
    os.command.MockCommand.value = 0;
    os.command.MockCommandString.str = '';

    var commands = [new os.command.MockCommand(), new os.command.MockCommand()];
    commands[0].execute();
    commands[1].execute();

    spyOn(commands[0], 'execute').andCallThrough();
    spyOn(commands[0], 'revert').andCallThrough();
    spyOn(commands[1], 'execute').andCallThrough();
    spyOn(commands[1], 'revert').andCallThrough();

    cmd.setCommands(commands);
    expect(cmd.state).toBe(os.command.State.SUCCESS);

    // revert
    cmd.revert();
    expect(os.command.MockCommand.value).toBe(0);
    expect(commands[0].revert.calls.length).toEqual(1);
    expect(commands[1].revert.calls.length).toEqual(1);
    expect(cmd.state).toBe(os.command.State.READY);

    // execute
    cmd.execute();
    expect(os.command.MockCommand.value).toBe(2);
    expect(commands[0].execute.calls.length).toEqual(1);
    expect(commands[1].execute.calls.length).toEqual(1);
    expect(cmd.state).toBe(os.command.State.SUCCESS);
  });

  it('does not execute again if already executed successfully', function() {
    goog.array.forEach(cmd.getCommands(), function(command) {
      spyOn(command, 'execute').andReturn(true);
    });
    expect(cmd.state).toBe(os.command.State.SUCCESS);
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(os.command.State.SUCCESS);
    goog.array.forEach(cmd.getCommands(), function(command) {
      expect(command.execute).not.toHaveBeenCalled();
    });
  });

  it('does not execute again if currently executing', function() {
    runs(function() {
      expect(cmd.revert()).toBe(true);
    });

    waitsFor(function() {
      return cmd.state === os.command.State.READY;
    }, 'command to revert');

    runs(function() {
      os.command.MockCommand.value = 0;
      os.command.MockCommandString.str = '';

      cmd.setCommands(asyncSet);

      var proceed = spyOn(asyncSet[0], 'execute').andReturn(true).originalValue.bind(asyncSet[0]);

      expect(cmd.state).toBe(os.command.State.READY);
      expect(cmd.execute()).toBe(true);
      expect(cmd.state).toBe(os.command.State.EXECUTING);
      expect(cmd.execute()).toBe(false);

      proceed();
    });

    waitsFor(function() {
      return os.command.MockCommand.value == 3 && cmd.state !== os.command.State.EXECUTING;
    }, 'command to execute');

    runs(function() {
      expect(cmd.getCommands()[0].execute.calls.length).toBe(1);
      expect(cmd.state).toBe(os.command.State.SUCCESS);
      expect(os.command.MockCommand.value).toBe(3);
      expect(os.command.MockCommandString.str).toEqual('abc');
    });
  });

  it('does not revert again if currently reverting', function() {
    runs(function() {
      var proceed = spyOn(asyncSet[2], 'revert').andReturn(true).originalValue.bind(asyncSet[2]);

      expect(cmd.state).toBe(os.command.State.SUCCESS);
      expect(cmd.revert()).toBe(true);
      expect(cmd.state).toBe(os.command.State.REVERTING);
      expect(cmd.revert()).toBe(false);

      proceed();
    });

    waitsFor(function() {
      return cmd.state !== os.command.State.REVERTING;
    }, 'command to revert');

    runs(function() {
      expect(cmd.getCommands()[2].revert.calls.length).toBe(1);
      expect(cmd.state).toBe(os.command.State.READY);
      expect(os.command.MockCommand.value).toBe(0);
      expect(os.command.MockCommandString.str).toEqual('');
    });
  });

  it('does not execute again if already executed and failed', function() {
    spyOn(asyncSet[0], 'execute');
    expect(cmd.state).toBe(os.command.State.READY);
    cmd.state = os.command.State.ERROR;
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(os.command.State.ERROR);
    expect(asyncSet[0].execute).not.toHaveBeenCalled();
  });

  it('does not revert if already executed and failed', function() {
    expect(cmd.state).toBe(os.command.State.ERROR);
    goog.array.forEach(asyncSet, function(command) {
      spyOn(command, 'revert').andCallThrough();
    });
    expect(cmd.revert()).toBe(false);
    expect(cmd.state).toBe(os.command.State.ERROR);
    goog.array.forEach(asyncSet, function(command) {
      expect(command.revert).not.toHaveBeenCalled();
    });
  });

  describe('execute error handling', function() {
    var errorListener = jasmine.createSpy('onSequenceError');
    var seq;

    beforeEach(function() {
      errorListener.reset();
      seq = new os.command.SequenceCommand();
      seq.listen(os.command.EventType.EXECUTED, errorListener);
      os.command.MockCommand.value = 0;
      os.command.MockCommandString.str = '';
    });

    afterEach(function() {
      expect(errorListener.calls.length).toEqual(1);
      expect(errorListener.mostRecentCall.args[0].type).toBe(os.command.EventType.EXECUTED);
      expect(errorListener.mostRecentCall.args[0].target).toBe(seq);
      expect(seq.state).toBe(os.command.State.ERROR);
      os.command.MockCommand.value = 0;
      os.command.MockCommandString.str = '';
    });

    it('stops executing when the first sync sub-command fails', function() {
      var commands = [
        new os.command.MockCommand(),
        new os.command.MockCommand()
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
        new os.command.MockCommand(),
        new os.command.MockCommand(),
        new os.command.MockCommand()
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
        new os.command.MockCommand(),
        new os.command.MockCommand(),
        new os.command.MockCommand()
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
        new os.command.MockCommand(),
        new os.command.MockCommand(),
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand()
      ];
      var firstAsync = 2;

      seq.setCommands(commands);
      spyOn(seq.getCommands()[firstAsync], 'execute').andReturn(false);
      goog.array.forEach(seq.getCommands(), function(command, index) {
        if (index != firstAsync) {
          spyOn(command, 'execute').andCallThrough();
        }
      });

      var success;
      runs(function() {
        success = seq.execute();
      });

      waitsFor(function() {
        return seq.state !== os.command.State.EXECUTING;
      }, 'sequence to complete');

      runs(function () {
        expect(success).toBe(false);
        expect(seq.state).toBe(os.command.State.ERROR);
        goog.array.forEach(seq.getCommands(), function(command, index) {
          if (index < firstAsync) {
            expect(command.execute.calls.length).toEqual(1);
          }
          else if (index > firstAsync) {
            expect(command.execute).not.toHaveBeenCalled();
          }
        });
      });
    });

    it('stops executing when an intermediate async sub-command fails fast', function() {
      var commands = [
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand()
      ];

      spyOn(commands[0], 'execute').andCallThrough();
      failSpy = spyOn(commands[1], 'execute').andCallFake(function() {
        failSpy.originalValue.call(commands[1]);
        return false;
      });
      goog.array.forEach(commands, function(command, index) {
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
        return seq.state !== os.command.State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(success).toBe(true);
        expect(seq.state).toBe(os.command.State.ERROR);
        goog.array.forEach(seq.getCommands(), function(command, index) {
          if (index > 1) {
            expect(command.execute).not.toHaveBeenCalled();
          }
          else {
            expect(command.execute.calls.length).toEqual(1);
          }
        });
      });
    });

    it('stops executing when a sync sub-command fails before any async sub-command', function() {
      var commands = [
        new os.command.MockCommand(),
        new os.command.MockCommand(),
        new os.command.AsyncMockCommand(),
        new os.command.MockCommand()
      ];

      spyOn(commands[1], 'execute').andReturn(false);
      goog.array.forEach(commands, function(command, index) {
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
        return seq.state !== os.command.State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(success).toBe(false);
        expect(seq.state).toBe(os.command.State.ERROR);
        expect(seq.getCommands()[0].execute).toHaveBeenCalled();
        goog.array.forEach(seq.getCommands(), function(command, index) {
          if (index > 1) {
            expect(command.execute).not.toHaveBeenCalled();
          }
          else {
            expect(command.execute.calls.length).toEqual(1);
          }
        });
      });

    });

    it('stops executing when a sync sub-command throws an error', function() {
      var commands = [
        new os.command.MockCommand(),
        new os.command.MockCommand()
      ];
      spyOn(commands[0], 'execute').andThrow('command error');
      spyOn(commands[1], 'execute');

      seq.setCommands(commands);

      var success;
      runs(function() {
        success = seq.execute();
      });

      waitsFor(function() {
        return seq.state !== os.command.State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(seq.state).toBe(os.command.State.ERROR);
        expect(success).toBe(false);
        expect(commands[0].execute.calls.length).toEqual(1);
        expect(commands[1].execute).not.toHaveBeenCalled();
      });
    });

    it('stops executing when the first async sub-command throws an error', function() {
      var commands = [
        new os.command.AsyncMockCommand(),
        new os.command.MockCommand(),
        new os.command.MockCommand()
      ];
      spyOn(commands[0], 'execute').andThrow('command error');
      spyOn(commands[1], 'execute');
      spyOn(commands[2], 'execute');

      seq.setCommands(commands);

      var success;
      runs(function() {
        success = seq.execute()
      });

      waitsFor(function() {
        return seq.state !== os.command.State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(seq.state).toBe(os.command.State.ERROR);
        expect(success).toBe(false);
        expect(commands[0].execute.calls.length).toEqual(1);
        expect(commands[1].execute).not.toHaveBeenCalled();
        expect(commands[2].execute).not.toHaveBeenCalled();
      });
    });

    it('stops executing when an intermediate async sub-command throws an error', function() {
      var commands = [
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand()
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
        return seq.state !== os.command.State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(seq.state).toBe(os.command.State.ERROR);
        expect(success).toBe(true);
        expect(commands[0].execute.calls.length).toEqual(1);
        expect(commands[1].execute.calls.length).toEqual(1);
        expect(commands[2].execute).not.toHaveBeenCalled();
      });
    });

    it('stops executing when an async sub-command executes with error', function() {
      var commands = [
        new os.command.AsyncMockCommand(),
        new os.command.MockCommand(),
        new os.command.MockCommand()
      ];

      spyOn(commands[0], 'execute').andCallFake(function() {
        goog.Timer.callOnce(function() {
          this.state = os.command.State.ERROR;
          this.dispatchEvent(new goog.events.Event(os.command.EventType.EXECUTED));
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
        return seq.state !== os.command.State.EXECUTING;
      }, 'sequence command to complete');

      runs(function() {
        expect(seq.state).toBe(os.command.State.ERROR);
        expect(success).toBe(true);
        expect(commands[0].execute.calls.length).toEqual(1);
        expect(commands[1].execute).not.toHaveBeenCalled();
        expect(commands[2].execute).not.toHaveBeenCalled();
        expect(os.command.MockCommand.value).toBe(0);
      });

    });
  });

  describe('revert error handling', function() {
    var errorListener = jasmine.createSpy('onSequenceError');
    var seq;

    beforeEach(function() {
      errorListener.reset();
      seq = new os.command.SequenceCommand();
      seq.listen(os.command.EventType.REVERTED, errorListener);
      os.command.MockCommand.value = 0;
      os.command.MockCommandString.str = '';
    });

    afterEach(function() {
      expect(errorListener.calls.length).toEqual(1);
      expect(errorListener.mostRecentCall.args[0].type).toBe(os.command.EventType.REVERTED);
      expect(errorListener.mostRecentCall.args[0].target).toBe(seq);
      expect(seq.state).toBe(os.command.State.ERROR);
      os.command.MockCommand.value = 0;
      os.command.MockCommandString.str = '';
    });

    it('stops reverting when a sync sub-command fails fast', function() {
      var commands = [
        new os.command.MockCommand(),
        new os.command.MockCommand(),
        new os.command.MockCommand()
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
        new os.command.MockCommand(),
        new os.command.MockCommand(),
        new os.command.MockCommand()
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
        new os.command.MockCommand(),
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand()
      ];
      spyOn(commands[2], 'revert').andCallThrough();
      spyOn(commands[1], 'revert').andReturn(false);
      spyOn(commands[0], 'revert').andCallThrough();
      seq.setCommands(commands);

      runs(function() {
        expect(seq.execute()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== os.command.State.EXECUTING && os.command.MockCommand.value == 3;
      }, 'sequence to execute');

      runs(function() {
        expect(seq.revert()).toBe(true);
      });

      waitsFor(function() {
        return seq.state === os.command.State.ERROR && os.command.MockCommand.value == 2;
      }, 'sequence to revert');

      runs(function() {
        expect(commands[0].revert).not.toHaveBeenCalled();
      });
    });

    it('stops reverting when an async sub-command fails fast', function() {
      var commands = [
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand()
      ];
      spyOn(commands[2], 'revert').andCallThrough();
      spyOn(commands[1], 'revert').andReturn(false);
      spyOn(commands[0], 'revert').andCallThrough();
      seq.setCommands(commands);

      runs(function() {
        expect(seq.execute()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== os.command.State.EXECUTING && os.command.MockCommand.value == 3;
      }, 'sequence to execute');

      runs(function() {
        expect(seq.revert()).toBe(true);
      });

      waitsFor(function() {
        return seq.state === os.command.State.ERROR && os.command.MockCommand.value == 2;
      }, 'sequence to revert');

      runs(function() {
        expect(commands[0].revert).not.toHaveBeenCalled();
      });
    });

    it('stops reverting when an async sub-command throws an error', function() {
      var commands = [
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand()
      ];
      spyOn(commands[2], 'revert').andCallThrough();
      spyOn(commands[1], 'revert').andThrow('revert error');
      spyOn(commands[0], 'revert').andCallThrough();
      seq.setCommands(commands);

      runs(function() {
        expect(seq.execute()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== os.command.State.EXECUTING && os.command.MockCommand.value == 3;
      }, 'sequence to execute');

      runs(function() {
        expect(seq.revert()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== os.command.State.REVERTING && os.command.MockCommand.value == 2;
      }, 'sequence to revert');

      runs(function() {
        expect(commands[0].revert).not.toHaveBeenCalled();
      });
    });

    it('stops reverting when an async sub-command reverts with error state', function() {
      var commands = [
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand(),
        new os.command.AsyncMockCommand()
      ];
      spyOn(commands[2], 'revert').andCallThrough();
      spyOn(commands[1], 'revert').andCallFake(function() {
        goog.Timer.callOnce(function() {
          this.state = os.command.State.ERROR;
          this.dispatchEvent(new goog.events.Event(os.command.EventType.REVERTED));
        }, 100, this);
        return true;
      });
      spyOn(commands[0], 'revert').andCallThrough();
      seq.setCommands(commands);

      runs(function() {
        expect(seq.execute()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== os.command.State.EXECUTING && os.command.MockCommand.value == 3;
      }, 'sequence to execute');

      runs(function() {
        expect(seq.revert()).toBe(true);
      });

      waitsFor(function() {
        return seq.state !== os.command.State.REVERTING;
      }, 'sequence to revert');

      runs(function() {
        expect(commands[0].revert).not.toHaveBeenCalled();
      });
    });

  });

});
