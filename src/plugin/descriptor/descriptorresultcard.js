goog.declareModuleId('plugin.descriptor.ResultCardUI');

import DescriptorEvent from '../../os/data/descriptorevent.js';
import DescriptorEventType from '../../os/data/descriptoreventtype.js';
import * as dispatcher from '../../os/dispatcher.js';
import {ROOT} from '../../os/os.js';
import Module from '../../os/ui/module.js';

/**
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/plugin/descriptor/resultcard.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'descriptorresultcard';


/**
 * Register the beresultcard directive.
 */
Module.directive('descriptorresultcard', [directive]);



/**
 * Controller for the beresultcard directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    this.scope_['short'] = false;
    this.scope_['showFullDescription'] = false;
    this.updateIcons();

    /**
     * @type {number|undefined}
     */
    this['featureCount'] = undefined;

    var result = /** @type {plugin.descriptor.DescriptorResult} */ (this.scope_['result']);
    if (result && result.featureCount != null) {
      this['featureCount'] = result.featureCount;
    }

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up the controller.
   *
   * @private
   */
  destroy_() {
    this.element_ = null;
    this.scope_ = null;
  }

  /**
   * Updates icons
   */
  updateIcons() {
    var icons = this.element_.find('.js-card-title-icons');
    // clear
    icons.children().remove();
    // add
    icons.prepend(this.getField('icons'));
  }

  /**
   * @return {IDataDescriptor} the descriptor
   */
  getDescriptor() {
    var result = /** @type {plugin.descriptor.DescriptorResult} */ (this.scope_['result']);
    return result ? result.getResult() : null;
  }

  /**
   * Get a field from the result.
   *
   * @param {string} field
   * @return {*}
   * @export
   */
  getField(field) {
    var d = this.getDescriptor();

    if (d) {
      switch (field.toLowerCase()) {
        case 'id': return d.getId();
        case 'active': return d.isActive();
        case 'icons': return d.getIcons();
        case 'provider': return d.getProvider();
        case 'tags': return d.getTags().join(', ');
        case 'title': return d.getTitle();
        case 'type': return d.getSearchType();
        case 'description': return d.getDescription();
        default: break;
      }
    }

    return '';
  }

  /**
   * Toggles the descriptor
   * @param {Event} event The click event.
   *
   * @export
   */
  toggle(event) {
    event.preventDefault();
    event.stopPropagation();

    var d = this.getDescriptor();

    if (d) {
      d.setActive(!d.isActive());

      if (d.isActive()) {
        dispatcher.getInstance().dispatchEvent(new DescriptorEvent(DescriptorEventType.USER_TOGGLED, d));
      }
    }
  }
}
