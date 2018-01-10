goog.provide('mock.thread.Job');
goog.require('os.thread.IThreadJob');



/**
 * A mock job for testing threads
 * @implements {os.thread.IThreadJob}
 * @param {?} clock The lolex clock
 * @constructor
 */
mock.thread.Job = function(clock) {
  this.clock = clock;
  this.loaded = 0;
  this.total = 3;
  this.disposed = false;
  this.count = 0;
};
goog.inherits(mock.thread.Job, goog.Disposable);


/**
 * @inheritDoc
 */
mock.thread.Job.prototype.executeNext = function() {
  if (this.loaded < this.total) {
    // pretend this takes 10ms
    this.clock.setSystemTime(this.clock.now + 10);
    this.loaded++;
  }

  return this.loaded === this.total;
};


/**
 * @inheritDoc
 */
mock.thread.Job.prototype.getLoaded = function() {
  return this.loaded;
};


/**
 * @inheritDoc
 */
mock.thread.Job.prototype.getTotal = function() {
  return this.total;
};
