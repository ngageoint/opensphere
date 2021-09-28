goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Level');
goog.require('goog.log.LogBuffer');
goog.require('goog.log.LogRecord');
goog.require('os.alert.AlertEvent');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.structs.EventType');

describe('os.alert.AlertManager', function() {
  const log = goog.module.get('goog.log');
  const Level = goog.module.get('goog.log.Level');
  const LogBuffer = goog.module.get('goog.log.LogBuffer');
  const LogRecord = goog.module.get('goog.log.LogRecord');
  const {default: AlertEventSeverity} = goog.module.get('os.alert.AlertEventSeverity');
  const {default: AlertManager} = goog.module.get('os.alert.AlertManager');
  const {default: EventType} = goog.module.get('os.structs.EventType');

  const loggerName = 'os.alert.AlertManagerTest';
  const logger = log.getLogger(loggerName);

  const alertManager = new AlertManager();

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
    const am = new AlertManager();
    const alert1 = 'test alert';
    am.sendAlert(alert1).then(() => {
      expect(am.getAlerts().getCount()).toBe(1);
      am.clearAlerts();
      expect(am.getAlerts().getCount()).toBe(0);
    });
  });

  it('should dispatch alert messages', function() {
    const am = new AlertManager();
    const alert3 = 'alert3';
    let msg = '';
    am.listenOnce(EventType.ALERT, function(e) {
      msg = e.getMessage();
      expect(msg).toBe(alert3);
    }, false, this);
    am.sendAlert(alert3);
  });

  it('should attach severities and times to alerts', function() {
    const am = new AlertManager();
    const alert4 = 'test alert 4';

    am.sendAlert(alert4, AlertEventSeverity.WARNING).then(() => {
      expect(am.getAlerts().getLast().getTime()).not.toBe(null);
      expect(am.getAlerts().getLast().getSeverity()).toBe(AlertEventSeverity.WARNING);
    });
  });

  it('should process missed alerts', function() {
    const am = new AlertManager();
    const clientId = 'testalertclient';

    const callback = {
      handleAlert: function() {
      }
    };
    spyOn(callback, 'handleAlert');

    let alertsSent = false;

    runs(() => {
      Promise.all([
        am.sendAlert('alert1'),
        am.sendAlert('alert2')
      ]).then((resolve, reject) => {
        alertsSent = true;
      });
    });

    waitsFor(() => alertsSent, 'alerts to be sent');

    runs(() => {
      // handle missed
      am.processMissedAlerts(clientId, callback.handleAlert);
      expect(callback.handleAlert.calls.length).toBe(2);

      // try again and should have no more
      am.processMissedAlerts(clientId, callback.handleAlert);
      expect(callback.handleAlert.calls.length).toBe(2);

      alertsSent = false;

      // one more alert
      am.sendAlert('alert3').then(() => {
        alertsSent = true;
      });
    });

    waitsFor(() => alertsSent, 'third alert to be sent');

    runs(() => {
      // subsequent calls to processMissedAlerts should be ignored
      am.processMissedAlerts(clientId, callback.handleAlert);
      expect(callback.handleAlert.calls.length).toBe(2);
    });
  });

  it('should optionally log alerts', function() {
    const logRecords = [];
    let alertsSent = false;

    const logBuffer = LogBuffer.getInstance();
    spyOn(logBuffer, 'addRecord').andCallFake((level, msg, name) => {
      logRecords.push(new LogRecord(level, msg, name));
    });

    const am = new AlertManager();

    runs(() => {
      const promises = [];

      for (const key in AlertEventSeverity) {
        promises.push(am.sendAlert('alert', AlertEventSeverity[key], logger));
      }

      Promise.all(promises).then(() => {
        alertsSent = true;
      });
    });

    waitsFor(() => alertsSent, 'alerts to be sent');

    runs(() => {
      // 4 unique alerts
      expect(logRecords.length).toBe(4);
      expect(logRecords.filter((r) => r.getLevel().name === Level.INFO.name).length).toBe(2);
      expect(logRecords.filter((r) => r.getLevel().name === Level.WARNING.name).length).toBe(1);
      expect(logRecords.filter((r) => r.getLevel().name === Level.SEVERE.name).length).toBe(1);

      logRecords.length = 0;
      alertsSent = false;

      const am = new AlertManager();
      const promises = [];

      for (const key in AlertEventSeverity) {
        if (AlertEventSeverity[key] === AlertEventSeverity.WARNING) {
          promises.push(am.sendAlert(`${key} alert`, AlertEventSeverity[key], logger));
          promises.push(am.sendAlert(`${key} alert`, AlertEventSeverity[key], logger));
        } else if (AlertEventSeverity[key] === AlertEventSeverity.ERROR) {
          promises.push(am.sendAlert(`${key} alert`, AlertEventSeverity[key], logger));
        } else {
          promises.push(am.sendAlert(`${key} alert`, AlertEventSeverity[key], logger));
          promises.push(am.sendAlert(`${key} alert`, AlertEventSeverity[key], logger));
          promises.push(am.sendAlert(`${key} alert`, AlertEventSeverity[key], logger));
        }
      }

      Promise.all(promises).then(() => {
        alertsSent = true;
      });
    });

    waitsFor(() => alertsSent, 'alerts to be sent');

    runs(() => {
      expect(logRecords.filter((r) => r.getLevel().name === Level.INFO.name).length).toBe(2);
      expect(logRecords.filter((r) => r.getLevel().name === Level.INFO.name &&
          r.getMessage().indexOf(' (6)')).length).toBeGreaterThan(-1);
      expect(logRecords.filter((r) => r.getLevel().name === Level.WARNING.name).length).toBe(1);
      expect(logRecords.filter((r) => r.getLevel().name === Level.WARNING.name &&
          r.getMessage().indexOf(' (2)')).length).toBeGreaterThan(-1);
      expect(logRecords.filter((r) => r.getLevel().name === Level.SEVERE.name).length).toBe(1);
      expect(logRecords.filter((r) => r.getLevel().name === Level.SEVERE.name &&
          r.getMessage().match(/\s+\(\d+\)$/)).length).toBe(0);
    });
  });

  it('should throttle duplicate alerts', function() {
    const am = new AlertManager();
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
    const am = new AlertManager();
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
    const am = new AlertManager();
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
    const am = new AlertManager();
    const alert8 = 'alert 8';

    am.sendAlert(alert8, undefined, undefined, undefined, undefined, 0);
    am.sendAlert(alert8, undefined, undefined, undefined, undefined, 0);
    const last = am.getAlerts().getLast();
    expect(last.getMessage()).toBe(alert8);
    expect(last.getCount()).toBe(1);
    expect(am.getAlerts().getCount()).toBe(2);
  });
});
