goog.module('plugin.places.ui.PlacesNodeUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const DefaultLayerNodeUICtrl = goog.require('os.ui.node.DefaultLayerNodeUICtrl');
const {createOrEditFolder, createOrEditPlace} = goog.require('plugin.file.kml.ui');
const {Icon, getPlacesRoot} = goog.require('plugin.places');
const PlacesManager = goog.require('plugin.places.PlacesManager');

const {FolderOptions, PlacemarkOptions} = goog.requireType('plugin.file.kml.ui');
const KMLLayerNode = goog.requireType('plugin.file.kml.ui.KMLLayerNode');


/**
 * @type {string}
 */
const template = `
  <span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">
    <span ng-if="nodeUi.canEdit()" ng-click="nodeUi.addFolder()">
      <i class="fa ${Icon.FOLDER} fa-fw c-glyph" title="Create a new folder"></i>
    </span>
    <span ng-if="nodeUi.canEdit()" ng-click="nodeUi.addPlace()">
      <i class="fa ${Icon.PLACEMARK} fa-fw c-glyph" title="Create a new place"></i>
    </span>
    <span ng-if="nodeUi.canEdit()" ng-click="nodeUi.addPlace(true)">
      <i class="fa ${Icon.ANNOTATION} fa-fw c-glyph" title="Create a new place with a text box"></i>
    </span>
    <span ng-if="nodeUi.isRemovable()" ng-click="nodeUi.remove()">
      <i class="fa fa-times fa-fw c-glyph" title="Remove the place></i>
    </span>
  </span>
`;


/**
 * The Places selected/highlighted node UI directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: template,
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'placesnodeui';


/**
 * Add the directive to the module
 */
Module.directive('placesnodeui', [directive]);



/**
 * Controller for the Places selected/highlighted node UI
 * @unrestricted
 */
class Controller extends DefaultLayerNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }

  /**
   * Add a new folder.
   *
   * @export
   */
  addFolder() {
    var node = /** @type {KMLLayerNode} */ (this.scope['item']);
    if (node) {
      var rootNode = getPlacesRoot(node);
      if (rootNode) {
        createOrEditFolder(/** @type {!FolderOptions} */ ({
          'parent': rootNode
        }));
      }
    }
  }

  /**
   * Add a new place.
   *
   * @param {boolean=} opt_annotation Whether the place is an annotation.
   * @export
   */
  addPlace(opt_annotation) {
    var node = /** @type {KMLLayerNode} */ (this.scope['item']);
    if (node) {
      var rootNode = opt_annotation ? PlacesManager.getInstance().getAnnotationsFolder() : getPlacesRoot(node);
      if (rootNode) {
        createOrEditPlace(/** @type {!PlacemarkOptions} */ ({
          'parent': rootNode,
          'annotation': opt_annotation
        }));
      }
    }
  }

  /**
   * If the node can be edited.
   *
   * @return {boolean}
   * @export
   */
  canEdit() {
    var node = /** @type {KMLLayerNode} */ (this.scope['item']);
    return node ? node.isEditable() : false;
  }

  /**
   * @inheritDoc
   * @export
   */
  remove() {
    PlacesManager.getInstance().removeLayer();
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
