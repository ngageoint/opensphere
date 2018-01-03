goog.require('mock.thread.Job');
goog.require('os.thread.EventType');
goog.require('os.thread.Thread');


describe('os.thread.Thread', function() {
  var clock;

  beforeEach(function() {
    clock = lolex.install();
    goog.Timer.defaultTimerObject = clock;
  });

  afterEach(function() {
    clock.uninstall();
    goog.Timer.defaultTimerObject = window;
  });

  it('should execute properly', function() {
    var job = new mock.thread.Job();
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

    t.start();
    clock.tick(job.total * 5);

    expect(count.threadStart).toBe(1);
    expect(count.threadProgress).toBe(3);
    expect(count.threadComplete).toBe(1);
    // job should not be disposed
    expect(job.isDisposed()).toBe(false);
  });

  it('should stop when told', function() {
    var job = new mock.thread.Job();
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

    t.start();
    clock.tick((job.total - 1) * 5);
    t.stop();
    clock.tick(5);
    expect(count.threadStart).toBe(1);
    expect(count.threadProgress).toBe(2);
    expect(count.threadComplete).toBe(0);
  });
});
