goog.provide('os.ui');
goog.provide('os.ui.Module');

goog.require('goog.events.EventTarget');
goog.require('goog.labs.userAgent.util');
goog.require('goog.math.Size');
goog.require('goog.string');
goog.require('goog.userAgent');


/**
 * Default priority used when replacing Angular directives.
 * @type {number}
 * @const
 */
os.ui.DIRECTIVE_PRIORITY = 100;


/**
 * Applications should use this to add a global reference to the main application's Angular injector.
 * @type {?angular.$injector}
 */
os.ui.injector = null;


/**
 * This will be set automatically by {@link os.ui.sanitize}.
 * @type {angular.$sanitize}
 * @private
 */
os.ui.sanitize_;


/**
 * CSS selector for modal backdrops.
 * @type {string}
 * @const
 */
os.ui.MODAL_SELECTOR = '.modal-backdrop,.window-modal-bg';


/**
 * Sanitizes a string to remove potentally malicious HTML content. Note that if the entire string is disallowed by the
 * $sanitize service, you'll get an empty string back.
 * @param {string} value The value to sanitize
 * @return {string} The sanitized value, or the original value if angular.$sanitize is unavailable
 */
os.ui.sanitize = function(value) {
  if (value) {
    try {
      os.ui.sanitize_ = os.ui.sanitize_ || /** @type {angular.$sanitize} */ (os.ui.injector.get('$sanitize'));
      return os.ui.sanitize_(value);
    } catch (e) {
      // make this super obvious so we catch it in dev
      // some errors come as a result of poorly formatted text, ignore those
      if (!goog.isDef(os.ui.sanitize_)) {
        console.error('$santize service unavailable!');
      } else if (!goog.isDef(os.ui.injector)) {
        console.error('os.ui.injector service never defined!');
      }
    }
  }

  return value;
};


/**
 * Escape a string that contains < or > to prevent html injection
 * @param {string} value The value to escape
 * @return {string} The escaped value, may be the same as the original value
 */
os.ui.escapeHtmlOpenCloseTags = function(value) {
  if (value) {
    var entityMap = {
      '<': '&lt;',
      '>': '&gt;'
    };

    return String(value).replace(/[<>]/g, function(s) {
      return entityMap[s];
    });
  }

  return value;
};


/**
 * Unescape a string previously escaped by escapeHtmlTags
 * @param {string} value The value to unescape
 * @return {string} The unescaped value, may be the same as the original value
 */
os.ui.unescapeHtmlOpenCloseTags = function(value) {
  if (value) {
    var entityMap = {
      '&lt;': '<',
      '&gt;': '>'
    };

    for (var key in entityMap) {
      value = value.replace(RegExp(key, 'g'), entityMap[key]);
    }
  }

  return value;
};


/**
 * Sanitize a string for use as a DOM element id.
 * @param {string} value The string to sanitize
 * @return {string}
 */
os.ui.sanitizeId = function(value) {
  // collapse all whitespace and replace all non-alphanumeric characters with hyphens
  return value.replace(/\s/g, '').replace(/[^\w]/g, '-');
};


/**
 * Angular module "os.ui"
 */
os.ui.Module = angular.module('os.ui', ['ui.directives', 'ngAnimate', 'ngSanitize']);


/**
 * Measures the given string of text. Note that this function adds a node to the DOM completely
 * off the screen. This can affect flow and document size and is intended for single-page
 * applications which use <code>overflow: hidden;</code> on the <code>body</code> tag.
 * @param {string} text The text to measure
 * @param {string=} opt_classes The classes to use when measuring the string
 * @param {string=} opt_font The font style to use when measuring the string
 * @return {!goog.math.Size} The size of the text
 */
os.ui.measureText = function(text, opt_classes, opt_font) {
  var el = angular.element('#measureText');

  if (!el || el.length === 0) {
    el = $('<div id="measureText" style="position: fixed; top: -2000px; left: -2000px;"></div>').appendTo('body');
  }

  if (el && el.length > 0) {
    el[0].setAttribute('class', opt_classes ? opt_classes : '');
    el.css('font', opt_font || '');

    el.html(text);
    return new goog.math.Size(/** @type {number} */ (el.width()), /** @type {number} */ (el.height()));
  }

  return new goog.math.Size(0, 0);
};


/**
 * Applies the scope
 * @param {?angular.Scope} scope
 * @param {number=} opt_delay Timeout interval to wait before applying the scope, in milliseconds
 */
os.ui.apply = function(scope, opt_delay) {
  if (opt_delay != null && opt_delay >= 0) {
    setTimeout(function() {
      os.ui.apply(scope);
    }, opt_delay);
  } else {
    try {
      if (scope && (!scope.$root || !scope.$root.$$phase)) {
        scope.$apply();
      }
    } catch (e) {
    }
  }
};


/**
 * Wait for Angular to finish processing then call a function.
 *
 * Important Note: If at all possible, avoid resorting to using this! It's technically a "private" function in Angular,
 * but should remain stable since Protractor uses it to determine when Angular is done processing. Typically $timeout
 * should be sufficient to handle cases where the Angular stack needs to clear before you do something.
 *
 * @param {function(string=)} callback The function to call when ready. Angular will pass an error string to the
 *                                     function if something went wrong.
 */
os.ui.waitForAngular = function(callback) {
  if (os.ui.injector) {
    var browser = /** @type {angular.$browser} */ (os.ui.injector.get('$browser'));
    if (browser) {
      browser.notifyWhenNoOutstandingRequests(callback);
    }
  }
};


/**
 * Get the highest priority directive in a list.
 * @param {!Array<!angular.Directive>} $delegate The directives.
 * @return {!Array<!angular.Directive>} The highest priority directive.
 * @ngInject
 * @private
 */
os.ui.getPriorityDirective_ = function($delegate) {
  $delegate.sort(os.ui.sortDirectives_);
  return [$delegate[0]];
};


/**
 * Sort directives by descending priority.
 * @param {!angular.Directive} a The first directive.
 * @param {!angular.Directive} b The second directive.
 * @return {number} The sort order.
 * @private
 */
os.ui.sortDirectives_ = function(a, b) {
  return a.priority > b.priority ? -1 : a.priority < b.priority ? 1 : 0;
};


/**
 * Replace a directive already registered with Angular. The directive name and module should be identical to the
 * original.
 *
 * Example:
 *
 * Given a directive with the name 'myComponent', added to the module `os.ui.Module`, the directive can be replaced by
 * doing the following:
 *
 * ```
 * os.ui.myNewComponent = function() {
 *   ... returns a directive object ...
 * };
 *
 * os.ui.replaceDirective('myComponent', os.ui.Module, os.ui.myNewComponent);
 * ```
 *
 * @param {string} name The directive name.
 * @param {!angular.Module} module The Angular module with the original directive.
 * @param {function():angular.Directive} directiveFn The new directive function.
 * @param {number=} opt_priority The priority value to use.
 */
os.ui.replaceDirective = function(name, module, directiveFn, opt_priority) {
  // set the directive priority so the new directive is returned by os.ui.getPriorityDirective_
  var priority = opt_priority != null ? opt_priority : os.ui.DIRECTIVE_PRIORITY;
  var directive = function() {
    var d = directiveFn();
    d.priority = priority;
    return d;
  };

  // register the new version of the directive
  module.directive(name, [directive]);

  // register a decorator to return the highest priority directive
  module.decorator(name + 'Directive', os.ui.getPriorityDirective_);
};


/**
 * Extends Bootstrap typeahead for a better user experience. Also extends Bootstrap modal to prevent it from
 * competing for focus with select2.
 */
(function() {
  'use strict'; // jshint ;_;

  if (goog.isDef(window['jQuery'])) {
    var $ = window['jQuery'];
    if ($.fn && $.fn.typeahead) {
      $.extend($.fn.typeahead['Constructor'].prototype, {
        'getSelectedValue': function() {
          return this['$menu']['find']('.active')['attr']('data-value');
        },
        'setInputValue': function(val) {
          if (!val) {
            return null;
          }
          this['$element']['val'](this['updater'](val))['change']();
          return this;
        },
        'expandInputValueToSelection': function() {
          var val = this['getSelectedValue']();
          if (!val) {
            this['next']();
            val = this['getSelectedValue']();
          }
          return this['setInputValue'](val);
        },
        'select': function(opt_hide) {
          var val = this['getSelectedValue']();
          if (!val) {
            return this;
          }
          // unescape the autocomplete result before searching
          val = os.ui.unescapeHtmlOpenCloseTags(val);
          this['setInputValue'](val);

          if (opt_hide || opt_hide == undefined) {
            this['hide']();
          }

          return this;
        },
        'render': function(items) {
          var that = this;
          items = $(items)['map'](function(i, item) {
            // escape the autocomplete result to prevent html injection
            item = os.ui.escapeHtmlOpenCloseTags(item);
            i = $(that['options']['item'])['attr']('data-value', item);
            i['find']('a')['html'](that['highlighter'](item));
            return i[0];
          });
          this['$menu']['html'](items);
          return this;
        },
        'next': function(event) {
          var active = this['$menu']['find']('.active').removeClass('active');
          var next = active.next();

          if (!next.length) {
            next = $(this['$menu']['find']('li')[0]);
          }

          next.addClass('active');
        },
        'prev': function(event) {
          var active = this['$menu']['find']('.active').removeClass('active');
          var prev = active.prev();

          if (!prev.length) {
            prev = this['$menu']['find']('li').last();
          }

          prev.addClass('active');
        },
        'move': function(e) {
          if (!this['shown']) {
            return;
          }
          switch (e.keyCode) {
            case 27: // escape
              e.preventDefault();
              break;
            case 13: // enter
              if (!this['shown']) {
                return;
              }

              // update the search term to the selected item
              // and always submit the search on enter key
              this['select']();
              return;
            case 38: // up arrow
              e.preventDefault();
              this['prev']();
              break;
            case 40: // down arrow
              // some versions of Chrome send the wrong keyCode for ( on the keypress event, so ignore alleged down
              // arrows for keypress. the down arrow action will be handled by the keydown event.
              if (e.type != 'keypress') {
                e.preventDefault();
                this['next']();
              }
              break;
            default:
              break;
          }

          e.stopPropagation();
        },
        'keydown': function(e) {
          this['suppressKeyPressRepeat'] = ~$.inArray(e.keyCode, [40, 38, 39, 13, 27]);
          this['move'](e);
        },
        'keyup': function(e) {
          switch (e.keyCode) {
            case 40: // down arrow
            case 38: // up arrow
            case 16: // shift
            case 17: // ctrl
            case 18: // alt
              break;
            case 39: // right arrow
              if (!this['shown']) {
                return;
              }
              this['expandInputValueToSelection']()['hide']();
              break;
            case 13: // enter
            case 27: // escape
              if (!this['shown']) {
                return;
              }
              this['hide']();
              break;
            default:
              this['lookup']();
              break;
          }
          e.stopPropagation();
          e.preventDefault();
        },
        'click': function(e) {
          e.preventDefault();
          this.select();
        }
      });

      // make sure the user can't tab to the drop-down anchor tags
      $.fn.typeahead.defaults.item = '<li><a tabindex="-1" href=""></a></li>';

      // Select2 has trouble with Bootstrap modals in IE only
      if (goog.userAgent.IE) {
        // so tell it to do nothing
        $.fn.modal['Constructor'].prototype['enforceFocus'] = goog.nullFunction;
      }

      // Overwriting enforceFocus and extending functionality
      // Select2 and Bootstrap Modal compete for focus; this reconciles it
      var oldEnforceFocus = $.fn.typeahead['Constructor'].prototype['enforceFocus'];
      $.extend($.fn.typeahead['Constructor'].prototype, {
        'enforceFocus': function(e) {
          $(document).on('focusin.modal', goog.bind(function(e) {
            if ($(e.target).hasClass('select2-input')) {
              return;
            } else {
              oldEnforceFocus.call(this); // eslint-disable-line no-invalid-this
            }
          }, this));
        }
      });
    }
  }
})();
