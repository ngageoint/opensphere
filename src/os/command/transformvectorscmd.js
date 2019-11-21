goog.provide('os.command.TransformVectors');

goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.geo2');



/**
 * Abstract command for performing selections on a source
 *
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
 *
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

          for (var j = 0, m = features.length; j < m; j++) {
            os.feature.forEachGeometry(features[j], tx);

            // check cached geoms just in case
            tx(/** @type {(os.geom.Ellipse|undefined)} */ (features[j].get(os.data.RecordField.ELLIPSE)));
            tx(/** @type {(ol.geom.LineString|undefined)} */ (features[j].get(os.data.RecordField.LINE_OF_BEARING)));
            tx(/** @type {(ol.geom.GeometryCollection|undefined)} */ (features[j].get(os.data.RecordField.RING)));
          }

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
    geom.transform(sourceProjection, targetProjection);
    os.geo2.normalizeGeometryCoordinates(geom, undefined, targetProjection);
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
