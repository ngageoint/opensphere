goog.provide('os.ui.navTopDirective');

goog.require('os.defines');
goog.require('os.ui.NavBarCtrl');
goog.require('os.ui.addDataButtonDirective');
goog.require('os.ui.clear.clearButtonDirective');
goog.require('os.ui.draw.drawControlsDirective');
goog.require('os.ui.help');
goog.require('os.ui.list');
goog.require('os.ui.measureButtonDirective');
goog.require('os.ui.nav');
goog.require('os.ui.saveButtonDirective');
goog.require('os.ui.search.searchBoxDirective');
goog.require('os.ui.search.searchResultsDirective');
goog.require('os.ui.stateButtonDirective');
goog.require('os.ui.windowsButtonDirective');


/**
 * The nav-top directive
 * @return {angular.Directive}
 */
os.ui.navTopDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/navtop.html',
    controller: os.ui.NavBarCtrl,
    controllerAs: 'navTop'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('navTop', [os.ui.navTopDirective]);

os.ui.list.add(os.ui.nav.Location.TOP_LEFT, '<add-data-button show-label="!punyWindow"></add-data-button>', 100);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, '<save-button show-label="!punyWindow"></save-button>', 200);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, '<state-button show-label="!punyWindow"></state-button>', 300);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, '<windows-button show-label="!punyWindow"></windows-button>', 400);

os.ui.list.add(os.ui.nav.Location.TOP_LEFT, '<div class="btn-separator"></div>', 500);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'os-draw-controls', 600);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'measure-button', 650);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'clear-button', 700);

os.ui.list.add(os.ui.nav.Location.TOP_RIGHT, '<search-box></search-box><searchresults></searchresults>', 100);
os.ui.list.add(os.ui.nav.Location.TOP_RIGHT, '<help show-label="!punyWindow"></help>', 200);
os.ui.list.add(os.ui.nav.Location.TOP_RIGHT, '<context-onboarding context="navTop"></context-onboarding>', 10000);
