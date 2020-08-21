goog.require('os.ogc.query.OGCQuery');


describe('os.ogc.query.OGCQuery', function() {
  const OGCQuery = goog.module.get('os.ogc.query.OGCQuery');

  it('should exist', function() {
    const q = new OGCQuery(null);

    expect(q.getEventType()).toBe('ogcQuery:*');
    expect(typeof q.launch).toBe('function');
  });
});
