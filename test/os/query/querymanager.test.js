goog.require('os.data.event.DataEvent');
goog.require('os.data.DataManager');
goog.require('os.mock');
goog.require('ol.Feature');
goog.require('ol.geom.Polygon');



/**
 * Mock query handler
 * @param {string} id
 * @constructor
 */
os.query.Handler = function(id) {
  this.id = id;
};


/**
 * @return {?}
 */
os.query.Handler.prototype.getLayerId = function() {
  return this.id;
};


/**
 * @return {?}
 */
os.query.Handler.prototype.getLayerName = function() {
  return this.id;
};

describe('os.query.QueryManager', function() {
  var am, qm;
  beforeEach(function() {
    am = os.areaManager;
    qm = os.queryManager;

    spyOn(os.queryManager, 'save');
    spyOn(os.queryManager, 'load');
    spyOn(os.areaManager, 'save');
    spyOn(os.areaManager, 'load');
    spyOn(os.areaManager, 'updateStyles_');
  });

  it('should start from scratch', function() {
    // start from scratch
    qm.removeEntries();
    qm.handlers.length = 0;
    expect(qm.entries.length).toBe(0);
  });

  it('should respond to source remove events', function() {
    var id = 'A';
    var handlerA = new os.query.Handler(id);
    qm.registerHandler(handlerA);
    expect(qm.handlers.length).toBe(1);

    var dm = os.dataManager;
    var mockSource = {
      getId: function() {
        return id;
      }
    };
    dm.dispatchEvent(new os.data.event.DataEvent(os.data.event.DataEventType.SOURCE_REMOVED, mockSource));
    expect(qm.handlers.length).toBe(0);
  });
});
