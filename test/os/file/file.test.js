goog.require('os.file.File');


describe('os.file.File', function() {
  var fsFile = new os.file.File();
  fsFile.setFileName('testFile.xml');
  fsFile.setUrl('file:///path/to/some/testFile.xml');
  fsFile.setContent('test content');
  fsFile.setContentType('test+content+and+stuff');
  fsFile.setType('test');

  var localFile = new os.file.File();
  localFile.setFileName('testFile.xml');
  localFile.setUrl('local://testfileurl');
  localFile.setContent('test content');
  localFile.setContentType('test+content+and+stuff');
  localFile.setType('test');

  it('gets file:// URLs from a path', function() {
    var path = '/path/to/some/file.xml';
    expect(os.file.getFileUrl(path)).toBe('file://' + path);
  });

  it('tests for file:// URLs', function() {
    expect(os.file.isFileSystem(fsFile)).toBe(true);
    expect(os.file.isFileSystem('file:///test')).toBe(true);

    expect(os.file.isFileSystem(localFile)).toBe(false);
    expect(os.file.isFileSystem('local://test')).toBe(false);
    expect(os.file.isFileSystem('not file:///test')).toBe(false);
  });

  it('tests for local:// URLs', function() {
    expect(os.file.isLocal(localFile)).toBe(true);
    expect(os.file.isLocal('local://test')).toBe(true);

    expect(os.file.isLocal(fsFile)).toBe(false);
    expect(os.file.isLocal('file:///test')).toBe(false);
    expect(os.file.isLocal('not local://test')).toBe(false);
  });

  it('should persist and restore properly', function() {
    var p = localFile.persist();
    expect(p.fileName).toBe(localFile.getFileName());
    expect(p.url).toBe(localFile.getUrl());
    expect(p.content).toBe(localFile.getContent());
    expect(p.contentType).toBe(localFile.getContentType());
    expect(p.type).toBe(localFile.getType());

    var r = new os.file.File();
    r.restore(p);

    expect(r.getFileName()).toBe(localFile.getFileName());
    expect(r.getUrl()).toBe(localFile.getUrl());
    expect(r.getContent()).toBe(localFile.getContent());
    expect(r.getContentType()).toBe(localFile.getContentType());
    expect(r.getType()).toBe(localFile.getType());
  });
});
