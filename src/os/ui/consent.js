goog.provide('os.ui.Consent');
goog.provide('os.ui.consentDirective');
goog.require('goog.Timer');
goog.require('goog.events.EventTarget');
goog.require('goog.net.Cookies');
goog.require('os.ui.Module');
goog.require('os.ui.windowSelector');
goog.require('os.xt.IMessageHandler');
goog.require('os.xt.Peer');



/**
 * Controller function for the Consent directive
 * @implements {os.xt.IMessageHandler}
 * @constructor
 * @param {angular.Scope} $scope
 * @param {angular.JQLite} $element
 * @ngInject
 */
os.ui.Consent = function($scope, $element) {
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
   * @type {os.xt.Peer}
   * @private
   */
  this.peer_ = os.xt.Peer.getInstance();
  this.peer_.addHandler(this);

  this['server'] = location.host;

  var cookie = new goog.net.Cookies(window.document);
  var consent = os.settings.get(['consent']);

  if (consent && consent['text']) {
    this.refresh = consent['refresh'];
    this['text'] = consent['text'];
    this.timer_ = new goog.Timer(this.refresh * 900);
    this.timer_.listen(goog.Timer.TICK, this.update_, false, this);

    if (cookie && !cookie.get('consent')) {
      os.ui.modal.open($element, {
        'backdrop': 'static',
        'focus': true
      });
      $('body').addClass('c-consent');
    } else {
      this.timer_.start();
      this.update_();
    }
  }

  this.scope_.$on('$destroy', this.destroy.bind(this));
};


/**
 * Destroy.
 */
os.ui.Consent.prototype.destroy = function() {
  $('body').removeClass('c-consent');
  this.scope_ = null;
  this.element_ = null;
  this.timeout_ = null;
};


/**
 * @inheritDoc
 */
os.ui.Consent.prototype.getTypes = function() {
  return ['consent'];
};


/**
 * @inheritDoc
 */
os.ui.Consent.prototype.process = function(data, type, sender, time) {
  this.element_.modal('hide');
  this.timer_.start();
};


/**
 * update the cookie timer
 * @private
 */
os.ui.Consent.prototype.update_ = function() {
  var cookie = new goog.net.Cookies(window.document);
  cookie.set('consent', 'true', this.refresh, '/', null, false);
};


/**
 * Check consent
 */
os.ui.Consent.launch = function() {
  var consent = os.settings.get(['consent']);
  var cookie = new goog.net.Cookies(window.document);

  if (consent && consent['text'] && !cookie.get('consent')) {
    os.ui.modal.create(os.ui.windowSelector.CONTAINER, '<consent></consent>');
  }
};


/**
 * Save the cookie so it wont popup again
 */
os.ui.Consent.prototype.saveCookie = function() {
  this.update_();
  this.element_.modal('hide');
  this.timer_.start();
  this.peer_.send('consent', '');
}; goog.exportProperty(
    os.ui.Consent.prototype,
    'saveCookie',
    os.ui.Consent.prototype.saveCookie);


/**
 * The Consent popup directive
 * @return {angular.Directive} the directive definition
 */
os.ui.consentDirective = function() {
  return {
    replace: true,
    restrict: 'E',
    templateUrl: os.ROOT + 'views/consent.html',
    controller: os.ui.Consent,
    controllerAs: 'consentCtrl'
  };
};

os.ui.Module.directive('consent', os.ui.consentDirective);
