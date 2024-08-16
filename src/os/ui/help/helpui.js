goog.declareModuleId('os.ui.help.HelpUI');

import {getAppName} from '../../config/config.js';
import Settings from '../../config/settings.js';
import * as dispatcher from '../../dispatcher.js';
import UIEventType from '../eventtype.js';
import MenuButtonCtrl from '../menu/menubutton.js';
import MenuItemType from '../menu/menuitemtype.js';
import {launchAboutModal} from '../modal/aboutmodal.js';
import Module from '../module.js';
import OnboardingManager from '../onboarding/onboardingmanager.js';
import * as SiteMessageUI from '../sitemessage/sitemessageui.js';
import {getSiteMessage} from '../sitemessage/sitemessageutils.js';
import * as ResetSettings from '../util/resetsettings.js';
import Controls from './controls.js';
import {launchControlsHelp} from './controlsui.js';
import {MENU, showWindow} from './help.js';
import EventType from './helpeventtype.js';

const log = goog.require('goog.log');
const {isEmpty} = goog.require('goog.object');

const Logger = goog.requireType('goog.log.Logger');
const {default: ActionEvent} = goog.requireType('os.ui.action.ActionEvent');


/**
 * A directive to display the help menu
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<button class="btn btn-info" ng-class="{\'dropdown-toggle\': !puny}" title="Support"' +
      ' ng-click="ctrl.openMenu()" ng-right-click="ctrl.openMenu()" ng-class="{active: menu}">' +
      '<i class="fa fa-question-circle" ng-class="{\'fa-fw\': puny}"></i> ' +
      '<span ng-class="{\'d-none\': puny}">Support</span>' +
      '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'help';

/**
 * Register the directive.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the help directive.
 * @unrestricted
 */
export class Controller extends MenuButtonCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
    this.menu = MENU;

    /**
     * The logger.
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    this.initialize();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.menu.removeAllListeners();
    this.menu = undefined;
  }

  /**
   * Initialize the help menu.
   *
   * @protected
   */
  initialize() {
    var appName = getAppName('the application');
    var root = this.menu.getRoot();

    var videoUrl = /** @type {string} */ (Settings.getInstance().get('helpVideoUrl'));
    if (videoUrl) {
      root.addChild({
        eventType: EventType.HELP_VIDEO,
        label: 'Help Videos',
        tooltip: 'View help videos for ' + appName,
        icons: ['<i class="fa fa-fw fa-question-circle"></i>'],
        sort: 20
      });
      this.menu.listen(EventType.HELP_VIDEO, this.onHelpAction_, false, this);
    }

    root.addChild({
      type: MenuItemType.SEPARATOR,
      sort: 100
    });

    root.addChild({
      eventType: EventType.ABOUT,
      label: 'About',
      tooltip: 'About ' + appName,
      icons: ['<i class="fa fa-fw fa-info-circle"></i>'],
      sort: 101
    });
    this.menu.listen(EventType.ABOUT, this.onHelpAction_, false, this);

    var siteMessage = getSiteMessage();
    if (siteMessage) {
      root.addChild({
        eventType: EventType.SHOW_SITE_MESSAGE,
        label: siteMessage.getTitle(),
        tooltip: 'Display information about ' + siteMessage.getTitle(),
        icons: ['<i class="fa fa-fw fa-info-circle"></i>'],
        sort: 105
      });
      this.menu.listen(EventType.SHOW_SITE_MESSAGE, this.onHelpAction_, false, this);
    }

    // If there are controls set, display them
    if (!isEmpty(Controls.getInstance().getControls())) {
      root.addChild({
        eventType: EventType.CONTROLS,
        label: 'Controls',
        tooltip: 'Keyboard and mouse controls',
        icons: ['<i class="fa fa-fw fa-keyboard-o"></i>'],
        sort: 110
      });
      this.menu.listen(EventType.CONTROLS, this.onHelpAction_, false, this);
    }

    var videoCardUrl = getVideoCardHelpUrl();
    if (videoCardUrl) {
      root.addChild({
        eventType: EventType.VIDEO_CARD,
        label: 'Graphics Card Help',
        tooltip: 'Troubleshoot 3D view',
        icons: ['<i class="fa fa-fw fa-desktop"></i>'],
        sort: 120
      });
      this.menu.listen(EventType.VIDEO_CARD, () => {
        window.open(videoCardUrl);
      }, false);
    }

    if (Settings.getInstance().get('onboarding') && Settings.getInstance().get('onboarding')['hideTips'] !== true) {
      root.addChild({
        eventType: EventType.SHOW_TIPS,
        label: 'Show Tips',
        tooltip: 'Reset help tips, and show the initial set of tips',
        icons: ['<i class="fa fa-fw fa-question"></i>'],
        sort: 130
      });
      this.menu.listen(EventType.SHOW_TIPS, this.onHelpAction_, false, this);
    }

    root.addChild({
      eventType: EventType.VIEW_ALERTS,
      label: 'View Alerts',
      tooltip: 'Display the alert log',
      icons: ['<i class="fa fa-fw fa-bell"></i>'],
      sort: 140
    });
    dispatcher.getInstance().listen(EventType.VIEW_ALERTS, showAlertsWindow);
    this.menu.listen(EventType.VIEW_ALERTS, this.onHelpAction_, false, this);

    root.addChild({
      eventType: EventType.VIEW_LOG,
      label: 'View Log',
      tooltip: 'Display the application log',
      icons: ['<i class="fa fa-fw fa-terminal"></i>'],
      sort: 150
    });
    this.menu.listen(EventType.VIEW_LOG, this.onHelpAction_, false, this);


    root.addChild(ResetSettings.resetSettingsOptions);
    this.menu.listen(UIEventType.DISPLAY_CLEAR_LOCALSTORAGE, function() {
      ResetSettings.resetSettings();
    });
  }

  /**
   * Handle help events.
   *
   * @param {ActionEvent} event
   * @private
   */
  onHelpAction_(event) {
    switch (event.type) {
      case EventType.ABOUT:
        launchAboutModal();
        break;
      case EventType.SHOW_TIPS:
        // enable onboarding and reset so none are flagged as being viewed
        Settings.getInstance().set('onboarding', {'showOnboarding': true});

        // launch the initial onboarding
        var initialOnboarding = /** @type {string} */ (Settings.getInstance().get('initialOnboarding'));
        if (initialOnboarding) {
          var initialPath = OnboardingManager.PATH + initialOnboarding;
          OnboardingManager.getInstance().displayOnboarding(initialPath);
        }
        break;
      case EventType.VIEW_LOG:
        this.scope.$emit(EventType.VIEW_LOG);
        break;
      case EventType.VIEW_ALERTS:
        this.scope.$emit(EventType.VIEW_ALERTS);
        break;
      case EventType.HELP_VIDEO:
        var videoUrl = /** @type {string} */ (Settings.getInstance().get('helpVideoUrl'));
        window.open(videoUrl);
        break;
      case EventType.CONTROLS:
        launchControlsHelp();
        break;
      case EventType.SHOW_SITE_MESSAGE:
        SiteMessageUI.launch(true);
        break;
      default:
        break;
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.help.HelpUI');

/**
 * Show the Alerts window.
 *
 */
const showAlertsWindow = function() {
  showWindow('alerts');
};

/**
 * Retrieve the URL for video card help
 *
 * @return {string}
 */
const getVideoCardHelpUrl = function() {
  return /** @type {string} */ (Settings.getInstance().get('helpVideoCardUrl'));
};
