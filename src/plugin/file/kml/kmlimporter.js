goog.declareModuleId('plugin.file.kml.KMLImporter');

import AlertEventSeverity from '../../../os/alert/alerteventseverity.js';
import AlertManager from '../../../os/alert/alertmanager.js';
import * as osFeature from '../../../os/feature/feature.js';
import FeatureImporter from '../../../os/im/featureimporter.js';
import * as osStyle from '../../../os/style/style.js';
import StyleField from '../../../os/style/stylefield.js';
import StyleType from '../../../os/style/styletype.js';
import SlickTreeNode from '../../../os/ui/slick/slicktreenode.js';


/**
 * Imports a set of KML items
 *
 * @extends {FeatureImporter<KMLNode>}
 */
export default class KMLImporter extends FeatureImporter {
  /**
   * Constructor.
   * @param {KMLParser} parser The parser
   */
  constructor(parser) {
    super(parser);

    /**
     * The last parsed KML root node
     * @type {KMLNode}
     * @private
     */
    this.rootNode_ = null;

    /**
     * Columns detected in the KML
     * @type {Array<!ColumnDefinition>}
     * @private
     */
    this.columns_ = null;

    /**
     * minimum refresh interval from the NetworkLinkControl
     * @type {number}
     * @private
     */
    this.minRefreshPeriod_ = 0;

    /**
     * Number of invalid polygons detected on import
     * @type {number}
     * @private
     */
    this.invalidCount_ = 0;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.rootNode_ = null;
  }

  /**
   * Get the root KML tree node.
   * @param {boolean=} opt_clear If the root node should be cleared on call.
   * @return {KMLNode}
   */
  getRootNode(opt_clear = false) {
    var rootNode = this.rootNode_;
    if (opt_clear) {
      this.rootNode_ = null;
    }
    return rootNode;
  }

  /**
   * Get columns detected in the KML.
   *
   * @return {Array<!ColumnDefinition>}
   */
  getColumns() {
    return this.columns_;
  }

  /**
   * Get columns detected in the KML.
   *
   * @return {number}
   */
  getMinRefreshPeriod() {
    return this.minRefreshPeriod_;
  }

  /**
   * @inheritDoc
   */
  onParserReady(opt_event) {
    // if a KML tree was previously parsed, set it on the parser so the tree is merged
    /** @type {KMLParser} */ (this.parser).setRootNode(this.rootNode_);

    super.onParserReady(opt_event);
  }

  /**
   * @inheritDoc
   */
  onParsingComplete(opt_event) {
    // grab the newly parsed KML tree before it's removed by parser cleanup
    const kmlParser = /** @type {KMLParser} */ (this.parser);
    this.rootNode_ = kmlParser.getRootNode();
    this.columns_ = kmlParser.getColumns();
    this.minRefreshPeriod_ = kmlParser.getMinRefreshPeriod();

    if (this.invalidCount_ > 0) {
      var msg = this.invalidCount_ === 1 ? 'An area was' : (this.invalidCount_ + ' areas were');
      AlertManager.getInstance().sendAlert(msg + ' removed from the original due to invalid topology. One possible ' +
          ' reason is a repeating or invalid coordinate.',
      AlertEventSeverity.WARNING);
    }

    super.onParsingComplete(opt_event);
  }

  /**
   * @inheritDoc
   */
  sanitize(item) {
    var feature = null;
    if ((item instanceof SlickTreeNode) && (item.getFeature())) {
      feature = /** @type {ol.Feature} */ (item.getFeature());
    }

    if (feature) {
      this.invalidCount_ += osFeature.validateGeometries(feature, false);
      super.sanitize(feature);
    }
  }

  /**
   * @inheritDoc
   */
  performMappings(item) {
    var feature = null;
    if (item.getFeature()) {
      feature = /** @type {ol.Feature} */ (item.getFeature());
    }

    if (feature && (this.mappings || this.autoMappings)) {
      super.performMappings(feature);

      // line dash isn't part of kml spec, translate it here
      var lineDash = /** @type {string} */ (feature.get(StyleField.LINE_DASH));
      if (lineDash) {
        var dash = /** @type {Array<number>} */ (JSON.parse(lineDash));
        var config = osStyle.getBaseFeatureConfig(feature);
        osStyle.setConfigLineDash(config, dash);
        feature.set(StyleType.FEATURE, config);
      }
    }
  }
}
