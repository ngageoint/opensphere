goog.module('os.ui.state.StateListUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.ChecklistUI');

const {ROOT} = goog.require('os');
const {getAppName} = goog.require('os.config');
const DataManager = goog.require('os.data.DataManager');
const DescriptorEventType = goog.require('os.data.DescriptorEventType');
const {apply} = goog.require('os.ui');
const ChecklistEvent = goog.require('os.ui.ChecklistEvent');
const Module = goog.require('os.ui.Module');
const AbstractStateDescriptor = goog.require('os.ui.state.AbstractStateDescriptor');
const StateListEvent = goog.require('os.ui.state.StateListEvent');

const DescriptorEvent = goog.requireType('os.data.DescriptorEvent');

/**
 * The statelist directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  scope: {
    'initStates': '&',
    'required': '@'
  },
  templateUrl: ROOT + 'views/state/statelist.html',
  controller: Controller,
  controllerAs: 'statelist'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'statelist';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the statelist directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;
    $scope['appName'] = getAppName('the application');

    /**
     * @type {number}
     */
    this['count'] = 0;

    /**
     * @type {!Array<!osx.ChecklistItem>}
     */
    this['stateItems'] = [];

    this.initStates_();
    DataManager.getInstance().listen(DescriptorEventType.ADD_DESCRIPTOR, this.onDescriptorAdd_, false, this);
    DataManager.getInstance().listen(DescriptorEventType.REMOVE_DESCRIPTOR, this.onDescriptorRemove_, false, this);

    this.scope_.$on(ChecklistEvent.CHANGE + ':statelist', this.onStateListChanged_.bind(this));

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;

    DataManager.getInstance().unlisten(DescriptorEventType.ADD_DESCRIPTOR, this.onDescriptorAdd_, false, this);
    DataManager.getInstance().unlisten(DescriptorEventType.REMOVE_DESCRIPTOR, this.onDescriptorRemove_, false, this);
  }

  /**
   * Create a checklist item from a state descriptor.
   *
   * @param {!os.ui.state.IStateDescriptor} descriptor The state descriptor
   * @param {boolean=} opt_enabled If the item should be enabled
   * @return {!osx.ChecklistItem}
   * @private
   */
  createChecklistItem_(descriptor, opt_enabled) {
    return {
      enabled: opt_enabled !== undefined ? opt_enabled : false,
      label: descriptor.getTitle(),
      item: descriptor
    };
  }

  /**
   * Initialize the states available for export.
   *
   * @private
   */
  initStates_() {
    var enabledStates = this.scope_['initStates']() || [];
    var descriptors = DataManager.getInstance().getDescriptors(AbstractStateDescriptor.ID);
    for (var i = 0, n = descriptors.length; i < n; i++) {
      var descriptor = descriptors[i];
      if (descriptor instanceof AbstractStateDescriptor) {
        var enabled = enabledStates == 'all' || enabledStates.includes(descriptor);
        this['stateItems'].push(this.createChecklistItem_(descriptor, enabled));
      }
    }

    this.updateItems_();
  }

  /**
   * Handle checklist change event.
   *
   * @param {angular.Scope.Event} event
   * @private
   */
  onStateListChanged_(event) {
    event.stopPropagation();
    this.updateItems_();
  }

  /**
   * Handle a source being added to the data manager.
   *
   * @param {DescriptorEvent} event The event
   * @private
   */
  onDescriptorAdd_(event) {
    var descriptor = event.descriptor;
    if (descriptor instanceof AbstractStateDescriptor) {
      // if a new state is created while this list is displayed, assume the user wanted to enable it
      this['stateItems'].push(this.createChecklistItem_(descriptor, true));
      this.updateItems_();
    }
  }

  /**
   * Handle a source being removed from the data manager.
   *
   * @param {DescriptorEvent} event The event
   * @private
   */
  onDescriptorRemove_(event) {
    var descriptor = event.descriptor;
    if (descriptor instanceof AbstractStateDescriptor) {
      var wasEnabled = false;
      for (var i = 0, n = this['stateItems'].length; i < n; i++) {
        if (this['stateItems'][i].item === descriptor) {
          wasEnabled = this['stateItems'][i].enabled;
          this['stateItems'].splice(i, 1);
          break;
        }
      }

      if (wasEnabled) {
        this.updateItems_();
      } else {
        apply(this.scope_);
      }
    }
  }

  /**
   * Update the items being exported.
   *
   * @private
   */
  updateItems_() {
    this['count'] = 0;

    if (this.scope_) {
      var descriptors = [];
      for (var i = 0, n = this['stateItems'].length; i < n; i++) {
        var stateItem = this['stateItems'][i];
        if (stateItem.enabled) {
          descriptors.push(stateItem.item);
        }
      }

      this['count'] = descriptors.length;

      this.scope_.$emit(StateListEvent.CHANGE, descriptors);
      apply(this.scope_);
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
