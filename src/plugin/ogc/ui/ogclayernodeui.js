goog.declareModuleId('plugin.ogc.ui.OGCLayerNodeUI');

const Deferred = goog.require('goog.async.Deferred');
const DataManager = goog.require('os.data.DataManager');
const osImplements = goog.require('os.implements');
const Module = goog.require('os.ui.Module');
const {
  Controller: DefaultLayerNodeUICtrl,
  directive: defaultLayerNodeUIDirective
} = goog.require('os.ui.node.DefaultLayerNodeUI');
const IFeatureTypeDescriptor = goog.require('os.ui.ogc.IFeatureTypeDescriptor');
const {Controller: ChooseTimeColumnController} = goog.require('plugin.ogc.ui.ChooseTimeColumnUI');


/**
 * @type {string}
 */
const template = '<span ng-if="chooseTime" ng-click="nodeUi.chooseTime()">' +
    '<i class="fa fa-clock-o fa-fw c-glyph" title="Choose Time Columns"></i></span>';


/**
 * @return {angular.Directive}
 */
export const directive = () => {
  var dir = defaultLayerNodeUIDirective();
  dir.template = dir.template.replace('>', '>' + template);
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'ogclayernodeui';


/**
 * Add the directive tot he module
 */
Module.directive('ogclayernodeui', [directive]);


/**
 * @unrestricted
 */
export class Controller extends DefaultLayerNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * The descriptor for this layer
     * @type {os.data.IDataDescriptor}
     * @private
     */
    this.descriptor_ = DataManager.getInstance().getDescriptor(this.getLayerId());

    var chooseTime = false;

    if (osImplements(this.descriptor_, IFeatureTypeDescriptor.ID)) {
      var featureType = /** @type  {IFeatureTypeDescriptor} */ (this.descriptor_).getFeatureType();
      if (featureType) {
        chooseTime = (featureType.getStartDateColumnName() !== null || featureType.getEndDateColumnName() !== null) &&
          featureType.getTimeColumns().length >= 2;
      }
    }
    $scope['chooseTime'] = chooseTime;
  }

  /**
   * Launch the time column chooser for the layer
   *
   * @export
   */
  chooseTime() {
    var deferred = new Deferred();
    deferred.addCallback(function() {
      this.descriptor_.setActive(false);
      this.descriptor_.setActive(true);
    }, this);
    ChooseTimeColumnController.launch(this.getLayerId(), deferred);
  }
}
