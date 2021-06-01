goog.require('goog.array');
goog.require('goog.events.Event');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.ActionManager');
goog.require('os.ui.action.EventType');

describe('os.ui.action.ActionManager', function() {
  const googArray = goog.module.get('goog.array');
  const GoogEvent = goog.module.get('goog.events.Event');
  const Action = goog.module.get('os.ui.action.Action');
  const ActionManager = goog.module.get('os.ui.action.ActionManager');
  const EventType = goog.module.get('os.ui.action.EventType');

  var player = new ActionManager();

  it('supports adding and getting actions', function() {
    player.addAction(new Action('play')
        .enableWhen((currentState) => currentState && currentState != 'playing'));
    player.addAction(new Action('pause')
        .enableWhen((currentState) => currentState == 'playing'));
    player.addAction(new Action('stop')
        .enableWhen((currentState) => currentState in {playing: 1, paused: 1}));
    expect(player.getAction('play').getEventType()).toBe('play');
    expect(player.getAction('pause').getEventType()).toBe('pause');
    expect(player.getAction('stop').getEventType()).toBe('stop');
    expect(player.getAction('rewind')).toBeNull();
    expect(player.getAction(null)).toBeNull();
  });

  it('supports an action args object', function() {
    var play = player.getAction('play');
    spyOn(play, 'isEnabled').andCallThrough();
    player.withActionArgs('testArgsObject').invoke('play');
    expect(play.isEnabled.calls.length).toEqual(1);
    expect(play.isEnabled.mostRecentCall.args).toEqual(['testArgsObject']);
    expect(player.getActionArgs()).toEqual('testArgsObject');
  });

  it('supports an action args function', function() {
    var play = player.getAction('play');
    spyOn(play, 'isEnabled').andCallThrough();
    player.withActionArgs(() => 'testArgsFunction').invoke('play');
    expect(play.isEnabled.calls.length).toEqual(1);
    expect(play.isEnabled.mostRecentCall.args).toEqual(['testArgsFunction']);
    expect(player.getActionArgs()).toEqual('testArgsFunction');
  });

  it('detects infinite recursion in getActionArgs()', function() {
    var callCount = 0;
    var actionArgs = function() {
      if (callCount > 1) {
        return null;
      }
      callCount++;
      return this.getActionArgs();
    };
    var am = new ActionManager().withActionArgs(actionArgs);
    try {
      am.getActionArgs();
    } catch (e) {
      return;
    }
    expect(callCount).toEqual(1);
    expect(e).not.toBeNull();
  });

  it('removes disabled actions from enabled list after refresh', function() {
    player.withActionArgs('playing').refreshEnabledActions();
    var enabled = player.getEnabledActions();
    expect(enabled.length).toBe(2);
    expect(enabled).toContain(player.getAction('pause'));
    expect(enabled).toContain(player.getAction('stop'));
    player.withActionArgs('paused').refreshEnabledActions();
    enabled = player.getEnabledActions();
    expect(enabled.length).toBe(2);
    expect(enabled).toContain(player.getAction('play'));
    expect(enabled).toContain(player.getAction('stop'));
  });

  it('returns the enabled actions after refresh', function() {
    var actions = player.withActionArgs('stopped').refreshEnabledActions();
    expect(actions.length).toEqual(1);
    expect(actions[0].getEventType()).toEqual('play');
  });

  it('fires ENABLED_ACTIONS_CHANGED when the available actions refresh', function() {
    var actionsChanged = jasmine.createSpy('actionsChanged');
    player.listenOnce(EventType.ENABLED_ACTIONS_CHANGED, actionsChanged);
    player.withActionArgs('playing').refreshEnabledActions();
    expect(actionsChanged.calls.length).toEqual(1);
    expect(actionsChanged.calls[0].args[0] instanceof GoogEvent).toBe(true);
  });

  it('does not fire ENABLED_ACTIONS_CHANGED when the available actions refresh but do not change', function() {
    var actionsChanged = jasmine.createSpy('actionsChanged');
    player.listenOnce(EventType.AVAILABLE_ACTIONS_CHANGED, actionsChanged);
    player.refreshEnabledActions();
    expect(actionsChanged.calls.length).toEqual(0);
  });

  it('dispatches the action event type to invoke an action', function() {
    var actionInvoked = jasmine.createSpy('actionInvoked');
    player.listen(player.getAction('stop').getEventType(), actionInvoked);
    player.invoke('stop');
    expect(actionInvoked.calls.length).toEqual(1);
    var event = actionInvoked.mostRecentCall.args[0];
    expect(event instanceof GoogEvent).toBe(true);
    expect(event.type).toEqual('stop');
    player.invoke(player.getAction('stop'));
    expect(actionInvoked.calls.length).toEqual(2);
    event = actionInvoked.mostRecentCall.args[0];
    expect(event instanceof GoogEvent).toBe(true);
    expect(event.type).toEqual('stop');
  });

  it('supports adding an action listener with an action', function() {
    var actionInvoked = jasmine.createSpy('actionInvoked');
    player.addAction(new Action('test'), actionInvoked);
    player.invoke('test');
    expect(actionInvoked.calls.length).toEqual(1);
    expect(actionInvoked.mostRecentCall.args[0].type).toEqual('test');
  });

  it('uses the handler on an action if available', function() {
    var rewind = new Action('rewind').handleWith(jasmine.createSpy('rewindHandler'));
    player.addAction(rewind);
    player.invoke('rewind');
    expect(player.getListener('rewind', rewind.getHandler(), false, rewind).listener).toBe(rewind.getHandler());
    expect(rewind.getHandler().calls.length).toEqual(1);
    expect(rewind.getHandler().mostRecentCall.args[0].type).toEqual('rewind');
  });

  it('replaces an existing action when adding an action of the same event type', function() {
    var dupListener = jasmine.createSpy('dupListener');
    var dup1Handler = jasmine.createSpy('dup1Handler');
    var dup1 = new Action('dup', 'dup 1').handleWith(dup1Handler);
    player.listen('dup', dupListener, false, dup1);
    player.addAction(dup1);
    expect(player.getAction('dup').getTitle()).toEqual('dup 1');
    expect(player.getListener('dup', dup1Handler, false, dup1).listener).toBe(dup1Handler);
    expect(player.getListener('dup', dupListener, false, dup1).listener).toBe(dupListener);

    var dup2 = new Action('dup', 'dup 2');
    player.addAction(dup2);
    expect(player.getAction('dup').getTitle()).toEqual('dup 2');
    expect(player.getListener('dup', dup1Handler, false, dup1)).toBeNull();
    expect(player.getListener('dup', dupListener, false, dup1).listener).toBe(dupListener);
  });

  it('starts with the correct enabled state when action args are initialized', function() {
    var am = new ActionManager().withActionArgs(['a', 'c']);
    am.addAction(new Action('a').enableWhen((args) => googArray.indexOf(args, 'a') > -1));
    am.addAction(new Action('b').enableWhen((args) => googArray.indexOf(args, 'b') > -1));
    am.addAction(new Action('c').enableWhen((args) => googArray.indexOf(args, 'c') > -1));
    var enabled = am.getEnabledActions();
    expect(enabled.length).toBe(2);
    expect(enabled).toContain(am.getAction('a'));
    expect(enabled).toContain(am.getAction('c'));
  });
});
