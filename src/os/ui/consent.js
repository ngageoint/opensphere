goog.declareModuleId('os.ui.ConsentUI');

import Settings from '../config/settings.js';
import {ROOT} from '../os.js';
import Peer from '../xt/peer.js';
import {create, open} from './modal/modal.js';
import Module from './module.js';
import windowSelector from './windowselector.js';

const Timer = goog.require('goog.Timer');
const dispose = goog.require('goog.dispose');
const Cookies = goog.require('goog.net.Cookies');

const {default: IMessageHandler} = goog.requireType('os.xt.IMessageHandler');


/**
 * The Consent popup directive
 *
 * @return {angular.Directive} the directive definition
 */
export const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: ROOT + 'views/consent.html',
  controller: Controller,
  controllerAs: 'consentCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'consent';

Module.directive(directiveTag, directive);

/**
 * Controller function for the Consent directive
 *
 * @implements {IMessageHandler}
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

    /**
     * crosstalk
     * @type {Peer}
     * @private
     */
    this.peer_ = Peer.getInstance();
    this.peer_.addHandler(this);

    /**
     * Timer to refresh the cookie.
     * @type {Timer}
     * @private
     */
    this.timer_ = null;

    /**
     * The cookie max age.
     * @type {number}
     */
    this.maxAge = -1;

    this['server'] = location.host;

    var cookie = new Cookies(window.document);
    var consent = Settings.getInstance().get(['consent']);

    if (consent && consent['text']) {
      const refresh = /** @type {number|undefined} */ (consent['refresh']);
      if (refresh) {
        this.maxAge = refresh;
        this.timer_ = new Timer(refresh * 900);
        this.timer_.listen(Timer.TICK, this.update_, false, this);
      }

      this['text'] = consent['text'];

      if (cookie && !cookie.get('consent')) {
        open($element, {
          'backdrop': 'static',
          'focus': true
        });
        $('body').addClass('c-consent');
      } else {
        if (this.timer_) {
          this.timer_.start();
        }
        this.update_();
      }
    }

    this.scope_.$on('$destroy', this.destroy.bind(this));
  }

  /**
   * Destroy.
   */
  destroy() {
    $('body').removeClass('c-consent');

    dispose(this.timer_);
    this.timer_ = null;

    this.scope_ = null;
    this.element_ = null;
    this.timeout_ = null;
  }

  /**
   * @inheritDoc
   */
  getTypes() {
    return ['consent'];
  }

  /**
   * @inheritDoc
   */
  process(data, type, sender, time) {
    this.element_.modal('hide');
    if (this.timer_) {
      this.timer_.start();
    }
  }

  /**
   * update the cookie timer
   *
   * @private
   */
  update_() {
    var cookie = new Cookies(window.document);
    cookie.set('consent', 'true', {
      maxAge: this.maxAge,
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
    if (this.timer_) {
      this.timer_.start();
    }
    this.peer_.send('consent', '');
  }
}

/**
 * Check consent
 */
export const launch = () => {
  var consent = Settings.getInstance().get(['consent']);
  var cookie = new Cookies(window.document);

  if (consent && consent['text'] && !cookie.get('consent')) {
    create(windowSelector.CONTAINER, '<consent></consent>');
  }
};
