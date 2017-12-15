goog.require('os.file.File');


describe('os.file.File', function() {
  var file = new os.file.File();
  file.setFileName('testFile.xml');
  file.setUrl('local://testfileurl');
  file.setContent('you\'re a towel');
  file.setContentType('test+content+and+stuff');
  file.setType('test');
  
  it('should persist and restore properly', function() {
    var p = file.persist();
    expect(p.fileName).toBe(file.getFileName());
    expect(p.url).toBe(file.getUrl());
    expect(p.content).toBe(file.getContent());
    expect(p.contentType).toBe(file.getContentType());
    expect(p.type).toBe(file.getType());
    
    var r = new os.file.File();
    r.restore(p);
    
    expect(r.getFileName()).toBe(file.getFileName());
    expect(r.getUrl()).toBe(file.getUrl());
    expect(r.getContent()).toBe(file.getContent());
    expect(r.getContentType()).toBe(file.getContentType());
    expect(r.getType()).toBe(file.getType());
  });
});
