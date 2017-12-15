goog.require('os.job.Job');
goog.require('os.job.JobEventType');
goog.require('os.job.JobState');


xdescribe('os.job.Job', function() {
  var testJob;
  var jobName = 'Karma Job';
  var jobDetails = 'This is a boring job designed to test basic features.';

  var executing = false;
  var complete = false;
  var paused = false;
  var counter = 0;
  var onChange = function() {
    switch (this.state) {
      case os.job.JobState.EXECUTING:
        executing = true;
        break;
      case os.job.JobState.COMPLETE:
        complete = true;
        break;
      case os.job.JobState.PAUSED:
        paused = true;
        break;
      default:
        break;
    }

    counter++;
  };

  beforeEach(function() {
    executing = false;
    complete = false;
    paused = false;
    counter = 0;

    testJob = new os.job.Job('/base/test/os/job/job.test.worker.js', jobName, jobDetails);
    testJob.listen(os.job.JobEventType.CHANGE, onChange, false, testJob);

    expect(testJob.getName()).toBe(jobName);
    expect(testJob.getDetails()).toBe(jobDetails);
    expect(testJob.executionTime).toBe(0);
  });

  it('should execute a basic job, checking the execution timer', function() {
    testJob.startExecution(2000);

    waitsFor(function() {
      return counter > 1;
    }, 'Job to to transition through executing/complete states');

    runs(function() {
      testJob.unlisten(os.job.JobEventType.CHANGE, onChange, false, testJob);
      expect(executing).toBe(true);
      expect(complete).toBe(true);
      expect(paused).toBe(false);
      expect(testJob.executionTime).not.toBe(0);
      expect(testJob.state).toBe(os.job.JobState.COMPLETE);
    });
  });

  it('should start, pause, resume and stop a basic job', function() {
    runs(function() {
      testJob.startExecution();
      testJob.pauseExecution();
      testJob.startExecution();
      testJob.stopExecution();
    });

    waitsFor(function() {
      return counter > 3;
    }, 'Job to enter executing > paused > executing > stopped states');

    runs(function() {
      testJob.unlisten(os.job.JobEventType.CHANGE, onChange, false, testJob);
      expect(executing).toBe(true);
      expect(complete).toBe(false);
      expect(paused).toBe(true);
      expect(testJob.state).toBe(os.job.JobState.STOPPED);
    });
  });
});
