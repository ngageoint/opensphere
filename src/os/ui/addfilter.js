goog.module('os.ui.AddFilterUI');

const {getMapContainer} = goog.require('os.map.instance');
const Module = goog.require('os.ui.Module');
const {Controller: AddFilterController, directive: addFilterDirective} = goog.require('os.ui.query.AddFilterUI');


/**
 * The combinator window directive
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var dir = addFilterDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'osaddfilter';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for combinator window
 * @unrestricted
 */
class Controller extends AddFilterController {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    const mapContainer = getMapContainer();
    mapContainer.listen(os.events.LayerEventType.ADD, this.updateLayers, false, this);
    mapContainer.listen(os.events.LayerEventType.REMOVE, this.updateLayers, false, this);
    mapContainer.listen(os.events.LayerEventType.RENAME, this.updateLayers, false, this);
  }

  /**
   * @inheritDoc
   */
  onDestroy() {
    super.onDestroy();

    const mapContainer = getMapContainer();
    mapContainer.unlisten(os.events.LayerEventType.ADD, this.updateLayers, false, this);
    mapContainer.unlisten(os.events.LayerEventType.REMOVE, this.updateLayers, false, this);
    mapContainer.unlisten(os.events.LayerEventType.RENAME, this.updateLayers, false, this);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
