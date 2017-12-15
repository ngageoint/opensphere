goog.provide('plugin.heatmap');
goog.provide('plugin.heatmap.HeatmapField');
goog.provide('plugin.heatmap.SynchronizerType');
goog.require('os.events.LayerConfigEvent');
goog.require('os.ex.ZipExporter');
goog.require('os.file.File');
goog.require('os.job.Job');


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
 * Create a heatmap based on the passed layer.
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
 * @param {plugin.heatmap.Heatmap} layer
 */
plugin.heatmap.exportHeatmap = function(layer) {
  var source = /** @type {plugin.heatmap.HeatmapSource} */ (layer.getSource());
  var currentCanvas = source.getCurrentCanvas();
  var canvas = currentCanvas.getImage();
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
    var extent = layer.getExtent();
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
 * @param {os.job.JobEvent} event
 */
plugin.heatmap.onImageError = function(event) {
  goog.dispose(event.target);

  var msg = goog.isString(event.data) ? event.data : 'Screen capture failed due to an unspecified error';
  os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
};
