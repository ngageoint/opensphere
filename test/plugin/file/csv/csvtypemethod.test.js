goog.require('os.file.File');
goog.require('plugin.file.csv.CSVTypeMethod');

describe('plugin.file.csv.CSVTypeMethod', function() {
  it('matches clearly marked CSV content', function() {
    var method = new plugin.file.csv.CSVTypeMethod();

    var file = new os.file.File();
    file.setContent('test');
    file.setContentType('text/plain');
    file.setFileName('test.txt');

    // doesn't match generic text file
    expect(method.isType(file)).toBe(false);

    // matches on content type alone
    file.setContentType('text/csv');

    expect(method.isType(file)).toBe(true);

    // matches on file extension alone
    file.setContentType('text/plain');
    file.setFileName('test.csv');
    expect(method.isType(file)).toBe(true);
  });

  it('matches generic text that looks like CSV content', function() {
    var method = new plugin.file.csv.CSVTypeMethod();

    var file = new os.file.File();
    file.setContent('test');
    file.setContentType('text/plain');
    file.setFileName('test.txt');

    // doesn't match generic text file
    expect(method.isType(file)).toBe(false);

    // doesn't match with just a column row
    file.setContent('COLUMN 1,COLUMN 2');
    expect(method.isType(file)).toBe(false);

    // does match with a column and value row
    file.setContent('COLUMN 1,COLUMN 2\nVALUE 1,VALUE 2');
    expect(method.isType(file)).toBe(true);
  });

  it('does not match zipped content', function() {
    var method = new plugin.file.csv.CSVTypeMethod();

    // create an otherwise valid CSV
    var file = new os.file.File();
    file.setContent('COLUMN1,COLUMN2\nVALUE1,VALUE2');
    file.setContentType('text/csv');
    file.setFileName('test.csv');

    // but pass an array for the zip entries argument
    expect(method.isType(file, [])).toBe(false);
  });

  it('does not match XML/JSON content', function() {
    var method = new plugin.file.csv.CSVTypeMethod();

    // create an ambiguous file
    var file = new os.file.File();
    file.setContentType('text/plain');
    file.setFileName('test');

    // test JSON content
    file.setContent('{}');
    expect(method.isType(file, [])).toBe(false);
    file.setContent('   {}   ');
    expect(method.isType(file, [])).toBe(false);
    file.setContent('[]');
    expect(method.isType(file, [])).toBe(false);
    file.setContent('   []   ');
    expect(method.isType(file, [])).toBe(false);

    // test XML content
    file.setContent('<xml></xml>');
    expect(method.isType(file, [])).toBe(false);
    file.setContent('   <xml></xml>   ');
    expect(method.isType(file, [])).toBe(false);
  });
});
