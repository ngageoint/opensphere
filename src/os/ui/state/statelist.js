goog.provide('os.ui.state.StateListCtrl');
goog.provide('os.ui.state.StateListEvent');
goog.provide('os.ui.state.stateListDirective');

goog.require('os.config');
goog.require('os.data.DescriptorEvent');
goog.require('os.data.DescriptorEventType');
goog.require('os.ui.Module');
goog.require('os.ui.checklistDirective');
goog.require('os.ui.state.AbstractStateDescriptor');


/**
 * @enum {string}
 */
os.ui.state.StateListEvent = {
  CHANGE: 'statelist:change'
};


/**
 * The statelist directive
 * @return {angular.Directive}
 */
os.ui.state.stateListDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'initStates': '&',
      'required': '@'
    },
    templateUrl: os.ROOT + 'views/state/statelist.html',
    controller: os.ui.state.StateListCtrl,
    controllerAs: 'statelist'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('statelist', [os.ui.state.stateListDirective]);



/**
 * Controller function for the statelist directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.state.StateListCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;
  $scope['appName'] = os.config.getAppName('the application');

  /**
   * @type {number}
   */
  this['count'] = 0;

  /**
   * @type {!Array<!osx.ChecklistItem>}
   */
  this['stateItems'] = [];

  this.initStates_();
  os.dataManager.listen(os.data.DescriptorEventType.ADD_DESCRIPTOR, this.onDescriptorAdd_, false, this);
  os.dataManager.listen(os.data.DescriptorEventType.REMOVE_DESCRIPTOR, this.onDescriptorRemove_, false, this);

  this.scope_.$on(os.ui.ChecklistEvent.CHANGE + ':statelist', this.onStateListChanged_.bind(this));

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up
 * @private
 */
os.ui.state.StateListCtrl.prototype.destroy_ = function() {
  this.scope_ = null;

  os.dataManager.unlisten(os.data.DescriptorEventType.ADD_DESCRIPTOR, this.onDescriptorAdd_, false, this);
  os.dataManager.unlisten(os.data.DescriptorEventType.REMOVE_DESCRIPTOR, this.onDescriptorRemove_, false, this);
};


/**
 * Create a checklist item from a state descriptor.
 * @param {!os.ui.state.IStateDescriptor} descriptor The state descriptor
 * @param {boolean=} opt_enabled If the item should be enabled
 * @return {!osx.ChecklistItem}
 * @private
 */
os.ui.state.StateListCtrl.prototype.createChecklistItem_ = function(descriptor, opt_enabled) {
  return /** @type {!osx.ChecklistItem} */ ({
    enabled: goog.isDef(opt_enabled) ? opt_enabled : false,
    label: descriptor.getTitle(),
    item: descriptor
  });
};


/**
 * Initialize the states available for export.
 * @private
 */
os.ui.state.StateListCtrl.prototype.initStates_ = function() {
  var enabledStates = this.scope_['initStates']() || [];
  var descriptors = os.dataManager.getDescriptors(os.ui.state.AbstractStateDescriptor.ID);
  for (var i = 0, n = descriptors.length; i < n; i++) {
    var descriptor = descriptors[i];
    if (descriptor instanceof os.ui.state.AbstractStateDescriptor) {
      var enabled = enabledStates == 'all' || goog.array.contains(enabledStates, descriptor);
      this['stateItems'].push(this.createChecklistItem_(descriptor, enabled));
    }
  }

  this.updateItems_();
};


/**
 * Handle checklist change event.
 * @param {angular.Scope.Event} event
 * @private
 */
os.ui.state.StateListCtrl.prototype.onStateListChanged_ = function(event) {
  event.stopPropagation();
  this.updateItems_();
};


/**
 * Handle a source being added to the data manager.
 * @param {os.data.DescriptorEvent} event The event
 * @private
 */
os.ui.state.StateListCtrl.prototype.onDescriptorAdd_ = function(event) {
  var descriptor = event.descriptor;
  if (descriptor instanceof os.ui.state.AbstractStateDescriptor) {
    // if a new state is created while this list is displayed, assume the user wanted to enable it
    this['stateItems'].push(this.createChecklistItem_(descriptor, true));
    this.updateItems_();
  }
};


/**
 * Handle a source being removed from the data manager.
 * @param {os.data.DescriptorEvent} event The event
 * @private
 */
os.ui.state.StateListCtrl.prototype.onDescriptorRemove_ = function(event) {
  var descriptor = event.descriptor;
  if (descriptor instanceof os.ui.state.AbstractStateDescriptor) {
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
      os.ui.apply(this.scope_);
    }
  }
};


/**
 * Update the items being exported.
 * @private
 */
os.ui.state.StateListCtrl.prototype.updateItems_ = function() {
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

    this.scope_.$emit(os.ui.state.StateListEvent.CHANGE, descriptors);
    os.ui.apply(this.scope_);
  }
};
