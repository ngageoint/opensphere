goog.provide('plugin.im.action.feature.LabelAction');

goog.require('os.color');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.feature');
goog.require('os.im.action.AbstractImportAction');
goog.require('os.object');
goog.require('os.source.PropertyChange');
goog.require('os.style');
goog.require('os.style.label');
goog.require('os.ui.FeatureEditCtrl');
goog.require('os.ui.im.action.EventType');
goog.require('os.xml');


/**
 * Tag names used for XML persistence.
 * @enum {string}
 */
plugin.im.action.feature.LabelActionTagName = {
  COLOR: 'color',
  CUSTOM_NAME: 'customName',
  CUSTOM_VALUE: 'customValue',
  LABEL: 'label',
  LABELS: 'labels',
  SIZE: 'size'
};



/**
 * Import action that sets the label for a {@link ol.Feature}.
 * @extends {os.im.action.AbstractImportAction<ol.Feature>}
 * @constructor
 */
plugin.im.action.feature.LabelAction = function() {
  plugin.im.action.feature.LabelAction.base(this, 'constructor');

  this.id = plugin.im.action.feature.LabelAction.ID;
  this.label = plugin.im.action.feature.LabelAction.LABEL;
  this.configUI = plugin.im.action.feature.LabelAction.CONFIG_UI;
  this.xmlType = plugin.im.action.feature.LabelAction.ID;

  /**
   * The feature label config.
   * @type {!Object}
   */
  this.labelConfig = /** @type {!Object} */ (os.object.unsafeClone(
      plugin.im.action.feature.LabelAction.DEFAULT_CONFIG));
};
goog.inherits(plugin.im.action.feature.LabelAction, os.im.action.AbstractImportAction);


/**
 * Action identifier.
 * @type {string}
 * @const
 */
plugin.im.action.feature.LabelAction.ID = 'featureLabelAction';


/**
 * Action label.
 * @type {string}
 * @const
 */
plugin.im.action.feature.LabelAction.LABEL = 'Set Label';


/**
 * Action edit UI.
 * @type {string}
 * @const
 */
plugin.im.action.feature.LabelAction.CONFIG_UI = 'featurelabelaction';


/**
 * The default label configuration.
 * @type {!Object}
 * @const
 */
plugin.im.action.feature.LabelAction.DEFAULT_CONFIG = {
  'color': os.style.DEFAULT_LAYER_COLOR,
  'size': os.style.label.DEFAULT_SIZE,
  'labels': [os.style.label.cloneConfig()],
  'customName': '',
  'customValue': ''
};


/**
 * Undo all feature action label changes, reset to the user/default layer settings
 * @param {string} entryType feature action entry type
 * @param {!Array<ol.Feature>} items The items.
 */
plugin.im.action.feature.LabelAction.prototype.reset = function(entryType, items) {
  var dm = os.data.DataManager.getInstance();
  var source = dm.getSource(entryType);
  var layerConfig = os.style.StyleManager.getInstance().getLayerConfig(source.getId());

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item) {
      item.set(os.style.StyleType.FEATURE, layerConfig, true);
    }
  }

  os.style.setFeaturesStyle(items);

  // notify that the layer needs to be updated
  var layer = os.feature.getLayer(items[0]);
  if (layer) {
    os.style.notifyStyleChange(layer, items);
  }
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.LabelAction.prototype.execute = function(items) {
  var customName = this.labelConfig['customName'] || undefined;
  var customValue = this.labelConfig['customValue'] || undefined;

  var labels = /** @type {Array<!os.style.label.LabelConfig>} */ (this.labelConfig['labels']);
  labels = os.style.label.filterValid(labels);

  var labelColor = os.style.toRgbaString(this.labelConfig['color'] || os.style.DEFAULT_LAYER_COLOR);
  var labelSize = parseInt(this.labelConfig['size'], 10) || os.style.label.DEFAULT_SIZE;

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item) {
      // update label fields on the feature if there is at least one valid label config defined
      if (labels.length > 0) {
        // get the existing feature config or create a new one
        var featureConfig = /** @type {Array|Object|undefined} */ (item.get(os.style.StyleType.FEATURE)) || {};

        // apply label config
        if (goog.isArray(featureConfig)) {
          for (var j = 0; j < featureConfig.length; j++) {
            featureConfig[j][os.style.StyleField.LABELS] = labels;
            featureConfig[j][os.style.StyleField.LABEL_COLOR] = labelColor;
            featureConfig[j][os.style.StyleField.LABEL_SIZE] = labelSize;
          }
        } else {
          featureConfig[os.style.StyleField.LABELS] = labels;
          featureConfig[os.style.StyleField.LABEL_COLOR] = labelColor;
          featureConfig[os.style.StyleField.LABEL_SIZE] = labelSize;
        }

        // save the feature config(s) to the feature, and persist the label config to the feature
        item.set(os.style.StyleType.FEATURE, featureConfig, true);
        os.ui.FeatureEditCtrl.persistFeatureLabels(item);
      }

      // if a custom column was configured, set the value on the feature
      if (customName && customValue) {
        var oldVal = item.get(customName);
        item.set(customName, customValue);
        item.dispatchFeatureEvent(os.data.FeatureEventType.VALUECHANGE, customValue, oldVal);
      }
    }
  }

  // if a custom column was configured, add it to the source
  if (customName && customValue) {
    var source = os.feature.getSource(items[0]);
    if (source) {
      source.addColumn(customName, undefined, true, true);
      source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.DATA));
    }
  }

  // update the style on all features
  os.style.setFeaturesStyle(items);

  // notify that the layer needs to be updated
  var layer = os.feature.getLayer(items[0]);
  if (layer) {
    os.style.notifyStyleChange(layer, items);
  }

  // kick off label hit detection
  os.style.label.updateShown();
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.LabelAction.prototype.persist = function(opt_to) {
  opt_to = plugin.im.action.feature.LabelAction.base(this, 'persist', opt_to);
  opt_to['labelConfig'] = this.labelConfig;

  return opt_to;
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.LabelAction.prototype.restore = function(config) {
  var labelConfig = /** @type {Object|undefined} */ (config['labelConfig']);
  if (labelConfig) {
    // create a new object in the same window context as this object
    this.labelConfig = {};
    os.object.merge(labelConfig, this.labelConfig);
  }
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.LabelAction.prototype.toXml = function() {
  var element = plugin.im.action.feature.LabelAction.base(this, 'toXml');

  var color = /** @type {string|undefined} */ (this.labelConfig['color']);
  if (color) {
    os.xml.appendElement(plugin.im.action.feature.LabelActionTagName.COLOR, element, os.color.toHexString(color));
  }

  var size = /** @type {number|undefined} */ (this.labelConfig['size']);
  if (size != null) {
    os.xml.appendElement(plugin.im.action.feature.LabelActionTagName.SIZE, element, String(size));
  }

  var customName = /** @type {string|undefined} */ (this.labelConfig['customName']);
  var customValue = /** @type {string|undefined} */ (this.labelConfig['customValue']);
  if (customName && customValue) {
    os.xml.appendElement(plugin.im.action.feature.LabelActionTagName.CUSTOM_NAME, element, customName);
    os.xml.appendElement(plugin.im.action.feature.LabelActionTagName.CUSTOM_VALUE, element, customValue);
  }

  var labels = /** @type {Array<!os.style.label.LabelConfig>} */ (this.labelConfig['labels']);
  labels = os.style.label.filterValid(labels);

  if (labels.length > 0) {
    var labelsEl = os.xml.appendElement(plugin.im.action.feature.LabelActionTagName.LABELS, element);
    for (var i = 0; i < labels.length; i++) {
      var label = labels[i];
      os.xml.appendElement(plugin.im.action.feature.LabelActionTagName.LABEL, labelsEl, undefined, {
        'column': label['column'],
        'showColumn': String(label['showColumn'])
      });
    }
  }

  return element;
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.LabelAction.prototype.fromXml = function(xml) {
  var labelConfig = /** @type {!Object} */ (os.object.unsafeClone(
      plugin.im.action.feature.LabelAction.DEFAULT_CONFIG));

  if (xml) {
    var color = os.xml.getChildValue(xml, plugin.im.action.feature.LabelActionTagName.COLOR);
    if (os.color.isColorString(color)) {
      labelConfig['color'] = os.style.toRgbaString(color);
    }

    var size = parseFloat(os.xml.getChildValue(xml, plugin.im.action.feature.LabelActionTagName.SIZE));
    if (!isNaN(size)) {
      labelConfig['size'] = size;
    }

    var customName = os.xml.getChildValue(xml, plugin.im.action.feature.LabelActionTagName.CUSTOM_NAME);
    var customValue = os.xml.getChildValue(xml, plugin.im.action.feature.LabelActionTagName.CUSTOM_VALUE);
    if (customName && customValue) {
      labelConfig['customName'] = customName;
      labelConfig['customValue'] = customValue;
    }

    var labelEls = xml.querySelectorAll(plugin.im.action.feature.LabelActionTagName.LABEL);
    if (labelEls && labelEls.length > 0) {
      var labels = [];

      for (var i = 0; i < labelEls.length; i++) {
        var labelEl = labelEls[i];
        var column = labelEl.getAttribute('column');
        var showColumn = labelEl.getAttribute('showColumn') == 'true';
        if (column) {
          labels.push({
            'column': column,
            'showColumn': showColumn
          });
        }
      }

      if (labels.length > 0) {
        labelConfig['labels'] = labels;
      }
    }
  }

  this.labelConfig = labelConfig;
};
