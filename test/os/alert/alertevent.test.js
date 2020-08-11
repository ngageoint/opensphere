goog.require('os.alert.AlertEvent');
goog.require('os.alert.AlertEventSeverity');

describe('os.alert.AlertEvent', function() {
  const msg = 'This is a test';

  it('should fully describe alert events', function() {
    const evt = new os.alert.AlertEvent(msg, os.alert.AlertEventSeverity.INFO);

    expect(evt.getMessage()).toBe(msg);
    expect(evt.getSeverity()).toBe(os.alert.AlertEventSeverity.INFO);
    expect(evt.getLimit()).toBe(os.alert.AlertEvent.DEFAULT_LIMIT);
    expect(evt.getDismissDispatcher()).toBe(null);
    expect(evt.getCount()).toBe(1);
  });
});
