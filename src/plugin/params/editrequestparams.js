goog.provide('plugin.params.EditRequestParamsCtrl');
goog.provide('plugin.params.editRequestParamsDirective');

goog.require('goog.Disposable');
goog.require('os.data.ColumnDefinition');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.slick.slickGridDirective');


/**
 * The editrequestparams directive
 * @return {angular.Directive}
 */
plugin.params.editRequestParamsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'layer': '=',
      'params': '='
    },
    templateUrl: os.ROOT + 'views/plugin/params/editrequestparams.html',
    controller: plugin.params.EditRequestParamsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('editrequestparams', [plugin.params.editRequestParamsDirective]);



/**
 * Controller function for the editrequestparams directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
plugin.params.EditRequestParamsCtrl = function($scope, $element) {
  plugin.params.EditRequestParamsCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * Counter for unique row id's.
   * @type {number}
   * @private
   */
  this.nextId_ = 0;

  /**
   * Initial parameter keys provided to the UI.
   * @type {!Array<string>}
   */
  this['initialKeys'] = [];

  /**
   * If the layer supports multiple URLs.
   * @type {boolean}
   */
  this['multiUrl'] = false;

  /**
   * The parameter model for slickgrid.
   * @type {Array<!Object>}
   */
  this['params'] = null;

  /**
   * The selected parameter in the grid.
   * @type {Object}
   */
  this['selected'] = null;

  /**
   * The URL(s) for the layer.
   * @type {Array<string>}
   */
  this['urls'] = null;

  // initialize request URL(s)
  var layer = /** @type {ol.layer.Layer|undefined} */ ($scope['layer']);
  var urls = plugin.params.getUrlsForLayer(layer || null);
  if (typeof urls == 'string') {
    this['urls'] = [urls];
    this['multiUrl'] = false;
  } else if (urls) {
    this['urls'] = urls;
    this['multiUrl'] = true;
  }

  // initialize request parameters
  var initialParams = /** @type {Object|undefined} */ ($scope['params']);
  if (initialParams) {
    this['params'] = [];

    for (var key in initialParams) {
      this['initialKeys'].push(key);
      this['params'].push({
        'id': this.nextId_++,
        'field': key,
        'value': initialParams[key]
      });
    }
  }

  this['gridOptions'] = {
    'asyncEditorLoading': false,
    'autoEdit': true,
    'editable': true,
    'enableCellNavigation': true,
    'forceFitColumns': true,
    'fullWidthRows': true,
    'multiColumnSort': false,
    'multiSelect': false
  };

  var fieldCol = new os.data.ColumnDefinition('Field', 'field');
  fieldCol['editor'] = Slick.Editors.Text;

  var valueCol = new os.data.ColumnDefinition('Value', 'value');
  valueCol['editor'] = Slick.Editors.Text;

  this['gridColumns'] = [fieldCol, valueCol];

  $scope.$on('$destroy', this.dispose.bind(this));
  $scope.$emit(os.ui.WindowEventType.READY);
};
goog.inherits(plugin.params.EditRequestParamsCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
plugin.params.EditRequestParamsCtrl.prototype.disposeInternal = function() {
  plugin.params.EditRequestParamsCtrl.base(this, 'disposeInternal');

  this.scope = null;
  this.element = null;
};


/**
 * Discard changes and close the window.
 * @export
 */
plugin.params.EditRequestParamsCtrl.prototype.cancel = function() {
  this.close();
};


/**
 * Save the parameter changes and close the window.
 * @export
 */
plugin.params.EditRequestParamsCtrl.prototype.confirm = function() {
  if (this.scope) {
    this.scope.$broadcast(os.ui.slick.SlickGridEvent.COMMIT_EDIT);
  }

  var layer = /** @type {ol.layer.Layer|undefined} */ (this.scope['layer']);
  if (layer) {
    if (this['params']) {
      var params = {};
      var toDelete = [];

      // map parameter data to an object
      this['params'].forEach(function(p) {
        var field = goog.string.makeSafe(p['field']);
        if (!goog.string.isEmptyOrWhitespace(field)) {
          params[field] = goog.string.makeSafe(p['value']);
        }
      });

      // check if any keys have been deleted from the initial values
      this['initialKeys'].forEach(function(key) {
        if (!(key in params)) {
          toDelete.push(key);
        }
      });

      plugin.params.setParamsForLayer(layer, params, toDelete);
    }

    if (this['urls']) {
      // skip empty URL's
      var urls = this['urls'].filter(function(url) {
        return !goog.string.isEmptyOrWhitespace(url);
      });

      if (urls.length > 0) {
        plugin.params.setUrlsForLayer(layer, urls);
      }
    }
  }

  this.close();
};


/**
 * Close the window.
 * @protected
 */
plugin.params.EditRequestParamsCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};


/**
 * Add a new parameter row.
 * @export
 */
plugin.params.EditRequestParamsCtrl.prototype.addRow = function() {
  if (this['params']) {
    this['params'] = this['params'].concat([{
      'id': this.nextId_++,
      'field': '',
      'value': ''
    }]);
  }
};


/**
 * Remove the selected parameter row.
 * @export
 */
plugin.params.EditRequestParamsCtrl.prototype.removeRow = function() {
  if (this['selected'] && this['params']) {
    goog.array.remove(this['params'], this['selected']);
    this['params'] = this['params'].slice();
  }
};


/**
 * Add a URL.
 * @export
 */
plugin.params.EditRequestParamsCtrl.prototype.addUrl = function() {
  if (this['multiUrl'] && this['urls']) {
    this['urls'].push('');
  }
};


/**
 * Remove a URL.
 * @param {number} index The URL index.
 * @export
 */
plugin.params.EditRequestParamsCtrl.prototype.removeUrl = function(index) {
  if (index != null && this['urls'] && this['urls'].length > index) {
    this['urls'].splice(index, 1);
  }
};


/**
 * Get the label to display for a URL control.
 * @param {number} index The URL index.
 * @return {string} The URL control label.
 * @export
 */
plugin.params.EditRequestParamsCtrl.prototype.getUrlLabel = function(index) {
  if (this['multiUrl']) {
    return 'URL ' + (index + 1);
  }

  return 'URL';
};


/**
 * Test if the parameters are valid.
 * @return {boolean} If all parameters are valid.
 * @export
 */
plugin.params.EditRequestParamsCtrl.prototype.testValid = function() {
  if (!this['urls'] || this['urls'].length == 0 || this['urls'].every(goog.string.isEmptyOrWhitespace)) {
    this['errorMsg'] = (this['multiUrl'] ? 'At least one ' : '') + 'URL must be defined.';
    return false;
  }

  if (this['params']) {
    for (var i = 0; i < this['params'].length; i++) {
      var p = this['params'][i];

      // if a value is defined but no field, mark as invalid
      if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(p['value'])) &&
          goog.string.isEmptyOrWhitespace(goog.string.makeSafe(p['field']))) {
        this['errorMsg'] = 'Value defined without a Field.';
        return false;
      }
    }
  }

  this['errorMsg'] = '';
  return true;
};


/**
 * Launches a layer params edit window.
 * @param {!ol.layer.Layer} layer The layer.
 * @param {Object} params The current layer params.
 */
plugin.params.launchParamsEdit = function(layer, params) {
  var winLabel = 'Edit Parameters';
  var windowId = 'editParams';

  // create a new window
  var scopeOptions = {
    'layer': layer,
    'params': params
  };

  // don't constrain the max width/height since content varies widely per feature
  var windowOptions = {
    'id': windowId,
    'label': winLabel,
    'icon': 'fa fa-gears',
    'key': 'editparams',
    'x': 'center',
    'y': 'center',
    'width': 400,
    'min-width': 400,
    'max-width': 0,
    'height': 200,
    'show-close': true,
    'modal': true
  };

  var template = '<editrequestparams layer="layer" params="params"></editrequestparams>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
