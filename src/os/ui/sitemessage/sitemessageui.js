goog.declareModuleId('os.ui.SiteMessage.UI');

import {ROOT} from '../../os.js';
import {create, open} from '../modal/modal.js';
import Module from '../module.js';
import windowSelector from '../windowselector.js';
import {getNextReminderDate, getSiteMessage} from './sitemessageutils.js';

const Cookies = goog.require('goog.net.Cookies');

/**
 * The Site Message popup directive
 *
 * @return {angular.Directive} the directive definition
 */
export const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: ROOT + 'views/sitemessage.html',
  controller: Controller,
  controllerAs: 'sitemessageCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'sitemessage';
const cookieKey = 'sitemessage';

Module.directive(directiveTag, directive);

/**
 * Controller function for the Site Message directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {angular.Scope} $scope
   * @param {angular.JQLite} $element
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

    const siteMessage = getSiteMessage();

    if (siteMessage) {
      this['text'] = siteMessage.getText();
      this['title'] = siteMessage.getTitle();

      open($element, {
        'backdrop': 'static',
        'focus': true
      });
      $('body').addClass('c-sitemessage');
    }

    this.scope_.$on('$destroy', this.destroy.bind(this));
  }

  /**
   * Destroy.
   */
  destroy() {
    $('body').removeClass('c-sitemessage');

    this.scope_ = null;
    this.element_ = null;
    this.timeout_ = null;
  }

  /**
   * update the cookie timer
   *
   * @private
   */
  update_() {
    const cookie = new Cookies(window.document);
    const siteMessage = getSiteMessage();
    const nextReminderDate = getNextReminderDate(new Date());
    let maxAge = -1;
    if (nextReminderDate != null && !isNaN(nextReminderDate)) {
      maxAge = (nextReminderDate - new Date()) / 1000;
    }
    cookie.set(cookieKey, siteMessage.getId(), {
      maxAge: maxAge,
      path: '/',
      domain: null,
      secure: false
    });
  }

  /**
   * Save the cookie so it wont popup again
   *
   * @export
   */
  saveCookie() {
    this.update_();
    this.element_.modal('hide');
  }
}

/**
 * Check sitemessage
 * @param {boolean|undefined} force
 */
export const launch = (force = false) => {
  const siteMessage = getSiteMessage();
  const cookie = new Cookies(window.document);

  if (siteMessage && (cookie.get(cookieKey) != siteMessage.getId() || force)) {
    create(windowSelector.CONTAINER, '<sitemessage></sitemessage>');
  }
};
