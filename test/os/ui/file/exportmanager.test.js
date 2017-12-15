goog.require('os.ui.file.ExportManager');
goog.require('os.ui.file.MockExportMethod');
goog.require('os.ui.file.MockPersistMethod');

describe('os.ui.file.ExportManager', function() {
  var em = os.ui.file.ExportManager.getInstance();
  var eMethod = new os.ui.file.MockExportMethod();
  var pMethod = new os.ui.file.MockPersistMethod();
  var items = ['gonna', 'be', 'output'];
  var fields = ['1', '2', '3'];
  var title = 'ExportManagerTest';

  beforeEach(function() {
    eMethod.reset();
    pMethod.reset();

    spyOn(goog.log, 'error');
  });

  it('should log an error when no items are provided', function() {
    expect(goog.log.error.calls.length).toBe(0);

    em.exportItems(null, fields, title);
    expect(goog.log.error.calls.length).toBe(1);

    em.exportItems([], fields, title);
    expect(goog.log.error.calls.length).toBe(2);
  });

  it('should log an error when exporting before methods are available', function() {
    expect(goog.log.error.calls.length).toBe(0);

    em.exportItems(items, fields, title);
    expect(goog.log.error.calls.length).toBe(1);

    em.exportItems(items, fields, title, eMethod, pMethod);
    expect(goog.log.error.calls.length).toBe(1);
  });

  it('should register export/persistence methods once per method', function() {
    expect(em.exporters_.length).toBe(0);

    em.registerExportMethod(eMethod);
    expect(em.exporters_.length).toBe(1);

    em.registerExportMethod(eMethod);
    expect(em.exporters_.length).toBe(1);

    expect(em.persisters_.length).toBe(0);

    em.registerPersistenceMethod(pMethod);
    expect(em.persisters_.length).toBe(1);

    em.registerPersistenceMethod(pMethod);
    expect(em.persisters_.length).toBe(1);
  });

  it('should return new instances of exporters and persisters', function() {
    eMethod.processed = true;

    var e = em.getExportMethods();
    expect(e.length).toBe(1);
    expect(e[0]).not.toBe(eMethod);
    expect(e[0].processed).toBe(false);

    var p = em.getPersistenceMethods();
    expect(p.length).toBe(1);
    expect(p[0]).not.toBe(pMethod);
    expect(p[0].supported).toBe(true);
  });

  it('should not return unsupported persistence methods unless forced', function() {
    pMethod.supported = false;

    var p = em.getPersistenceMethods();
    expect(p.length).toBe(0);

    var p = em.getPersistenceMethods(true);
    expect(p.length).toBe(1);
  });

  it('should execute automatically when both methods are provided', function() {
    var eMethod = new os.ui.file.MockExportMethod();
    var pMethod = new os.ui.file.MockPersistMethod();

    spyOn(eMethod, 'process').andCallThrough();
    spyOn(pMethod, 'save').andCallThrough();

    expect(eMethod.output).toBeNull();
    em.exportItems(items, fields, title, eMethod, pMethod);

    expect(eMethod.process).toHaveBeenCalled();

    var expectedFilename = title + '.' + os.ui.file.MockExportMethod.EXT;
    var expectedOutput = items.join(' ');
    var expectedMimeType = os.ui.file.MockExportMethod.MIMETYPE;
    expect(pMethod.save).toHaveBeenCalledWith(expectedFilename, expectedOutput, expectedMimeType);
  });

  it('should launch an export dialog when methods are not provided', function() {
    spyOn(em, 'launchExportDialog_');

    em.exportItems(items, fields, title);
    expect(em.launchExportDialog_.calls.length).toBe(1);

    em.exportItems(items, fields, title, eMethod);
    expect(em.launchExportDialog_.calls.length).toBe(2);

    em.exportItems(items, fields, title, undefined, pMethod);
    expect(em.launchExportDialog_.calls.length).toBe(3);
  });
});
