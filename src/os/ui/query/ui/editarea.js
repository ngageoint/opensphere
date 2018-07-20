goog.provide('os.ui.query.ui.EditAreaCtrl');
goog.provide('os.ui.query.ui.editAreaDirective');

goog.require('os.command.CommandProcessor');
goog.require('os.ui.Module');
goog.require('os.ui.im.basicInfoDirective');
goog.require('os.ui.query');
goog.require('os.ui.query.AreaManager');
goog.require('os.ui.query.cmd.AreaAdd');
goog.require('os.ui.query.ui.AreaImportCtrl');


/**
 * The edit area directive
 * @return {angular.Directive}
 */
os.ui.query.ui.editAreaDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/query/editarea.html',
    controller: os.ui.query.ui.EditAreaCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('editarea', [os.ui.query.ui.editAreaDirective]);



/**
 * Controller for edit area window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {os.ui.query.ui.AreaImportCtrl}
 * @constructor
 * @ngInject
 */
os.ui.query.ui.EditAreaCtrl = function($scope, $element, $timeout) {
  os.ui.query.ui.EditAreaCtrl.base(this, 'constructor', $scope, $element);

  this.config = $scope['config'] = {
    'title': null,
    'description': null,
    'tags': null
  };

  var feature = /** @type {!ol.Feature} */ (this.scope['feature']);
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
    $scope.$emit(os.ui.WindowEventType.READY);
  });
};
goog.inherits(os.ui.query.ui.EditAreaCtrl, os.ui.query.ui.AreaImportCtrl);


/**
 * Finish the dialog
 */
os.ui.query.ui.EditAreaCtrl.prototype.accept = function() {
  var feature = /** @type {!ol.Feature} */ (this.scope['feature']);
  if (feature) {
    // apply mappings from the configuration
    var mappings = os.ui.query.createMappingsFromConfig(this.config);
    os.ui.query.applyMappings(feature, mappings);

    // if we save it, it should not longer be a temporary area
    feature.set('temp', undefined);

    var am = os.ui.query.AreaManager.getInstance();
    if (!am.get(feature)) {
      // new areas should be on the stack
      var cmd = new os.ui.query.cmd.AreaAdd(feature);
      os.command.CommandProcessor.getInstance().addCommand(cmd);
    } else {
      // area edits don't go on the stack
      am.add(feature);
    }
  }

  this.close();
};
goog.exportProperty(os.ui.query.ui.EditAreaCtrl.prototype, 'accept', os.ui.query.ui.EditAreaCtrl.prototype.accept);

