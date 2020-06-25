goog.require('goog.events.EventTarget');
goog.require('os.alert.AlertEvent');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.structs.EventType');

describe('os.alert.AlertManager', function() {
  let alertManager = new os.alert.AlertManager();
  let waitTime = os.alert.AlertManager.DEFAULT_THROTTLE_TIME + 250;

  it('should handle alerts and and add them to its buffer', function() {
    const alert1 = 'test alert';
    const alert2 = 'test alert 2';

    expect(alertManager.getAlerts().getCount()).toBe(0);

    alertManager.sendAlert(alert1).then(() => {
      expect(alertManager.getAlerts().getCount()).toBe(1);
      expect(alertManager.getAlerts().getLast().getMessage()).toBe('test alert');

      alertManager.sendAlert(alert2).then(() => {
        expect(alertManager.getAlerts().getCount()).toBe(2);
        expect(alertManager.getAlerts().getLast().getMessage()).toBe('test alert 2');
      });
    });
  });

  it('should be able to reset the number of new alerts and elements in the buffer', function() {
    const am = new os.alert.AlertManager();
    const alert1 = 'test alert';
    am.sendAlert(alert1).then(() => {
      expect(am.getAlerts().getCount()).toBe(1);
      am.clearAlerts();
      expect(am.getAlerts().getCount()).toBe(0);
    });
  });

  it('should dispatch alert messages', function() {
    const am = new os.alert.AlertManager();
    const alert3 = 'alert3';
    let msg = '';
    am.listenOnce(os.structs.EventType.ALERT, function(e) {
      msg = e.getMessage();
      expect(msg).toBe(alert3);
    }, false, this);
    am.sendAlert(alert3);
  });

  it('should attach severities and times to alerts', function() {
    const am = new os.alert.AlertManager();
    const alert4 = 'test alert 4';

    am.sendAlert(alert4, os.alert.AlertEventSeverity.WARNING).then(() => {
      expect(am.getAlerts().getLast().getTime()).not.toBe(null);
      expect(am.getAlerts().getLast().getSeverity()).toBe(os.alert.AlertEventSeverity.WARNING);
    });
  });

  it('should process missed alerts', function() {
    const am = new os.alert.AlertManager();
    const clientId = 'testalertclient';

    const callback = {
      handleAlert: function () {
      }
    };
    spyOn(callback, 'handleAlert');

    const promises = [];
    promises.push(am.sendAlert('alert1'));
    promises.push(am.sendAlert('alert2'));
    Promise.all(promises).then((resolve, reject) => {
      // handle missed
      am.processMissedAlerts(clientId, callback.handleAlert);
      expect(callback.handleAlert.calls.length).toBe(2);

      // try again and should have no more
      am.processMissedAlerts(clientId, callback.handleAlert);
      expect(callback.handleAlert.calls.length).toBe(2);

      // one more alert
      am.sendAlert('alert3').then(() => {
        // subsequent calls to processMissedAlerts should be ignored
        am.processMissedAlerts(clientId, callback.handleAlert);
        expect(callback.handleAlert.calls.length).toBe(2);
      });
    });
  });

  it('should optionally log alerts', function() {
    // mock up a logger
    const MockLogger = function () {
      this.records = [];
      this.any = function (severity, message, opt_exception) {
        this.records.push({
          level: severity,
          msg: message,
          exception: opt_exception
        });
      };

      this.info = function (message, e) {
        this.any(os.alert.AlertEventSeverity.INFO, message, e);
      };

      this.warning = function (message, e) {
        this.any(os.alert.AlertEventSeverity.WARNING, message, e);
      };

      this.severe = function (message, e) {
        this.any(os.alert.AlertEventSeverity.ERROR, message, e);
      };
    };

    const am = new os.alert.AlertManager();
    const logger = new MockLogger();
    const promises = [];

    for (let key in os.alert.AlertEventSeverity) {
      promises.push(am.sendAlert('alert', os.alert.AlertEventSeverity[key], logger));
    }

    Promise.all(promises).then(() => {
      // 4 unique alerts
      expect(logger.records.length).toBe(4);
      expect(logger.records.filter((r) => r.level.name  === os.alert.AlertEventSeverity.INFO.name).length).toBe(2);
      expect(logger.records.filter((r) => r.level.name  === os.alert.AlertEventSeverity.WARNING.name).length).toBe(1);
      expect(logger.records.filter((r) => r.level.name  === os.alert.AlertEventSeverity.ERROR.name).length).toBe(1);
    });

    const am2 = new os.alert.AlertManager();
    const logger2 = new MockLogger();
    const promises2 = [];

    for (let key in os.alert.AlertEventSeverity) {
      if (os.alert.AlertEventSeverity[key] === os.alert.AlertEventSeverity.WARNING) {
        promises2.push(am2.sendAlert(`${key} alert`, os.alert.AlertEventSeverity[key], logger2));
        promises2.push(am2.sendAlert(`${key} alert`, os.alert.AlertEventSeverity[key], logger2));
      } else if (os.alert.AlertEventSeverity[key] === os.alert.AlertEventSeverity.ERROR) {
        promises2.push(am2.sendAlert(`${key} alert`, os.alert.AlertEventSeverity[key], logger2));
      } else {
        promises2.push(am2.sendAlert(`${key} alert`, os.alert.AlertEventSeverity[key], logger2));
        promises2.push(am2.sendAlert(`${key} alert`, os.alert.AlertEventSeverity[key], logger2));
        promises2.push(am2.sendAlert(`${key} alert`, os.alert.AlertEventSeverity[key], logger2));
      }
    }

    Promise.all(promises2).then(() => {
      expect(logger2.records.filter((r) => r.level.name === os.alert.AlertEventSeverity.INFO.name).length).toBe(2);
      expect(logger2.records.filter((r) => r.level.name === os.alert.AlertEventSeverity.INFO.name &&
          r.msg.indexOf(' (6)')).length).toBeGreaterThan(-1);
      expect(logger2.records.filter((r) => r.level.name === os.alert.AlertEventSeverity.WARNING.name).length).toBe(1);
      expect(logger2.records.filter((r) => r.level.name === os.alert.AlertEventSeverity.WARNING.name &&
          r.msg.indexOf(' (2)')).length).toBeGreaterThan(-1);
      expect(logger2.records.filter((r) => r.level.name === os.alert.AlertEventSeverity.ERROR.name).length).toBe(1);
      expect(logger2.records.filter((r) => r.level.name === os.alert.AlertEventSeverity.ERROR.name &&
          r.msg.match(/\s+\(\d+\)$/)).length).toBe(0);
    });
  });

  it('should throttle duplicate alerts', function() {
    const am = new os.alert.AlertManager();
    // Throttle duplicate alerts.
    const alert4 = 'alert 4';
    const promises = [];

    promises.push(am.sendAlert(alert4));
    promises.push(am.sendAlert(alert4));
    Promise.all(promises).then(() => {
      expect(am.getAlerts().getLast().getCount()).toBe(2);
      expect(am.getAlerts().getCount()).toBe(1);
    });
  });

  it('should not throttle different alerts', function() {
    const am = new os.alert.AlertManager();
    // Different alerts. No throttle.
    const alert5 = 'alert 5';
    const alert6 = 'alert 6';
    const promises = [];

    promises.push(am.sendAlert(alert5));
    promises.push(am.sendAlert(alert6));
    Promise.all(promises).then(() => {
      const last = am.getAlerts().getLast();
      expect(last.getMessage()).toBe(alert6);
      expect(last.getCount()).toBe(1);
      expect(am.getAlerts().getCount()).toBe(2);
    });
  });

  it('should send a duplicate alert after the throttle interval', function() {
    const am = new os.alert.AlertManager();
    // Alert can be sent after throttle interval.
    const alert7 = 'alert 7';
    am.sendAlert(alert7).then(() => {
      let last = am.getAlerts().getLast();
      expect(last.getMessage()).toBe(alert7);
      expect(last.getCount()).toBe(1);

      am.sendAlert(alert7).then(() => {
        last = am.getAlerts().getLast();
        expect(last.getMessage()).toBe(alert7);
        expect(last.getCount()).toBe(1);
        expect(am.getAlerts().getCount()).toBe(2);
      });
    });
  });

  it('should allow unthrottled alerts', function() {
    const am = new os.alert.AlertManager();
    const alert8 = 'alert 8';

    am.sendAlert(alert8, undefined, undefined, undefined, undefined, 0);
    am.sendAlert(alert8, undefined, undefined, undefined, undefined, 0);
    const last = am.getAlerts().getLast();
    expect(last.getMessage()).toBe(alert8);
    expect(last.getCount()).toBe(1);
    expect(am.getAlerts().getCount()).toBe(2);
  });
});
