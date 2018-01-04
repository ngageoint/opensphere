goog.require('mock.thread.Job');
goog.require('os.thread.EventType');
goog.require('os.thread.Thread');


describe('os.thread.Thread', function() {
  var clock = lolex.createClock();

  beforeEach(function() {
    goog.Timer.defaultTimerObject = clock;
    clock.reset();
    spyOn(goog, 'now').andReturn(clock.now);
  });

  afterEach(function() {
    goog.Timer.defaultTimerObject = window;
  });

  it('should execute properly', function() {
    expect(goog.Timer.defaultTimerObject).toBe(clock);

    var job = new mock.thread.Job(clock);
    spyOn(job, 'executeNext').andCallThrough();
    var t = new os.thread.Thread(job);

    var count = {
      threadStart: 0,
      threadProgress: 0,
      threadComplete: 0
    };

    var listener = function(e) {
      count[e.type]++;
    };

    t.listen(os.thread.EventType.START, listener);
    t.listen(os.thread.EventType.PROGRESS, listener);
    t.listen(os.thread.EventType.COMPLETE, listener);

    expect(Object.keys(clock.timers).length).toBe(0);
    t.start();
    expect(Object.keys(clock.timers).length).toBe(1);
    clock.next();

    expect(job.executeNext.calls.length).toBe(1);
    expect(count.threadStart).toBe(1);
    expect(count.threadProgress).toBe(1);
    expect(count.threadComplete).toBe(0);

    clock.next();

    expect(job.executeNext.calls.length).toBe(2);
    expect(count.threadStart).toBe(1);
    expect(count.threadProgress).toBe(2);
    expect(count.threadComplete).toBe(0);

    clock.next();

    expect(job.executeNext.calls.length).toBe(3);
    expect(count.threadStart).toBe(1);
    expect(count.threadProgress).toBe(3);
    expect(count.threadComplete).toBe(1);

    clock.next();

    expect(job.executeNext.calls.length).toBe(3);
    expect(count.threadStart).toBe(1);
    expect(count.threadProgress).toBe(3);
    expect(count.threadComplete).toBe(1);

    expect(job.isDisposed()).toBe(false);
    expect(t.isDisposed()).toBe(false);
    t.dispose();
    expect(job.isDisposed()).toBe(false);
    expect(t.isDisposed()).toBe(true);
    expect(Object.keys(clock.timers).length).toBe(0);
  });

  it('should stop when told', function() {
    expect(goog.Timer.defaultTimerObject).toBe(clock);

    var job = new mock.thread.Job(clock);
    spyOn(job, 'executeNext').andCallThrough();
    var t = new os.thread.Thread(job);

    var count = {
      threadStart: 0,
      threadProgress: 0,
      threadComplete: 0
    };

    var listener = function(e) {
      count[e.type]++;
    };

    t.listen(os.thread.EventType.START, listener);
    t.listen(os.thread.EventType.PROGRESS, listener);
    t.listen(os.thread.EventType.COMPLETE, listener);

    expect(Object.keys(clock.timers).length).toBe(0);
    t.start();
    expect(Object.keys(clock.timers).length).toBe(1);
    clock.next();
    expect(job.executeNext.calls.length).toBe(1);
    clock.next();
    expect(job.executeNext.calls.length).toBe(2);
    t.stop();
    expect(Object.keys(clock.timers).length).toBe(0);
    clock.next();
    expect(job.executeNext.calls.length).toBe(2);

    expect(count.threadStart).toBe(1);
    expect(count.threadProgress).toBe(2);
    expect(count.threadComplete).toBe(0);

    // job should not be disposed
    expect(job.isDisposed()).toBe(false);
    job.dispose();
    expect(Object.keys(clock.timers).length).toBe(0);
  });
});
