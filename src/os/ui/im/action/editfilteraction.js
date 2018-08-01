goog.provide('os.ui.im.action.EditFilterActionCtrl');
goog.provide('os.ui.im.action.EventType');
goog.provide('os.ui.im.action.editFilterActionDirective');

goog.require('os.im.action');
goog.require('os.im.action.FilterActionEntry');
goog.require('os.ol.canvas');
goog.require('os.ui.Module');
goog.require('os.ui.filter.ui.EditFiltersCtrl');
goog.require('os.ui.filter.ui.editFiltersDirective');
goog.require('os.ui.window');


/**
 * event type for updates to actions
 * @enum {string}
 */
os.ui.im.action.EventType = {
  UPDATE: 'action:update'
};


/**
 * The edit filter action directive.
 * @return {angular.Directive}
 */
os.ui.im.action.editFilterActionDirective = function() {
  var dir = os.ui.filter.ui.editFiltersDirective();
  dir.templateUrl = os.ROOT + 'views/im/action/editfilteraction.html';
  dir.controller = os.ui.im.action.EditFilterActionCtrl;
  dir.controllerAs = 'ctrl';
  return dir;
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('editfilteraction', [os.ui.im.action.editFilterActionDirective]);



/**
 * Controller for the edit filter action window.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {os.ui.filter.ui.EditFiltersCtrl}
 * @constructor
 * @template T
 * @ngInject
 */
os.ui.im.action.EditFilterActionCtrl = function($scope, $element) {
  os.ui.im.action.EditFilterActionCtrl.base(this, 'constructor', $scope, $element);

  var iam = os.im.action.ImportActionManager.getInstance();

  /**
   * All actions registered in the application.
   * @type {!Array<!os.im.action.IImportAction<T>>}
   * @private
   */
  this.registeredActions_ = iam.getActions().sort(os.im.action.sortByLabel);

  /**
   * The start index for drag operations.
   * @type {number}
   * @private
   */
  this.startIndex_ = -1;

  /**
   * Configured filter actions.
   * @type {!Array<!os.im.action.IImportAction<T>>}
   */
  this['actions'] = [];

  /**
   * Available filter actions.
   * @type {!Array<!os.im.action.IImportAction<T>>}
   */
  this['availableActions'] = [];

  var filterEntry = /** @type {os.im.action.FilterActionEntry} */ (this.entry);
  if (filterEntry && filterEntry.actions) {
    var actions = filterEntry.actions.slice();
    for (var i = 0; i < actions.length; i++) {
      this['actions'].push({
        'id': actions[i].getId(),
        'action': actions[i]
      });
    }
  }

  // make the labels sortable via drag handle
  this.element.find('.action-container').sortable({
    'items': '.filter-action-row',
    'handle': '.handle',
    'axis': 'y',
    'containment': 'parent',
    'snap': true,
    'tolerance': 'pointer',
    'start': this.onDragStart_.bind(this),
    'stop': this.onDragEnd_.bind(this)
  });

  this.updateAvailableActions();

  // prefill an action if the entry didn't have any
  if (this['actions'].length == 0) {
    this.addAction();
  }

  $scope.$on('$destroy', goog.bind(this.onDestroy, this));
  os.dataManager.listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
};
goog.inherits(os.ui.im.action.EditFilterActionCtrl, os.ui.filter.ui.EditFiltersCtrl);


/**
 * Add a new filter action.
 */
os.ui.im.action.EditFilterActionCtrl.prototype.addAction = function() {
  if (this['availableActions'].length > 0) {
    var iam = os.im.action.ImportActionManager.getInstance();
    var actionId = /** @type {string} */ (this['availableActions'][0]['id']);
    var action = iam.createAction(actionId);
    if (action) {
      this['actions'].push({
        'id': actionId,
        'action': action
      });

      this.updateAvailableActions();
    }
  }
};
goog.exportProperty(
    os.ui.im.action.EditFilterActionCtrl.prototype,
    'addAction',
    os.ui.im.action.EditFilterActionCtrl.prototype.addAction);


/**
 * Remove an action.
 * @param {number} index The import action index.
 */
os.ui.im.action.EditFilterActionCtrl.prototype.removeAction = function(index) {
  if (index > -1 && index < this['actions'].length) {
    this['actions'].splice(index, 1);
    this.updateAvailableActions();
    os.dispatcher.dispatchEvent(os.ui.im.action.EventType.UPDATE);
  }
};
goog.exportProperty(
    os.ui.im.action.EditFilterActionCtrl.prototype,
    'removeAction',
    os.ui.im.action.EditFilterActionCtrl.prototype.removeAction);


/**
 * Update an action type.
 * @param {number} index The action index.
 */
os.ui.im.action.EditFilterActionCtrl.prototype.updateAction = function(index) {
  var actionObj = this['actions'][index];
  if (actionObj && actionObj['id'] != actionObj['action'].getId()) {
    var iam = os.im.action.ImportActionManager.getInstance();
    var action = iam.createAction(actionObj['id']);
    if (action) {
      actionObj['action'] = action;
      this.updateAvailableActions();
    }
    os.dispatcher.dispatchEvent(os.ui.im.action.EventType.UPDATE);
  }
};
goog.exportProperty(
    os.ui.im.action.EditFilterActionCtrl.prototype,
    'updateAction',
    os.ui.im.action.EditFilterActionCtrl.prototype.updateAction);


/**
 * Update the list of actions that can be added.
 * @protected
 */
os.ui.im.action.EditFilterActionCtrl.prototype.updateAvailableActions = function() {
  this['availableActions'].length = 0;

  for (var i = 0; i < this.registeredActions_.length; i++) {
    var action = this.registeredActions_[i];
    if (!action.isUnique() || !this['actions'].some(function(obj) {
      return obj['id'] == action.getId();
    })) {
      this['availableActions'].push({
        'id': action.getId(),
        'label': action.getLabel()
      });
    }
  }
};


/**
 * Configure an action.
 * @param {os.im.action.IImportAction<T>} action The import action.
 */
os.ui.im.action.EditFilterActionCtrl.prototype.configAction = function(action) {
  if (this.entry && action) {
    os.ui.im.action.launchActionConfig(action, this.entry.getType());
  }
};
goog.exportProperty(
    os.ui.im.action.EditFilterActionCtrl.prototype,
    'configAction',
    os.ui.im.action.EditFilterActionCtrl.prototype.configAction);


/**
 * Close the edit filter action window if the source was removed
 * @param {os.data.event.DataEvent} event
 * @private
 */
os.ui.im.action.EditFilterActionCtrl.prototype.onSourceRemoved_ = function(event) {
  if (event && event.source) {
    if (this.entry && this.entry.getType() == event.source.getId()) {
      this.cancel();
    }
  }
};


/**
 * @inheritDoc
 */
os.ui.im.action.EditFilterActionCtrl.prototype.onDestroy = function() {
  os.ui.im.action.EditFilterActionCtrl.base(this, 'onDestroy');
  os.dataManager.unlisten(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
};


/**
 * @inheritDoc
 */
os.ui.im.action.EditFilterActionCtrl.prototype.cancel = function() {
  os.ui.im.action.closeActionConfigWindow();
  os.ui.im.action.EditFilterActionCtrl.base(this, 'cancel');
};
goog.exportProperty(
    os.ui.im.action.EditFilterActionCtrl.prototype,
    'cancel',
    os.ui.im.action.EditFilterActionCtrl.prototype.cancel);


/**
 * @inheritDoc
 */
os.ui.im.action.EditFilterActionCtrl.prototype.finish = function() {
  os.ui.im.action.closeActionConfigWindow();

  var filterEntry = /** @type {os.im.action.FilterActionEntry} */ (this.entry);
  filterEntry.actions = this['actions'].map(function(item) {
    return item['action'];
  });

  os.ui.im.action.EditFilterActionCtrl.base(this, 'finish');
};
goog.exportProperty(
    os.ui.im.action.EditFilterActionCtrl.prototype,
    'finish',
    os.ui.im.action.EditFilterActionCtrl.prototype.finish);


/**
 * @inheritDoc
 */
os.ui.im.action.EditFilterActionCtrl.prototype.isInvalid = function() {
  if (this['actions'].length == 0) {
    return true;
  }

  return os.ui.im.action.EditFilterActionCtrl.base(this, 'isInvalid');
};
goog.exportProperty(
    os.ui.im.action.EditFilterActionCtrl.prototype,
    'isInvalid',
    os.ui.im.action.EditFilterActionCtrl.prototype.isInvalid);


/**
 * Get the tooltip to display over the Add Action button.
 * @return {string}
 */
os.ui.im.action.EditFilterActionCtrl.prototype.getAddActionTooltip = function() {
  if (this['availableActions'].length > 0) {
    return 'Add a new action';
  } else {
    return 'All available actions have been added';
  }
};
goog.exportProperty(
    os.ui.im.action.EditFilterActionCtrl.prototype,
    'getAddActionTooltip',
    os.ui.im.action.EditFilterActionCtrl.prototype.getAddActionTooltip);


/**
 * Handle label drag start.
 * @param {!jQuery.Event} event
 * @param {!{item: jQuery, placeholder: jQuery}} ui
 * @private
 */
os.ui.im.action.EditFilterActionCtrl.prototype.onDragStart_ = function(event, ui) {
  // add a buffer to the bottom of the containment to account for the container padding
  var sortable = this.element.find('.action-container').sortable('instance');
  if (sortable && sortable['containment']) {
    sortable['containment'][3] += 3;
  }

  // placeholder should be the same height as the item being dragged so the container size doesn't change
  if (ui['helper'] && ui['placeholder']) {
    ui['placeholder'].height(ui['helper'].height());
  }

  if (ui['item']) {
    // show the grippy dragging cursor
    ui['item'].find('.handle').addClass('moving');

    // save the start index
    this.startIndex_ = ui['item'].index();
  }
};


/**
 * Handle label drag end.
 * @param {!jQuery.Event} event
 * @param {!{item: Element}} ui
 * @private
 */
os.ui.im.action.EditFilterActionCtrl.prototype.onDragEnd_ = function(event, ui) {
  if (ui['item']) {
    // revert to grippy hover cursor
    ui['item'].find('.handle').removeClass('moving');

    // if the index changed, update the label order
    var stopIndex = ui['item'].index();
    if (this.startIndex_ != stopIndex) {
      goog.array.moveItem(this['actions'], this.startIndex_, stopIndex);
      os.ui.apply(this.scope);
    }
  }
};


/**
 * Window id for configuring an import action.
 * @type {string}
 * @const
 */
os.ui.im.action.ACTION_CONFIG_ID = 'importActionConfig';


/**
 * Closes the expression edit window.
 */
os.ui.im.action.closeActionConfigWindow = function() {
  os.ui.window.close(os.ui.window.getById(os.ui.im.action.ACTION_CONFIG_ID));
};


/**
 * Create/edit a filter action entry. If no entry is provided, a new one will be created.
 * @param {string} type The entry type.
 * @param {Array} columns The filter columns.
 * @param {function(os.im.action.FilterActionEntry<T>)} callback The callback to fire when the entry is ready.
 * @param {os.im.action.FilterActionEntry<T>=} opt_entry The entry to edit.
 * @param {string=} opt_label Base window label.
 * @template T
 */
os.ui.im.action.launchEditFilterAction = function(type, columns, callback, opt_entry, opt_label) {
  var iam = os.im.action.ImportActionManager.getInstance();
  var label = opt_label || iam.entryTitle;
  var entry = opt_entry;
  if (!entry) {
    // create a new entry and default it to enabled
    entry = iam.createActionEntry();
    entry.setEnabled(true);
    entry.setType(type);

    label = 'Create ' + label;
  } else {
    // editing an existing entry
    label = 'Edit ' + label;
  }

  var options = {
    'id': 'editfilteraction',
    'icon': 'fa ' + os.im.action.ICON,
    'label': label,
    'x': 'center',
    'y': 'center',
    'show-close': true,
    'no-scroll': false,
    'min-width': 400,
    'min-height': 500,
    'max-width': 1000,
    'max-height': 1000,
    'modal': true,
    'width': 850,
    'height': 600
  };

  var scopeOptions = {
    'entry': entry,
    'type': type,
    'columns': columns,
    'callback': callback
  };

  os.ui.window.create(options, 'editfilteraction', undefined, undefined, undefined, scopeOptions);
};


/**
 * Launch a dialog to configure an import action.
 * @param {!os.im.action.IImportAction} action The action.
 * @param {string} type The action entry type.
 */
os.ui.im.action.launchActionConfig = function(action, type) {
  if (os.ui.window.exists(os.ui.im.action.ACTION_CONFIG_ID)) {
    // don't open multiple of this window
    return;
  }

  var ui = action.getConfigUI();
  if (ui) {
    var scopeOptions = {
      'action': action,
      'type': type,
      'yesText': 'OK',
      'yesIcon': 'fa fa-check',
      'yesButtonClass': 'btn-primary',
      'noText': 'Cancel',
      'noIcon': 'fa fa-ban',
      'noButtonClass': 'btn-secondary'
    };

    var windowOptions = {
      'id': os.ui.im.action.ACTION_CONFIG_ID,
      'label': action.label,
      'icon': 'fa fa-gear',
      'x': 'center',
      'y': 'center',
      'width': 350,
      'min-width': 200,
      'max-width': 2000,
      'height': 'auto',
      'modal': true,
      'show-close': false,
      'no-scroll': true
    };

    var template = '<confirm><' + ui + '></' + ui + '></confirm>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
