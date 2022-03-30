goog.declareModuleId('os.ui.query.EditAreaUI');

import '../im/basicinfo.js';
import CommandProcessor from '../../command/commandprocessor.js';
import {ROOT} from '../../os.js';
import {getAreaManager} from '../../query/queryinstance.js';
import Module from '../module.js';
import WindowEventType from '../windoweventtype.js';
import AreaImportCtrl from './areaimportctrl.js';
import AreaAdd from './cmd/areaaddcmd.js';
import {applyMappings, createMappingsFromConfig} from './query.js';

/**
 * The edit area directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/query/editarea.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'editarea';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for edit area window
 * @unrestricted
 */
export class Controller extends AreaImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    this.config = $scope['config'] = {
      'title': null,
      'description': null,
      'tags': null
    };

    var feature = /** @type {!Feature} */ (this.scope['feature']);
    if (feature) {
      // used by basicinfo to get data samples from columns
      this.config['features'] = [feature];

      // 'title' is preferred for areas, but some features use 'name' instead. these are typically temporary areas.
      if (feature.get('title')) {
        this.config['title'] = feature.get('title');
      } else {
        this.config['title'] = feature.get('name');
      }
      this.config['description'] = feature.get('description');
      this.config['tags'] = feature.get('tags');
    }

    $timeout(function() {
      $scope.$emit(WindowEventType.READY);
    });
  }

  /**
   * Finish the dialog
   *
   * @export
   */
  accept() {
    var feature = /** @type {!Feature} */ (this.scope['feature']);
    if (feature) {
      // apply mappings from the configuration
      var mappings = createMappingsFromConfig(this.config);
      applyMappings(feature, mappings);

      // if we save it, it should not longer be a temporary area
      feature.set('temp', undefined);

      var am = getAreaManager();
      if (!am.get(feature)) {
        // new areas should be on the stack
        var cmd = new AreaAdd(feature);
        CommandProcessor.getInstance().addCommand(cmd);
      } else {
        // area edits don't go on the stack
        am.add(feature);
      }
    }

    this.close();
  }
}
