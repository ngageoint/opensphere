goog.provide('os.ui.query.EditAreaCtrl');
goog.provide('os.ui.query.editAreaDirective');

goog.require('os.command.CommandProcessor');
goog.require('os.query.BaseAreaManager');
goog.require('os.ui.Module');
goog.require('os.ui.im.basicInfoDirective');
goog.require('os.ui.query');
goog.require('os.ui.query.AreaImportCtrl');
goog.require('os.ui.query.cmd.AreaAdd');


/**
 * The edit area directive
 *
 * @return {angular.Directive}
 */
os.ui.query.editAreaDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/query/editarea.html',
    controller: os.ui.query.EditAreaCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('editarea', [os.ui.query.editAreaDirective]);



/**
 * Controller for edit area window
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {os.ui.query.AreaImportCtrl}
 * @constructor
 * @ngInject
 */
os.ui.query.EditAreaCtrl = function($scope, $element, $timeout) {
  os.ui.query.EditAreaCtrl.base(this, 'constructor', $scope, $element, $timeout);

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
goog.inherits(os.ui.query.EditAreaCtrl, os.ui.query.AreaImportCtrl);


/**
 * Finish the dialog
 *
 * @export
 */
os.ui.query.EditAreaCtrl.prototype.accept = function() {
  var feature = /** @type {!ol.Feature} */ (this.scope['feature']);
  if (feature) {
    // apply mappings from the configuration
    var mappings = os.ui.query.createMappingsFromConfig(this.config);
    os.ui.query.applyMappings(feature, mappings);

    // if we save it, it should not longer be a temporary area
    feature.set('temp', undefined);

    var am = os.query.BaseAreaManager.getInstance();
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

