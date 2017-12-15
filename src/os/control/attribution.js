goog.provide('os.control.Attribution');

goog.require('ol.control.Attribution');

/**
 * @constructor
 * @extends {ol.control.Attribution}
 * @param {olx.control.AttributionOptions=} opt_options Attribution options.
 */
os.control.Attribution = function(opt_options) {
  os.control.Attribution.base(this, 'constructor', opt_options);
};
goog.inherits(os.control.Attribution, ol.control.Attribution);


/**
 * @inheritDoc
 */
os.control.Attribution.prototype.getSourceAttributions = function(frameState) {
  var layerStatesArray = frameState.layerStatesArray;

  /** @type {Object.<string, ol.Attribution>} */
  var attributions = ol.obj.assign({}, frameState.attributions);

  /** @type {Object.<string, ol.Attribution>} */
  var hiddenAttributions = {};

  for (var i = 0, ii = layerStatesArray.length; i < ii; i++) {
    var source = layerStatesArray[i].layer.getSource();
    if (!source) {
      continue;
    }

    var sourceAttributions = source.getAttributions();
    if (!sourceAttributions) {
      continue;
    }

    for (var j = 0, jj = sourceAttributions.length; j < jj; j++) {
      var sourceAttribution = sourceAttributions[j];
      var sourceAttributionKey = ol.getUid(sourceAttribution).toString();

      if (layerStatesArray[i].layer.getVisible()) {
        attributions[sourceAttributionKey] = sourceAttribution;
      } else {
        hiddenAttributions[sourceAttributionKey] = sourceAttribution;
      }
    }
  }

  return [attributions, hiddenAttributions];
};


/**
 * @suppress {accessControls}
 */
ol.control.Attribution.prototype.insertLogos_ = goog.nullFunction;
