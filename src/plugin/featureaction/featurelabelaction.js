goog.declareModuleId('plugin.im.action.feature.LabelAction');

import * as osColor from '../../os/color.js';
import FeatureEventType from '../../os/data/featureeventtype.js';
import PropertyChangeEvent from '../../os/events/propertychangeevent.js';
import {getLayer, getSource} from '../../os/feature/feature.js';
import AbstractImportAction from '../../os/im/action/abstractimportaction.js';
import * as osObject from '../../os/object/object.js';
import PropertyChange from '../../os/source/propertychange.js';
import * as osStyleLabel from '../../os/style/label.js';
import * as osStyle from '../../os/style/style.js';
import StyleField from '../../os/style/stylefield.js';
import StyleType from '../../os/style/styletype.js';
import {Controller as FeatureEditCtrl} from '../../os/ui/featureedit.js';
import * as osXml from '../../os/xml.js';
import {StyleType as FAStyleType} from './featureaction.js';
import {directiveTag as configUi, setDefaultConfig} from './ui/featurelabelactionconfig.js';

/**
 * Tag names used for XML persistence.
 * @enum {string}
 */
const LabelActionTagName = {
  COLOR: 'color',
  CUSTOM_NAME: 'customName',
  CUSTOM_VALUE: 'customValue',
  LABEL: 'label',
  LABELS: 'labels',
  SIZE: 'size'
};


/**
 * Import action that sets the label for a {@link ol.Feature}.
 *
 * @extends {AbstractImportAction<ol.Feature>}
 */
export default class LabelAction extends AbstractImportAction {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.id = LabelAction.ID;
    this.label = LabelAction.LABEL;
    this.configUI = configUi;
    this.xmlType = LabelAction.ID;

    /**
     * The feature label config.
     * @type {!Object}
     */
    this.labelConfig = /** @type {!Object} */ (osObject.unsafeClone(LabelAction.DEFAULT_CONFIG));
  }

  /**
   * Undo all feature action label changes, resetting to the user/default layer settings.
   *
   * @override
   */
  reset(items) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item && this.isFeatureLabeled(item)) {
        // reset the original feature config
        var originalConfig = /** @type {Array|Object|undefined} */ (item.get(FAStyleType.ORIGINAL));
        item.set(StyleType.FEATURE, originalConfig, true);
      }
    }

    return (
      /** {ImportActionCallbackConfig} */
      {
        labelUpdateShown: false,
        notifyStyleChange: !!(getLayer(items[0])),
        setColor: false,
        setFeaturesStyle: true
      }
    );
  }

  /**
   * @inheritDoc
   */
  execute(items) {
    var customName = this.labelConfig['customName'] || undefined;
    var customValue = this.labelConfig['customValue'] || undefined;

    var labels = /** @type {Array<!osStyleLabel.LabelConfig>} */ (this.labelConfig['labels']);
    labels = osStyleLabel.filterValid(labels);

    var labelColor = osStyle.toRgbaString(this.labelConfig['color'] || osStyle.DEFAULT_LAYER_COLOR);
    var labelSize = parseInt(this.labelConfig['size'], 10) || osStyleLabel.DEFAULT_SIZE;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item) {
        // update label fields on the feature if there is at least one valid label config defined
        if (labels.length > 0) {
          // get the existing feature config or create a new one
          var originalConfig = /** @type {Array|Object|undefined} */ (item.get(StyleType.FEATURE));
          var featureConfig = osObject.unsafeClone(originalConfig) || {};

          // flag this as a temporary style config
          featureConfig['temporary'] = true;

          // apply label config
          if (Array.isArray(featureConfig)) {
            for (var j = 0; j < featureConfig.length; j++) {
              featureConfig[j][StyleField.LABELS] = labels;
              featureConfig[j][StyleField.LABEL_COLOR] = labelColor;
              featureConfig[j][StyleField.LABEL_SIZE] = labelSize;
            }
          } else {
            featureConfig[StyleField.LABELS] = labels;
            featureConfig[StyleField.LABEL_COLOR] = labelColor;
            featureConfig[StyleField.LABEL_SIZE] = labelSize;
          }

          // save the feature config(s) to the feature, and persist the label config to the feature
          item.set(StyleType.FEATURE, featureConfig, true);
          item.set(LabelAction.FEATURE_ID, this.uid, true);
          FeatureEditCtrl.persistFeatureLabels(item);

          if (originalConfig != null && !originalConfig['temporary'] &&
            item.get(FAStyleType.ORIGINAL) == null) {
            // if the original config isn't already set, add a reference back to it
            item.set(FAStyleType.ORIGINAL, originalConfig, true);
          }
        }

        // if a custom column was configured, set the value on the feature
        if (customName && customValue) {
          var oldVal = item.get(customName);
          item.set(customName, customValue);
          item.dispatchFeatureEvent(FeatureEventType.VALUECHANGE, customValue, oldVal);
        }
      }
    }

    // if a custom column was configured, add it to the source
    if (customName && customValue) {
      var source = getSource(items[0]);
      if (source) {
        source.addColumn(customName, undefined, true, true);
        source.dispatchEvent(new PropertyChangeEvent(PropertyChange.DATA));
      }
    }

    return (
      /** {ImportActionCallbackConfig} */
      {
        labelUpdateShown: true,
        notifyStyleChange: !!(getLayer(items[0])),
        setColor: false,
        setFeaturesStyle: true
      }
    );
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to);
    opt_to['labelConfig'] = this.labelConfig;

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    var labelConfig = /** @type {Object|undefined} */ (config['labelConfig']);
    if (labelConfig) {
      // create a new object in the same window context as this object
      this.labelConfig = {};
      osObject.merge(labelConfig, this.labelConfig);
    }
  }

  /**
   * @inheritDoc
   */
  toXml() {
    var element = super.toXml();

    var color = /** @type {string|undefined} */ (this.labelConfig['color']);
    if (color) {
      osXml.appendElement(LabelActionTagName.COLOR, element, osColor.toHexString(color));
    }

    var size = /** @type {number|undefined} */ (this.labelConfig['size']);
    if (size != null) {
      osXml.appendElement(LabelActionTagName.SIZE, element, String(size));
    }

    var customName = /** @type {string|undefined} */ (this.labelConfig['customName']);
    var customValue = /** @type {string|undefined} */ (this.labelConfig['customValue']);
    if (customName && customValue) {
      osXml.appendElement(LabelActionTagName.CUSTOM_NAME, element, customName);
      osXml.appendElement(LabelActionTagName.CUSTOM_VALUE, element, customValue);
    }

    var labels = /** @type {Array<!osStyleLabel.LabelConfig>} */ (this.labelConfig['labels']);
    labels = osStyleLabel.filterValid(labels);

    if (labels.length > 0) {
      var labelsEl = osXml.appendElement(LabelActionTagName.LABELS, element);
      for (var i = 0; i < labels.length; i++) {
        var label = labels[i];
        osXml.appendElement(LabelActionTagName.LABEL, labelsEl, undefined, {
          'column': label['column'],
          'showColumn': String(label['showColumn'])
        });
      }
    }

    return element;
  }

  /**
   * @inheritDoc
   */
  fromXml(xml) {
    var labelConfig = /** @type {!Object} */ (osObject.unsafeClone(LabelAction.DEFAULT_CONFIG));

    if (xml) {
      var color = osXml.getChildValue(xml, LabelActionTagName.COLOR);
      if (osColor.isColorString(color)) {
        labelConfig['color'] = osStyle.toRgbaString(color);
      }

      var size = parseFloat(osXml.getChildValue(xml, LabelActionTagName.SIZE));
      if (!isNaN(size)) {
        labelConfig['size'] = size;
      }

      var customName = osXml.getChildValue(xml, LabelActionTagName.CUSTOM_NAME);
      var customValue = osXml.getChildValue(xml, LabelActionTagName.CUSTOM_VALUE);
      if (customName && customValue) {
        labelConfig['customName'] = customName;
        labelConfig['customValue'] = customValue;
      }

      var labelEls = xml.querySelectorAll(LabelActionTagName.LABEL);
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
  }

  /**
   * If a feature is styled by the action.
   *
   * @param {!ol.Feature} feature The feature.
   * @return {boolean} If the feature is using this style action.
   *
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  isFeatureLabeled(feature) {
    return feature.values_[LabelAction.FEATURE_ID] === this.uid;
  }
}


/**
 * Action identifier.
 * @type {string}
 * @const
 */
LabelAction.ID = 'featureLabelAction';


/**
 * Property set on features to indicate they're using a feature label action.
 * @type {string}
 * @const
 */
LabelAction.FEATURE_ID = '_featureLabelAction';


/**
 * Action label.
 * @type {string}
 * @const
 */
LabelAction.LABEL = 'Set Label';


/**
 * The default label configuration.
 * @type {!Object}
 * @const
 */
LabelAction.DEFAULT_CONFIG = {
  'color': osStyle.DEFAULT_LAYER_COLOR,
  'size': osStyleLabel.DEFAULT_SIZE,
  'labels': [osStyleLabel.cloneConfig()],
  'customName': '',
  'customValue': ''
};
setDefaultConfig(LabelAction.DEFAULT_CONFIG);
