goog.module('mock.thread.Job');

const Disposable = goog.require('goog.Disposable');

const IThreadJob = goog.requireType('os.thread.IThreadJob');


/**
 * A mock job for testing threads
 * @implements {IThreadJob}
 */
class Job extends Disposable {
  /**
   * Constructor.
   * @param {?} clock The lolex clock
   */
  constructor(clock) {
    super();

    this.clock = clock;
    this.loaded = 0;
    this.total = 3;
    this.disposed = false;
    this.count = 0;
  }

  /**
   * @inheritDoc
   */
  executeNext() {
    if (this.loaded < this.total) {
      // pretend this takes 10ms
      this.clock.setSystemTime(this.clock.now + 10);
      this.loaded++;
    }

    return this.loaded === this.total;
  }

  /**
   * @inheritDoc
   */
  getLoaded() {
    return this.loaded;
  }

  /**
   * @inheritDoc
   */
  getTotal() {
    return this.total;
  }
}

exports = Job;
