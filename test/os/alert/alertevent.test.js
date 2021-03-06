goog.require('os.alert.AlertEvent');
goog.require('os.alert.AlertEventSeverity');

describe('os.alert.AlertEvent', function() {
  const AlertEvent = goog.module.get('os.alert.AlertEvent');
  const AlertEventSeverity = goog.module.get('os.alert.AlertEventSeverity');

  const msg = 'This is a test';

  it('should fully describe alert events', function() {
    const evt = new AlertEvent(msg, AlertEventSeverity.INFO);

    expect(evt.getMessage()).toBe(msg);
    expect(evt.getSeverity()).toBe(AlertEventSeverity.INFO);
    expect(evt.getLimit()).toBe(AlertEvent.DEFAULT_LIMIT);
    expect(evt.getDismissDispatcher()).toBe(null);
    expect(evt.getCount()).toBe(1);
  });
});
