goog.require('os.thread.EventType');
goog.require('os.thread.Thread');
goog.require('mock.thread.Job');


describe('os.thread.Thread', function() {
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

    runs(function() {
      t.start();
    });

    waitsFor(function() {
      return count.threadComplete === 1;
    }, 'thread start and completion');

    runs(function() {
      expect(count.threadStart).toBe(1);
      expect(count.threadProgress).toBe(3);
      expect(count.threadComplete).toBe(1);
      // job should not be disposed
      expect(job.isDisposed()).toBe(false);
    });
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

    runs(function() {
      t.start();
    });

    waitsFor(function() {
      return count.threadProgress === 2;
    }, 'thread to get going');

    runs(function() {
      t.stop();
      expect(count.threadStart).toBe(1);
      expect(count.threadProgress).toBe(2);
      expect(count.threadComplete).toBe(0);
    });
  });
});
