goog.require('os.config.Settings');
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
  var options = {
    items: null,
    fields: fields,
    title: title,
    exporter: null,
    persister: null
  };

  beforeEach(function() {
    eMethod.reset();
    pMethod.reset();

    spyOn(goog.log, 'error');
  });

  it('should log an error when no items are provided', function() {
    expect(goog.log.error.calls.length).toBe(0);

    em.exportItems(options);
    expect(goog.log.error.calls.length).toBe(1);

    options.items = [];
    em.exportItems(options);
    expect(goog.log.error.calls.length).toBe(2);
  });

  it('should log an error when exporting before methods are available', function() {
    expect(goog.log.error.calls.length).toBe(0);

    options.items = items;
    em.exportItems(options);
    expect(goog.log.error.calls.length).toBe(1);

    options.exporter = eMethod;
    options.persister = pMethod;
    em.exportItems(options);
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

  it('should not return persistence methods disabled in settings unless forced', function() {
    pMethod.supported = true;
    os.settings.set('ex.enabledPersisters', {'Mock Persistence': false});

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
    options.exporter = eMethod;
    options.persister = pMethod;
    em.exportItems(options);

    expect(eMethod.process).toHaveBeenCalled();

    var expectedFilename = title + '.' + os.ui.file.MockExportMethod.EXT;
    var expectedOutput = items.join(' ');
    var expectedMimeType = os.ui.file.MockExportMethod.MIMETYPE;
    expect(pMethod.save).toHaveBeenCalledWith(expectedFilename, expectedOutput, expectedMimeType);
  });

  it('should launch an export dialog when methods are not provided', function() {
    spyOn(em, 'launchExportDialog_');
    spyOn(em, 'doExport_');

    options.exporter = null;
    options.persister = null;
    em.exportItems(options);
    expect(em.launchExportDialog_.calls.length).toBe(1);

    // when an exporter is provided but no persister, save the file directly to storage
    options.exporter = eMethod;
    options.persister = null;
    em.exportItems(options);
    expect(em.doExport_.calls.length).toBe(1);

    options.exporter = null;
    options.persister = pMethod;
    em.exportItems(options);
    expect(em.launchExportDialog_.calls.length).toBe(2);
  });
});
