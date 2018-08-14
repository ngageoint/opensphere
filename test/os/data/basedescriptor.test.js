goog.require('os.config.Settings');
goog.require('os.data.BaseDescriptor');
goog.require('os.mock');


describe('os.data.BaseDescriptor', function() {
  it('should generate HTML', function() {
    var d = new os.data.BaseDescriptor();
    d.setId('x1');
    d.setTitle('D1');
    d.setType('Vectorz');
    d.setProvider('Test');
    var expectedHtmlDescription =
     'Layer Name: D1<br>Provider: Test<br>Type: Vectorz<br><br>No description provided<br><br>Tags: (none)<br><br>';
    expect(d.getHtmlDescription()).toBe(expectedHtmlDescription);
  });

  it('should generate HTML without a provider', function() {
    var d = new os.data.BaseDescriptor();
    d.setId('x1');
    d.setTitle('D1');
    d.setType('Vectorz');
    var expectedHtmlDescription =
     'Layer Name: D1<br>Type: Vectorz<br><br>No description provided<br><br>Tags: (none)<br><br>';
    expect(d.getHtmlDescription()).toBe(expectedHtmlDescription);
  });

  it('should generate HTML without a type', function() {
    var d = new os.data.BaseDescriptor();
    d.setId('x1');
    d.setTitle('D1');
    d.setProvider('Test');
    var expectedHtmlDescription =
     'Layer Name: D1<br>Provider: Test<br><br>No description provided<br><br>Tags: (none)<br><br>';
    expect(d.getHtmlDescription()).toBe(expectedHtmlDescription);
  });

  it('should generate HTML with a single tag', function() {
    var d = new os.data.BaseDescriptor();
    d.setId('x1');
    d.setTitle('D1');
    d.setType('Vectorz');
    d.setProvider('Test');
    d.setTags(['one']);
    var expectedHtmlDescription =
     'Layer Name: D1<br>Provider: Test<br>Type: Vectorz<br><br>No description provided<br><br>Tags: one<br><br>';
    expect(d.getHtmlDescription()).toBe(expectedHtmlDescription);
  });

  it('should generate HTML with several tags', function() {
    var d = new os.data.BaseDescriptor();
    d.setId('x1');
    d.setTitle('D1');
    d.setType('Vectorz');
    d.setProvider('Test');
    d.setTags(['one', 'two', 'three', 'five']);
    var expectedHtmlDescription =
     'Layer Name: D1<br>Provider: Test<br>Type: Vectorz<br><br>No description provided<br><br>' +
     'Tags: one, two, three, five<br><br>';
    expect(d.getHtmlDescription()).toBe(expectedHtmlDescription);
  });

  it('should generate HTML with a description', function() {
    var d = new os.data.BaseDescriptor();
    d.setId('x1');
    d.setTitle('D1');
    d.setType('Vectorz');
    d.setProvider('Test');
    d.setTags(['one', 'two', 'three', 'five']);
    d.setDescription('not descriptive yet');
    var expectedHtmlDescription =
     'Layer Name: D1<br>Provider: Test<br>Type: Vectorz<br><br>not descriptive yet<br><br>' +
     'Tags: one, two, three, five<br><br>';
    expect(d.getHtmlDescription()).toBe(expectedHtmlDescription);
  });

  it('should generate HTML with singularly attractive type', function() {
    var d = new os.data.BaseDescriptor();
    d.setId('x1');
    d.setTitle('D1');
    d.setType('Vectors');
    var expectedHtmlDescription =
     'Layer Name: D1<br>Type: Vector<br><br>No description provided<br><br>Tags: (none)<br><br>';
    expect(d.getHtmlDescription()).toBe(expectedHtmlDescription);
  });

  it('should generate HTML with valid dates', function() {
    var d = new os.data.BaseDescriptor();
    d.setId('x1');
    d.setTitle('D1');
    d.setType('Vectorz');
    d.setProvider('Test');
    d.setMinDate(1521242965000);
    d.setMaxDate(1521253054100);
    d.setTags(['one', 'two', 'three', 'five']);
    d.setDescription('not descriptive yet');
    var expectedHtmlDescription =
     'Layer Name: D1<br>Provider: Test<br>Type: Vectorz<br>' +
     'Time: 2018-03-16 23:29:25Z to 2018-03-17 02:17:34Z<br><br>' +
     'not descriptive yet<br><br>' +
     'Tags: one, two, three, five<br><br>';
    expect(d.getHtmlDescription()).toBe(expectedHtmlDescription);
  });

  it('should generate HTML without time if only minDate is provided', function() {
    var d = new os.data.BaseDescriptor();
    d.setId('x1');
    d.setTitle('D1');
    d.setType('Vectorz');
    d.setProvider('Test');
    d.setMinDate(1521242965000);
    d.setTags(['one', 'two', 'three', 'five']);
    d.setDescription('not descriptive yet');
    var expectedHtmlDescription =
     'Layer Name: D1<br>Provider: Test<br>Type: Vectorz<br><br>' +
     'not descriptive yet<br><br>' +
     'Tags: one, two, three, five<br><br>';
    expect(d.getHtmlDescription()).toBe(expectedHtmlDescription);
  });

  it('should generate HTML without time if only maxDate is provided', function() {
    var d = new os.data.BaseDescriptor();
    d.setId('x1');
    d.setTitle('D1');
    d.setType('Vectorz');
    d.setProvider('Test');
    d.setMaxDate(1521253054100);
    d.setTags(['one', 'two', 'three', 'five']);
    d.setDescription('not descriptive yet');
    var expectedHtmlDescription =
     'Layer Name: D1<br>Provider: Test<br>Type: Vectorz<br><br>' +
     'not descriptive yet<br><br>' +
     'Tags: one, two, three, five<br><br>';
    expect(d.getHtmlDescription()).toBe(expectedHtmlDescription);
  });
});
