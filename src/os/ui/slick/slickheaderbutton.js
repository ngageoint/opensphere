goog.provide('os.ui.slick.SlickHeaderButtonCtrl');
goog.provide('os.ui.slick.slickHeaderButtonDirective');
goog.require('os.ui.Module');
goog.require('os.ui.slick.SlickGridCtrl');


/**
 * The slickheaderbutton directive.
 * @return {angular.Directive}
 */
os.ui.slick.slickHeaderButtonDirective = function() {
  var dir = os.ui.slickGridDirective();
  dir['scope']['onCommand'] = '=?';
  dir['controller'] = os.ui.slick.SlickHeaderButtonCtrl;
  return dir;
};


/**
 * Add the directive
 */
os.ui.Module.directive('slickheaderbutton', [os.ui.slick.slickHeaderButtonDirective]);



/**
 * Controller class for SlickGrid with header buttons
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @extends {os.ui.slick.SlickGridCtrl}
 * @constructor
 * @ngInject
 */
os.ui.slick.SlickHeaderButtonCtrl = function($scope, $element, $compile) {
  os.ui.slick.SlickHeaderButtonCtrl.base(this, 'constructor', $scope, $element, $compile);

  var headerButtonsPlugin = new Slick.Plugins.HeaderButtons();

  headerButtonsPlugin.onCommand.subscribe(function(e, args) {
    var button = args['button'];
    var command = args['command'];
    var idx = this.grid.getColumnIndex(args['column']['id']);
    var column = this.scope['columns'][idx];

    this.scope['onCommand'](column, button, command, this.scope['columns']);
  }.bind(this));

  this.grid.registerPlugin(headerButtonsPlugin);
};
goog.inherits(os.ui.slick.SlickHeaderButtonCtrl, os.ui.slick.SlickGridCtrl);
