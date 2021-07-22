goog.require('os.job.Job');
goog.require('os.job.JobEvent');
goog.require('os.job.JobEventType');
goog.require('os.job.JobManager');
goog.require('os.job.JobState');


describe('os.job.JobManager', function() {
  const JobEventType = goog.module.get('os.job.JobEventType');
  const JobManager = goog.module.get('os.job.JobManager');
  const JobState = goog.module.get('os.job.JobState');

  var jobManager;
  var job1;
  var job2;
  var jobName = 'Karma JobManager Test';
  var jobDetails = 'This is a boring job designed to test basic features.';

  beforeEach(function() {
    jobManager = new JobManager();
    job1 = jobManager.createJob('/base/test/os/job/job.test.worker.js', jobName + ' 1', jobDetails);
    expect(jobManager.getJobs().length).toBe(1);
    job2 = jobManager.createJob('/base/test/os/job/job.test.worker.js', jobName + ' 2', jobDetails);
    expect(jobManager.getJobs().length).toBe(2);
  });

  it('should execute jobs in the manager and verify they are removed on completion', function() {
    var executing = false;
    var onChange = function(event) {
      // job will be disposed on completion, so we can only capture the executing transition event directly
      var job = /** @type {Job} */ (event.target);
      switch (job.state) {
        case JobState.EXECUTING:
          executing = true;
          break;
        default:
          break;
      }
    };

    runs(function() {
      job2.listen(JobEventType.CHANGE, onChange, false, job2);
      job2.startExecution();
    });

    waitsFor(function() {
      return job2.state == JobState.COMPLETE;
    }, 'Job 2 to transition through executing/complete states');

    waitsFor(function() {
      return jobManager.getJobs().length == 1;
    }, 'Job 2 to be removed from the manager', 200);

    runs(function() {
      expect(executing).toBe(true);
      expect(job2.state).toBe(JobState.COMPLETE);

      executing = false;

      job1.listen(JobEventType.CHANGE, onChange, false, job1);
      job1.startExecution();
    });

    waitsFor(function() {
      return job1.state == JobState.COMPLETE;
    }, 'Job 1 to transition through executing/complete states');

    waitsFor(function() {
      return jobManager.getJobs().length == 0;
    }, 'Job 1 to be removed from the manager', 200);

    runs(function() {
      expect(executing).toBe(true);
      expect(job1.state).toBe(JobState.COMPLETE);
      job1.unlisten(JobEventType.CHANGE, onChange, false, job1);
    });
  });
});
