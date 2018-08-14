goog.require('goog.events.EventTarget');
goog.require('os.alert.AlertEvent');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.structs.EventType');

describe('os.alert.AlertManager', function() {
  var alertManager = new os.alert.AlertManager();

  it('should handle alerts and and add them to its buffer', function() {
    var alert1 = 'test alert';
    var alert2 = 'test alert 2';
    expect(alertManager.getAlerts().getCount()).toBe(0);

    alertManager.sendAlert(alert1);
    expect(alertManager.getAlerts().getCount()).toBe(1);
    expect(alertManager.getAlerts().getLast().getMessage()).toBe('test alert');
    alertManager.sendAlert(alert2);
    expect(alertManager.getAlerts().getCount()).toBe(2);
    expect(alertManager.getAlerts().getLast().getMessage()).toBe('test alert 2');
  });

  it('should dispatch alert messages', function() {
    var msg = '';
    alertManager.listenOnce(os.structs.EventType.ALERT, function(e) {
      msg = e.getMessage();
      expect(msg).toBe('alert3');
    }, false, this);
    var alert3 = 'alert3';
    alertManager.sendAlert(alert3);
  });

  it('should attach severities and times to alerts', function() {
    var alert4 = 'test alert 4';
    alertManager.sendAlert(alert4, os.alert.AlertEventSeverity.WARNING);
    expect(alertManager.getAlerts().getLast().getTime()).not.toBe(null);
    expect(alertManager.getAlerts().getLast().getSeverity()).toBe(os.alert.AlertEventSeverity.WARNING);
  });

  it('should be able to reset the number of new alerts and elements in the buffer', function() {
    expect(alertManager.getAlerts().getCount()).toBe(4);
    alertManager.clearAlerts();
    expect(alertManager.getAlerts().getCount()).toBe(0);
  });

  it('should process misssed alerts', function() {
    var clientId = 'testalertclient';
    var am = new os.alert.AlertManager();

    var callback = {
      handleAlert: function() {}
    };
    spyOn(callback, 'handleAlert');

    am.sendAlert('alert1');
    am.sendAlert('alert2');

    // handle missed
    am.processMissedAlerts(clientId, callback.handleAlert);
    expect(callback.handleAlert.calls.length).toBe(2);

    // try again and should have no more
    am.processMissedAlerts(clientId, callback.handleAlert);
    expect(callback.handleAlert.calls.length).toBe(2);

    // one more alert
    am.sendAlert('alert3');

    // subsequent calls to processMissedAlerts should be ignored
    am.processMissedAlerts(clientId, callback.handleAlert);
    expect(callback.handleAlert.calls.length).toBe(2);
  });

  it('should optionally log alerts', function() {
    // mock up a logger
    var MockLogger = function() {
      this.count = 0;
      this.any = function(severity, message, opt_exception) {
        expect(severity).toBe(this.severity);
        expect(message).toBe(this.message);
        this.count++;
      };

      this.info = function(message, e) {
        this.any(os.alert.AlertEventSeverity.INFO, message, e);
      };

      this.warning = function(message, e) {
        this.any(os.alert.AlertEventSeverity.WARNING, message, e);
      };

      this.severe = function(message, e) {
        this.any(os.alert.AlertEventSeverity.ERROR, message, e);
      };

      message: 'This is a test';
      severity: null;
    };

    var am = new os.alert.AlertManager();
    var logger = new MockLogger();

    for (var key in os.alert.AlertEventSeverity) {
      logger.severity = os.alert.AlertEventSeverity[key];

      if (logger.severity === os.alert.AlertEventSeverity.SUCCESS) {
        logger.severity = os.alert.AlertEventSeverity.INFO;
      }

      am.sendAlert(logger.message, os.alert.AlertEventSeverity[key], logger);
    }

    expect(logger.count).toBeGreaterThan(0);
  });
});
