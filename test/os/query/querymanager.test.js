goog.require('os.data.DataManager');
goog.require('os.data.event.DataEvent');
goog.require('os.data.event.DataEventType');
goog.require('os.mock');
goog.require('os.query.AreaManager');
goog.require('os.query.MockHandler');
goog.require('os.query.QueryManager');


describe('os.query.QueryManager', function() {
  const DataManager = goog.module.get('os.data.DataManager');
  const DataEvent = goog.module.get('os.data.event.DataEvent');
  const DataEventType = goog.module.get('os.data.event.DataEventType');
  const AreaManager = goog.module.get('os.query.AreaManager');
  const QueryManager = goog.module.get('os.query.QueryManager');

  const {MockHandler} = goog.module.get('os.query.MockHandler');

  var am;
  var qm;

  beforeEach(function() {
    am = AreaManager.getInstance();
    qm = QueryManager.getInstance();

    spyOn(qm, 'save');
    spyOn(qm, 'load');
    spyOn(am, 'save');
    spyOn(am, 'load');
    spyOn(am, 'updateStyles_');
  });

  it('should start from scratch', function() {
    // start from scratch
    qm.removeEntries();
    qm.handlers.length = 0;
    expect(qm.entries.length).toBe(0);
  });

  it('should respond to source remove events', function() {
    var id = 'A';
    var handlerA = new MockHandler(id);
    qm.registerHandler(handlerA);
    expect(qm.handlers.length).toBe(1);

    var dm = DataManager.getInstance();
    var mockSource = {
      getId: function() {
        return id;
      }
    };
    dm.dispatchEvent(new DataEvent(DataEventType.SOURCE_REMOVED, mockSource));
    expect(qm.handlers.length).toBe(0);
  });
});
