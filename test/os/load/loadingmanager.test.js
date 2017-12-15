goog.require('os.load.LoadingManager');


describe('os.load.LoadingManager', function() {
  it('should be able to add loading tasks', function() {
    var lm = new os.load.LoadingManager();
    expect(lm.getLoading()).toBe(false);
    expect(lm.getLoadingCount()).toBe(0);

    // add a task and verify the state of the manager
    lm.addLoadingTask('testId', 'testTitle', true);
    expect(lm.getLoading()).toBe(true);
    expect(lm.getLoadingCount()).toBe(1);

    // verify the task that was added
    var task = lm.loadingTasks_['testId'];
    expect(task.getCount()).toBe(1);
    expect(task.getDuration() >= 0).toBe(true);
    expect(task.getCPUIntensive()).toBe(true);
    expect(task.getTitle()).toBe('testTitle');

    // add another task with the same ID and verify the counter increments
    lm.addLoadingTask('testId');
    expect(lm.getLoadingCount()).toBe(2);
    expect(task.getCount()).toBe(2);

    // add a second, separate task
    lm.addLoadingTask('testId2');
    expect(lm.getLoadingCount()).toBe(3);
    expect(task.getCount()).toBe(2);

    var task2 = lm.loadingTasks_['testId2'];
    expect(task2.getCount()).toBe(1);
  });

  it('should be able to remove loading tasks', function() {
    var lm = new os.load.LoadingManager();

    // start by adding a task
    lm.addLoadingTask('testId', 'testTitle', true);
    expect(lm.getLoading()).toBe(true);
    expect(lm.getLoadingCount()).toBe(1);

    // then remove it
    lm.removeLoadingTask('testId');
    expect(lm.getLoading()).toBe(false);
    expect(lm.getLoadingCount()).toBe(0);

    // add a few tasks
    lm.addLoadingTask('testId');
    lm.addLoadingTask('testId');
    lm.addLoadingTask('testId2');

    // verify that there are 2 testId tasks
    var task = lm.loadingTasks_['testId'];
    expect(task.getCount()).toBe(2);

    // verify the decrementing within the task
    lm.removeLoadingTask('testId');
    expect(lm.getLoading()).toBe(true);
    expect(lm.getLoadingCount()).toBe(2);
    expect(task.getCount()).toBe(1);

    // remove it entirely
    lm.removeLoadingTask('testId');
    expect(lm.getLoading()).toBe(true);
    expect(lm.getLoadingCount()).toBe(1);
    expect(lm.loadingTasks_['testId']).toBe(undefined);

    // remove the other and check that the overall state becomes false
    lm.removeLoadingTask('testId2');
    expect(lm.getLoading()).toBe(false);
    expect(lm.getLoadingCount()).toBe(0);
  });

  it('should fire events', function() {
    var lm = new os.load.LoadingManager();
    var isLoading = false;
    var addedTask, removedTask;

    var loadingListener = function(event) {
      isLoading = event.getNewValue();
    };

    var addListener = function(event) {
      addedTask = event.getTask();
    };

    var removeListener = function(event) {
      removedTask = event.getTask();
    };

    lm.listen(goog.events.EventType.PROPERTYCHANGE, loadingListener);
    lm.listen(os.load.LoadingEventType.ADD, addListener);
    lm.listen(os.load.LoadingEventType.REMOVE, removeListener);

    expect(isLoading).toBe(false);

    // add a task and check the results from the listener
    lm.addLoadingTask('testId');
    expect(addedTask).not.toBe(null);
    expect(addedTask.id).toBe('testId');
    expect(addedTask).toBe(lm.loadingTasks_['testId']);
    expect(isLoading).toBe(true);

    // remove it and check the listener results
    lm.removeLoadingTask('testId');
    expect(removedTask).not.toBe(null);
    expect(removedTask.id).toBe('testId');
    expect(isLoading).toBe(false);
  });
});
