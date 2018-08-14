goog.require('os.alert.AlertEvent');

describe('os.alert.AlertEvent', function() {
  var msg = 'This is a test';

  it('should fully describe alert events', function() {
    var evt = new os.alert.AlertEvent(msg, os.alert.AlertEventSeverity.INFO);

    expect(evt.getMessage()).toBe(msg);
    expect(evt.getSeverity()).toBe(os.alert.AlertEventSeverity.INFO);
    expect(evt.getLimit()).toBe(os.alert.AlertEvent.DEFAULT_LIMIT);
    expect(evt.getDismissDispatcher()).toBe(null);
  });
});
