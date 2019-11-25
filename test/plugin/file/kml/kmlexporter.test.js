goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('os.MapContainer');
goog.require('os.mock');
goog.require('os.style.StyleManager');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('plugin.file.kml.KMLExporter');

describe('plugin.file.kml.KMLExporter', function() {
  // the layer/source identifier for these tests
  var testId = 'plugin_file_kml_KMLExporter';
  var delim = os.ui.file.kml.AbstractKMLExporter.LABEL_DELIMITER_;

  var label1 = {
    column: 'label1',
    showColumn: true
  };
  var l1Expected = 'label1: test1';

  var label2 = {
    column: 'label2',
    showColumn: false
  };
  var l2Expected = 'test2';

  var label3 = {
    column: null,
    showColumn: false
  };
  var l3Expected = null;

  var label4 = {
    column: 'doesntexist',
    showColumn: false
  };
  var l4Expected = null;

  it('gets label configs for a group', function() {
    var exporter = new plugin.file.kml.KMLExporter();
    var groupLabels;

    var sm = os.style.StyleManager.getInstance();

    // no source id set
    var f = new ol.Feature();
    exporter.reset();
    expect(exporter.getGroupLabels(f)).toBeNull();

    // pretend the drawing layer has labels to make sure we don't return them
    var drawCfg = sm.getOrCreateLayerConfig(os.MapContainer.DRAW_ID);
    drawCfg['labels'] = [label1];

    f.set(os.data.RecordField.SOURCE_ID, os.MapContainer.DRAW_ID, true);
    exporter.reset();
    expect(exporter.getGroupLabels(f)).toBeNull();

    // clean up after ourselves, just in case
    delete drawCfg['labels'];

    // create a layer config for our imaginary source
    var cfg = sm.getOrCreateLayerConfig(testId);
    f.set(os.data.RecordField.SOURCE_ID, testId, true);

    // labels array is not defined on the layer config
    exporter.reset();
    groupLabels = exporter.getGroupLabels(f);
    expect(groupLabels).toBeNull();

    // a label array is defined but empty
    cfg['labels'] = [];
    exporter.reset();
    groupLabels = exporter.getGroupLabels(f);
    expect(groupLabels).toBeNull();

    // a label array is defined with a label config
    cfg['labels'].push(label1);
    exporter.reset();
    groupLabels = exporter.getGroupLabels(f);
    expect(groupLabels).not.toBeNull();
    expect(groupLabels.length).toBe(1);
    expect(groupLabels[0]).toBe(label1);

    // a label array is defined with label configs
    cfg['labels'].push(label2);
    exporter.reset();
    groupLabels = exporter.getGroupLabels(f);
    expect(groupLabels).not.toBeNull();
    expect(groupLabels.length).toBe(2);
    expect(groupLabels[1]).toBe(label2);

    // clean up after ourselves, just in case
    delete cfg['labels'];

    // should be cached on the label map
    groupLabels = exporter.getGroupLabels(f);
    expect(groupLabels).not.toBeNull();
    expect(groupLabels.length).toBe(2);
    expect(groupLabels[1]).toBe(label2);

    // label map should be reset with the exporter
    exporter.reset();
    groupLabels = exporter.getGroupLabels(f);
    expect(groupLabels).toBeNull();
  });

  it('gets a label component for a feature', function() {
    var exporter = new plugin.file.kml.KMLExporter();

    var f = new ol.Feature({
      label1: 'test1',
      label2: 'test2',
      label3: 'test3'
    });

    // show column enabled
    expect(exporter.getItemLabel(f, label1)).toBe(l1Expected);

    // show column disabled
    expect(exporter.getItemLabel(f, label2)).toBe(l2Expected);

    // null column
    expect(exporter.getItemLabel(f, label3)).toBe(l3Expected);

    // column not defined on feature
    expect(exporter.getItemLabel(f, label4)).toBe(l4Expected);
  });

  it('creates a label for a feature', function() {
    var exporter = new plugin.file.kml.KMLExporter();
    var defaultColumn = {
      column: 'defaultField',
      showColumn: false
    };

    var sm = os.style.StyleManager.getInstance();
    var cfg = sm.getOrCreateLayerConfig(testId);

    var defaultValue = 'defaultValue';
    var f = new ol.Feature({
      labels: [label1, label2, label3, label4],
      label1: 'test1',
      label2: 'test2',
      label3: 'test3',
      defaultField: defaultValue
    });
    f.set(os.data.RecordField.SOURCE_ID, testId, true);

    // no labels, no defaults
    exporter.reset();
    expect(exporter.createLabel(f)).toBeNull();

    // empty label array, no defaults
    cfg['labels'] = [];
    exporter.reset();
    expect(exporter.createLabel(f)).toBeNull();

    // default values work
    exporter.setDefaultLabelFields([defaultColumn]);
    exporter.reset();
    expect(exporter.createLabel(f)).toBe(defaultValue);

    // single label
    cfg['labels'].push(label1);
    exporter.reset();
    expect(exporter.createLabel(f)).toBe(l1Expected);

    // multiple labels
    cfg['labels'].push(label2);
    exporter.reset();
    expect(exporter.createLabel(f)).toBe(l1Expected + delim + l2Expected);

    // empty column isn't added
    cfg['labels'].push(label3);
    exporter.reset();
    expect(exporter.createLabel(f)).toBe(l1Expected + delim + l2Expected);

    // undefined field isn't added
    cfg['labels'].push(label4);
    exporter.reset();
    expect(exporter.createLabel(f)).toBe(l1Expected + delim + l2Expected);

    // can change the delimiter
    var newLine = '\n';
    exporter.setLabelDelimiter(newLine);
    exporter.reset();
    expect(exporter.createLabel(f)).toBe(l1Expected + newLine + l2Expected);

    // default used when labels are defined but don't produce a label
    cfg['labels'] = [label3, label4];
    exporter.reset();
    expect(exporter.createLabel(f)).toBe(defaultValue);

    // clean up after ourselves, just in case
    delete cfg['labels'];
  });

  it('gets time values from a feature', function() {
    var exporter = new plugin.file.kml.KMLExporter();
    var f = new ol.Feature();

    // null when field is not set
    expect(exporter.getTime(f)).toBeNull();

    // null when value is not an ITime object
    f.set(os.data.RecordField.TIME, 'not an ITime object');
    expect(exporter.getTime(f)).toBeNull();

    // defined when value is an ITime object
    var instant = new os.time.TimeInstant();
    f.set(os.data.RecordField.TIME, instant);
    expect(exporter.getTime(f)).toBe(instant);

    var range = new os.time.TimeRange();
    f.set(os.data.RecordField.TIME, range);
    expect(exporter.getTime(f)).toBe(range);
  });

  it('generates proper fill booleans in styles', function() {
    var exporter = new plugin.file.kml.KMLExporter();
    var f = new ol.Feature(new ol.geom.Point(0, 0));

    expect(exporter.getFill(f)).toBe(false);

    var style = new ol.style.Style();
    f.setStyle(style);
    expect(exporter.getFill(f)).toBe(false);

    var fill = new ol.style.Fill();
    fill.setColor('rgba(255,255,255,0)');
    style.setFill(fill);
    expect(exporter.getFill(f)).toBe(false);

    fill.setColor('rgba(255,255,255,1)');
    expect(exporter.getFill(f)).toBe(true);
  });

  it('generates proper stroke booleans in styles', function() {
    var exporter = new plugin.file.kml.KMLExporter();
    var f = new ol.Feature(new ol.geom.Point(0, 0));

    expect(exporter.getStroke(f)).toBe(false);

    var style = new ol.style.Style();
    f.setStyle(style);
    expect(exporter.getStroke(f)).toBe(false);

    var stroke = new ol.style.Stroke();
    stroke.setColor('rgba(255,255,255,0)');
    style.setStroke(stroke);
    expect(exporter.getStroke(f)).toBe(false);

    stroke.setColor('rgba(255,255,255,1)');
    expect(exporter.getStroke(f)).toBe(true);
  });

});
