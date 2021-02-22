goog.require('plugin.file.shp.SHPExporter');

describe('plugin.file.shp.SHPExporter', function() {
  var ex = new plugin.file.shp.SHPExporter();
  var lineFeature;
  var pointFeature;
  var polygonFeature;

  beforeEach(function() {
    lineFeature = new ol.Feature(new ol.geom.LineString([[12, 34], [56, 78]]));
    pointFeature = new ol.Feature(new ol.geom.Point([12, 34]));
    polygonFeature = new ol.Feature(new ol.geom.Polygon([[[1, 2], [3, 4], [5, 6], [7, 8], [1, 2]]]));

    ex.reset();
  });

  it('should not process null features', function() {
    var result = ex.processItem(null);
    expect(result).toBe(false);
  });

  it('should not process features lacking a geometry', function() {
    var props = {
      strKey: 'a',
      numKey: 5
    };

    ex.setFields(goog.object.getKeys(props));
    var result = ex.processItem(new ol.Feature(props));

    expect(result).toBe(false);
  });

  it('should process Point features', function() {
      ex.setItems([pointFeature]);
      ex.process();
      var output = ex.getFiles();
      expect(output).not.toBeNull();
      expect(output.length).toBe(5);
      var shpFound = false;
      var dbfFound = false;
      var shxFound = false;
      var cpgFound = false;
      var prjFound = false;
      for (var i = 0; i < output.length; i++) {
        var file = output[i];
        if (file.getFileName().endsWith("shp")) {
            shpFound = true;
        }
        if (file.getFileName().endsWith("dbf")) {
            dbfFound = true;
        }
        if (file.getFileName().endsWith("shx")) {
            shxFound = true;
        }
        if (file.getFileName().endsWith("prj")) {
            prjFound = true;
            expect(file.getContent()).toBe(plugin.file.shp.SHPExporter.PRJ_WGS84);
        }
        if (file.getFileName().endsWith("cpg")) {
            cpgFound = true;
            expect(file.getContent()).toBe("UTF-8");
        }
      }
      expect(shpFound).toBe(true);
      expect(cpgFound).toBe(true);
      expect(prjFound).toBe(true);
      expect(shxFound).toBe(true);
      expect(dbfFound).toBe(true);
  });

  it('should process LineString features', function() {
    ex.setItems([polygonFeature]);
    ex.process();
    var output = ex.getFiles();
    expect(output).not.toBeNull();
    expect(output.length).toBe(5);
  });

  it('should process Polygon features', function() {
    ex.setItems([polygonFeature]);
    ex.process();
    var output = ex.getFiles();
    expect(output).not.toBeNull();
    expect(output.length).toBe(5);
  });

  it('should process features with multi-byte attributes', function() {
    var feature = new ol.Feature(new ol.geom.Point([12, 34]));
    feature.set('name', '東京都');
    ex.setItems([feature]);
    ex.process();
    var output = ex.getFiles();
    expect(output).not.toBeNull();
    expect(output.length).toBe(5);
  });

  it('should compress by default', function() {
      expect(ex.getCompress()).toBe(true);
  })
});