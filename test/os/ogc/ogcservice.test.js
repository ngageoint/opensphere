goog.require('os.ogc.OGCService');
goog.require('os.ogc.query.OGCQuery');
goog.require('os.ogc.registry');

import Feature from 'ol/src/Feature.js';

describe('os.ogc.OGCService', function() {
  const {default: OGCService} = goog.module.get('os.ogc.OGCService');

  const FIELD = 'TITLE';

  it('should exist', function() {
    const s = new OGCService();
    s.init({
      nameProperty: FIELD
    });

    expect(s.getServiceId()).toBe('');
  });

  it('should report status properly', function() {
    const s = new OGCService();
    s.init({
      nameProperty: FIELD
    });

    expect(s.getServiceId()).toBe('');
    expect(s.isConfigured()).toBe(false);

    s.setServiceId('meaningful');
    s.init({
      namespace: 'dc',
      nameProperty: FIELD,
      typename: 'dc',
      url: 'dc'
    });

    expect(s.getServiceId()).toBe('meaningful');
    expect(s.isConfigured()).toBe(true);

    const q = /** @type {OGCQuery} */ (s.getQuery());
    expect(q).not.toBe(null);
    expect(q.service).toBe(s);
  });

  it('should provide helper functions for dealing with data from the service', function() {
    const s = new OGCService();
    s.init({
      nameProperty: FIELD
    });

    const feature = new Feature();
    feature.set(FIELD, 'My Title');

    expect(s.getServiceId()).toBe('');
    expect(s.getId(feature)).toBe('My Title');
    expect(s.getLabel(feature)).toBe('My Title');
  });

  it('should work with the OGC Registry', function() {
    const {default: OGCService} = goog.module.get('os.ogc.OGCService');
    const registry = goog.module.get('os.ogc.registry');

    const key = 'myServiceKey';

    expect(registry.isOGCServiceEnabled(key)).toBe(false);

    const service = new OGCService();
    service.setServiceId(key);
    service.init({
      namespace: 'dc',
      nameProperty: 'dc',
      typename: 'dc',
      url: 'dc'
    });
    registry.getInstance().register(key, service);

    expect(registry.isOGCServiceEnabled(key)).toBe(true);
  });
});
