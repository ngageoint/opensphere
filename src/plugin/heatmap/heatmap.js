goog.module('plugin.heatmap');

const dispose = goog.require('goog.dispose');
const googString = goog.require('goog.string');
const dom = goog.require('ol.dom');
const olExtent = goog.require('ol.extent');
const os = goog.require('os');
const MapContainer = goog.require('os.MapContainer');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const RecordField = goog.require('os.data.RecordField');
const LayerConfigEventType = goog.require('os.events.LayerConfigEventType');
const osFeature = goog.require('os.feature');
const FilePersistence = goog.require('os.file.persist.FilePersistence');
const fn = goog.require('os.fn');
const JobEventType = goog.require('os.job.JobEventType');
const LayerType = goog.require('os.layer.LayerType');
const osOlFeature = goog.require('os.ol.feature');
const style = goog.require('os.style');
const exportManager = goog.require('os.ui.exportManager');

const AlertManager = goog.require('os.alert.AlertManager');
const dispatcher = goog.require('os.Dispatcher');
const OSDataManager = goog.require('os.data.OSDataManager');
const Feature = goog.require('ol.Feature');
const Point = goog.require('ol.geom.Point');
const LayerConfigEvent = goog.require('os.events.LayerConfigEvent');
const ZipExporter = goog.require('os.ex.ZipExporter');
const OSFile = goog.require('os.file.File');
const Job = goog.require('os.job.Job');
const worker = goog.require('os.worker');
const HeatmapField = goog.require('plugin.heatmap.HeatmapField');

const JobEvent = goog.requireType('os.job.JobEvent');


/**
 * Identifier for heatmap plugin components.
 * @type {string}
 */
const ID = 'heatmap';

/**
 * Factor to use for scaling Openlayers extents to render the heatmap properly.
 * @type {number}
 */
const EXTENT_SCALE_FACTOR = 1.5;

/**
 * Clones a feature. This avoids copying style information since we handle styles very differently than base OL3.
 *
 * @param {!Feature} feature The feature to clone
 * @return {?ol.Feature} The cloned feature
 */
const cloneFeature = function(feature) {
  var clone = null;
  var geometry = feature.getGeometry();

  if (geometry && geometry.getExtent().indexOf(Infinity) === -1) {
    clone = new Feature();

    // get the real geometry name and put it on the feature
    var geometryType = geometry.getType();
    clone.set(HeatmapField.GEOMETRY_TYPE, geometryType);

    // put a clone of the geometry on the feature
    clone.set(HeatmapField.HEATMAP_GEOMETRY, osOlFeature.cloneGeometry(geometry));

    // get the ellipse and put it on the feature (if applicable)
    var ellipse = feature.get(RecordField.ELLIPSE);
    var shapeName = osFeature.getShapeName(feature);
    if (ellipse && (shapeName == style.ShapeType.ELLIPSE || shapeName == style.ShapeType.ELLIPSE_CENTER)) {
      clone.set(HeatmapField.GEOMETRY_TYPE, ellipse.getType());
      clone.set(HeatmapField.HEATMAP_GEOMETRY, osOlFeature.cloneGeometry(ellipse));
    }

    // generate the centerpoint and center the feature there for rendering
    var extent = geometry.getExtent();
    var center = olExtent.getCenter(extent);
    var pointGeometry = new Point(center);
    clone.setGeometry(pointGeometry);
  }

  return clone;
};

/**
 * Get features to use for a heatmap from a source.
 *
 * @param {string|undefined} sourceId The source id.
 * @return {Array<!Feature>|undefined} The features.
 */
const getSourceFeatures = function(sourceId) {
  var source = sourceId ? OSDataManager.getInstance().getSource(sourceId) : undefined;
  return source ? source.getFeatures().map(function(feature, idx, arr) {
    if (feature) {
      var clone = cloneFeature(feature);
      if (clone) {
        clone.setId(idx);
        return clone;
      }
    }

    return undefined;
  }).filter(fn.filterFalsey) : undefined;
};

/**
 * Takes a list of color strings and constructs a gradient image data array.
 *
 * @param {Array<string>} colors
 * @return {Uint8ClampedArray} An array.
 */
const createGradient = function(colors) {
  var width = 1;
  var height = 256;
  var context = dom.createCanvasContext2D(width, height);

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
const createHeatmap = function(layer) {
  var options = {
    'id': googString.getRandomString(),
    'sourceId': /** @type {os.source.ISource} */ (/** @type {ol.layer.Layer} */ (layer).getSource()).getId(),
    'title': layer.getTitle(),
    'animate': false,
    'layerType': LayerType.FEATURES,
    'explicitType': '',
    'type': ID,
    'loadOnce': true
  };

  var configEvent = new LayerConfigEvent(LayerConfigEventType.CONFIGURE_AND_ADD, options);
  dispatcher.getInstance().dispatchEvent(configEvent);
};

/**
 * Exports a heatmap to a KMZ as a GroundOverlay.
 *
 * @param {plugin.heatmap.Heatmap} layer
 */
const exportHeatmap = function(layer) {
  var lastImage = layer.getLastImage();
  var canvas = lastImage.getImage();
  var dataUrl = canvas.toDataURL();

  var jobUrl = os.ROOT + worker.DIR + 'dataurltoarray.js';
  var job = new Job(jobUrl, 'Canvas to Blob', 'Converting canvas data URL to a Blob.');
  job.listenOnce(JobEventType.COMPLETE, goog.partial(onImageComplete, layer));
  job.listenOnce(JobEventType.ERROR, onImageError);
  job.startExecution({
    'dataUrl': dataUrl
  });
};

/**
 * Handle image job completion
 *
 * @param {plugin.heatmap.Heatmap} layer
 * @param {JobEvent} event
 */
const onImageComplete = function(layer, event) {
  dispose(event.target);

  if (event.data instanceof Uint8Array) {
    var blob = new Blob([event.data], {type: 'image/png'});
    var imageFile = new OSFile();
    imageFile.setFileName('heatmap.png');
    imageFile.setContent(blob);
    imageFile.setContentType('image/png');

    var layerTitle = layer.getTitle();
    var extent = layer.getExtent().slice();
    olExtent.scaleFromCenter(extent, 1 / EXTENT_SCALE_FACTOR);
    var mm = MapContainer.getInstance();
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

    var kmlFile = new OSFile();
    kmlFile.setFileName('index.kml');
    kmlFile.setContent(kml);
    kmlFile.setContentType('application/vnd.google-earth.kml+xml');

    var exporter = new ZipExporter();
    exporter.addFile(kmlFile);
    exporter.addFile(imageFile);
    exporter.setCompress(true);

    var persister = new FilePersistence();

    var options = /** @type {os.ex.ExportOptions} */ ({
      items: [kmlFile],
      fields: [''],
      title: layerTitle + '.kmz',
      exporter: exporter,
      persister: persister
    });

    exportManager.exportItems(options);
  } else {
    AlertManager.getInstance().sendAlert('Failed saving canvas to PNG');
  }
};

/**
 * Handle job failure
 *
 * @param {JobEvent} event
 */
const onImageError = function(event) {
  dispose(event.target);

  var msg = typeof event.data === 'string' ? event.data : 'Screen capture failed due to an unspecified error';
  AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
};

exports = {
  ID,
  EXTENT_SCALE_FACTOR,
  cloneFeature,
  createGradient,
  createHeatmap,
  exportHeatmap,
  getSourceFeatures,
  onImageComplete,
  onImageError
};
