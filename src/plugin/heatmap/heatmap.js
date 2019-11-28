goog.provide('plugin.heatmap');
goog.provide('plugin.heatmap.HeatmapField');
goog.provide('plugin.heatmap.SynchronizerType');

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.events.LayerConfigEvent');
goog.require('os.ex.ZipExporter');
goog.require('os.file.File');
goog.require('os.job.Job');
goog.require('os.worker');


/**
 * @type {string}
 * @const
 */
plugin.heatmap.SynchronizerType.HEATMAP = 'heatmap';


/**
 * @enum {string}
 * @const
 */
plugin.heatmap.HeatmapField = {
  GEOMETRY_TYPE: '_geometryType',
  HEATMAP_GEOMETRY: '_heatmapGeometry'
};


/**
 * @enum {string}
 * @const
 */
plugin.heatmap.HeatmapPropertyType = {
  INTENSITY: 'intensity',
  SIZE: 'size',
  GRADIENT: 'gradient'
};


/**
 * Factor to use for scaling Openlayers extents to render the heatmap properly.
 * @type {number}
 * @const
 */
plugin.heatmap.EXTENT_SCALE_FACTOR = 1.5;


/**
 * Clones a feature. This avoids copying style information since we handle styles very differently than base OL3.
 *
 * @param {!ol.Feature} feature The feature to clone
 * @return {?ol.Feature} The cloned feature
 */
plugin.heatmap.cloneFeature = function(feature) {
  var clone = null;
  var geometry = feature.getGeometry();

  if (geometry && geometry.getExtent().indexOf(Infinity) === -1) {
    clone = new ol.Feature();

    // get the real geometry name and put it on the feature
    var geometryType = geometry.getType();
    clone.set(plugin.heatmap.HeatmapField.GEOMETRY_TYPE, geometryType);

    // put a clone of the geometry on the feature
    clone.set(plugin.heatmap.HeatmapField.HEATMAP_GEOMETRY, os.ol.feature.cloneGeometry(geometry));

    // get the ellipse and put it on the feature (if applicable)
    var ellipse = feature.get(os.data.RecordField.ELLIPSE);
    var shapeName = os.feature.getShapeName(feature);
    if (ellipse && (shapeName == os.style.ShapeType.ELLIPSE || shapeName == os.style.ShapeType.ELLIPSE_CENTER)) {
      clone.set(plugin.heatmap.HeatmapField.GEOMETRY_TYPE, ellipse.getType());
      clone.set(plugin.heatmap.HeatmapField.HEATMAP_GEOMETRY, os.ol.feature.cloneGeometry(ellipse));
    }

    // generate the centerpoint and center the feature there for rendering
    var extent = geometry.getExtent();
    var center = ol.extent.getCenter(extent);
    var pointGeometry = new ol.geom.Point(center);
    clone.setGeometry(pointGeometry);
  }

  return clone;
};


/**
 * Get features to use for a heatmap from a source.
 *
 * @param {string|undefined} sourceId The source id.
 * @return {Array<!ol.Feature>|undefined} The features.
 */
plugin.heatmap.getSourceFeatures = function(sourceId) {
  var source = sourceId ? os.osDataManager.getSource(sourceId) : undefined;
  return source ? source.getFeatures().map(function(feature, idx, arr) {
    if (feature) {
      var clone = plugin.heatmap.cloneFeature(feature);
      if (clone) {
        clone.setId(idx);
        return clone;
      }
    }

    return undefined;
  }).filter(os.fn.filterFalsey) : undefined;
};


/**
 * Takes a list of color strings and constructs a gradient image data array.
 *
 * @param {Array<string>} colors
 * @return {Uint8ClampedArray} An array.
 */
plugin.heatmap.createGradient = function(colors) {
  var width = 1;
  var height = 256;
  var context = ol.dom.createCanvasContext2D(width, height);

  var gradient = context.createLinearGradient(0, 0, width, height);
  var step = 1 / (colors.length - 1);
  for (var i = 0, ii = colors.length; i < ii; ++i) {
    gradient.addColorStop(i * step, colors[i]);
  }

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  return context.getImageData(0, 0, width, height).data;
};


/**
 * Create a heatmap based on the passed layer.
 *
 * @param {os.layer.ILayer} layer
 */
plugin.heatmap.createHeatmap = function(layer) {
  var options = {
    'id': goog.string.getRandomString(),
    'sourceId': /** @type {os.source.ISource} */ (/** @type {ol.layer.Layer} */ (layer).getSource()).getId(),
    'title': layer.getTitle(),
    'animate': false,
    'layerType': os.layer.LayerType.FEATURES,
    'explicitType': '',
    'type': plugin.heatmap.HeatmapLayerConfig.ID,
    'loadOnce': true
  };

  var configEvent = new os.events.LayerConfigEvent(os.events.LayerConfigEventType.CONFIGURE_AND_ADD, options);
  os.dispatcher.dispatchEvent(configEvent);
};


/**
 * Exports a heatmap to a KMZ as a GroundOverlay.
 *
 * @param {plugin.heatmap.Heatmap} layer
 */
plugin.heatmap.exportHeatmap = function(layer) {
  var lastImage = layer.getLastImage();
  var canvas = lastImage.getImage();
  var dataUrl = canvas.toDataURL();

  var jobUrl = os.ROOT + os.worker.DIR + 'dataurltoarray.js';
  var job = new os.job.Job(jobUrl, 'Canvas to Blob', 'Converting canvas data URL to a Blob.');
  job.listenOnce(os.job.JobEventType.COMPLETE, goog.partial(plugin.heatmap.onImageComplete, layer));
  job.listenOnce(os.job.JobEventType.ERROR, plugin.heatmap.onImageError);
  job.startExecution({
    'dataUrl': dataUrl
  });
};


/**
 * Handle image job completion
 *
 * @param {plugin.heatmap.Heatmap} layer
 * @param {os.job.JobEvent} event
 */
plugin.heatmap.onImageComplete = function(layer, event) {
  goog.dispose(event.target);

  if (event.data instanceof Uint8Array) {
    var blob = new Blob([event.data], {type: 'image/png'});
    var imageFile = new os.file.File();
    imageFile.setFileName('heatmap.png');
    imageFile.setContent(blob);
    imageFile.setContentType('image/png');

    var layerTitle = layer.getTitle();
    var extent = layer.getExtent().slice();
    ol.extent.scaleFromCenter(extent, 1 / plugin.heatmap.EXTENT_SCALE_FACTOR);
    var mm = os.MapContainer.getInstance();
    var view = mm.getMap().getView();
    var centerLat = view.getCenter()[1];
    var centerLon = view.getCenter()[0];
    var altitude = mm.getAltitude();
    var kml = '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2">' +
        '<Document><name>Heatmap</name>' +
        '<Camera><latitude>' + centerLat + '</latitude>' +
        '<longitude>' + centerLon + '</longitude>' +
        '<altitude>' + altitude + '</altitude>' +
        '<tilt>0</tilt><heading>0</heading><roll>0</roll></Camera>' +
        '<GroundOverlay><name>' + layerTitle + '</name>' +
        '<Icon><href>heatmap.png</href></Icon>' +
        '<LatLonBox><north>' + extent[3] + '</north><south>' + extent[1] + '</south><east>' +
        extent[2] + '</east><west>' + extent[0] + '</west></LatLonBox></GroundOverlay>' +
        '</Document></kml>';

    var kmlFile = new os.file.File();
    kmlFile.setFileName('index.kml');
    kmlFile.setContent(kml);
    kmlFile.setContentType('application/vnd.google-earth.kml+xml');

    var exporter = new os.ex.ZipExporter();
    exporter.addFile(kmlFile);
    exporter.addFile(imageFile);
    exporter.setCompress(true);

    os.ui.exportManager.exportItems([kmlFile], [''], layerTitle + '.kmz', exporter);
  } else {
    os.alertManager.sendAlert('Failed saving canvas to PNG');
  }
};


/**
 * Handle job failure
 *
 * @param {os.job.JobEvent} event
 */
plugin.heatmap.onImageError = function(event) {
  goog.dispose(event.target);

  var msg = typeof event.data === 'string' ? event.data : 'Screen capture failed due to an unspecified error';
  os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
};
