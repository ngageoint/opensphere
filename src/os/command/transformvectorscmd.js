goog.provide('os.command.TransformVectors');

goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Abstract command for performing selections on a source
 * @implements {os.command.ICommand}
 * @param {!ol.ProjectionLike} source
 * @param {!ol.ProjectionLike} target
 * @constructor
 */
os.command.TransformVectors = function(source, target) {
  /**
   * @type {!ol.ProjectionLike}
   * @protected
   */
  this.source = source;

  /**
   * @type {!ol.ProjectionLike}
   * @protected
   */
  this.target = target;
};


/**
 * @inheritDoc
 */
os.command.TransformVectors.prototype.state = os.command.State.READY;


/**
 * @inheritDoc
 */
os.command.TransformVectors.prototype.isAsync = false;


/**
 * @inheritDoc
 */
os.command.TransformVectors.prototype.title = 'Transform all vectors';


/**
 * @inheritDoc
 */
os.command.TransformVectors.prototype.details = null;


/**
 * Checks if the command is ready to execute
 * @return {boolean}
 */
os.command.TransformVectors.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state.';
    return false;
  }

  if (!this.source) {
    this.state = os.command.State.ERROR;
    this.details = 'Source projection is not defined';
    return false;
  }

  if (!this.target) {
    this.state = os.command.State.ERROR;
    this.details = 'Target projection is not defined';
    return false;
  }

  return true;
};


/**
 * @inheritDoc
 */
os.command.TransformVectors.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    var source = ol.proj.get(this.source);
    var target = ol.proj.get(this.target);

    if (source && target) {
      this.transform(source, target);
    }

    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @param {!ol.proj.Projection} sourceProjection
 * @param {!ol.proj.Projection} targetProjection
 * @protected
 */
os.command.TransformVectors.prototype.transform = function(sourceProjection, targetProjection) {
  var layers = os.MapContainer.getInstance().getLayers();
  var tx = os.command.TransformVectors.transform_.bind(null, sourceProjection, targetProjection);

  for (var i = 0, n = layers.length; i < n; i++) {
    var layer = layers[i];

    if (layer instanceof ol.layer.Vector) {
      var source = layer.getSource();

      if (source) {
        var features = source.getFeatures();

        // we can't merely change the features in place because os.source.Vector has an override
        // that removes the listener on feature change (because it is otherwise not used). Instead,
        // we'll remove, transform, and re-add the features.

        if (features.length) {
          source.clear(true);
          var geoms = [];

          for (var j = 0, m = features.length; j < m; j++) {
            var geometry = features[j].getGeometry();
            if (geometry) {
              geoms.push(geometry);

              // if the original geometry is the same, don't re-add it or it will be transformed twice. this will
              // happen for any geometry that is not interpolated.
              var origGeometry = /** @type {ol.geom.Geometry} */ (features[j].get(os.interpolate.ORIGINAL_GEOM_FIELD));
              if (origGeometry !== geometry) {
                geoms.push(origGeometry);
              }
            }

            geoms.push(/** @type {(os.geom.Ellipse|undefined)} */ (features[j].get(os.data.RecordField.ELLIPSE)));
            geoms.push(/** @type {(ol.geom.LineString|undefined)} */
                (features[j].get(os.data.RecordField.LINE_OF_BEARING)));

            // find geometries in the styles and convert those too
            var styles = features[j].getStyle();
            if (styles) {
              if (!goog.isArray(styles)) {
                styles = [styles];
              }

              for (var s = 0, ss = styles.length; s < ss; s++) {
                geoms.push(styles[s].getGeometry());
              }
            }
          }

          geoms.forEach(tx);
          source.addFeatures(features);
        }
      }
    }
  }
};


/**
 * @param {!ol.proj.Projection} sourceProjection
 * @param {!ol.proj.Projection} targetProjection
 * @param {?ol.geom.Geometry|undefined} geom
 * @private
 */
os.command.TransformVectors.transform_ = function(sourceProjection, targetProjection, geom) {
  if (geom && geom instanceof ol.geom.Geometry) {
    geom.transform(sourceProjection, os.proj.EPSG4326);
    os.geo.normalizeGeometryCoordinates(geom);
    geom.transform(os.proj.EPSG4326, targetProjection);
  }
};



/**
 * @inheritDoc
 */
os.command.TransformVectors.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var source = ol.proj.get(this.source);
  var target = ol.proj.get(this.target);

  if (source && target) {
    this.transform(target, source);
  }

  this.state = os.command.State.READY;
  return true;
};
