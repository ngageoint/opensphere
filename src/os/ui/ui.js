goog.declareModuleId('os.ui');

const {fail} = goog.require('goog.asserts');
const SafeHtml = goog.require('goog.html.SafeHtml');
const {nearlyEquals} = goog.require('goog.math');
const Size = goog.require('goog.math.Size');
const {IE} = goog.require('goog.userAgent');


/**
 * Default priority used when replacing Angular directives.
 * @type {number}
 */
export const DIRECTIVE_PRIORITY = 100;

/**
 * Applications should use this to add a global reference to the main application's Angular injector.
 * @type {?angular.$injector}
 */
export let injector = null;

/**
 * Set the injector instance.
 * @param {?angular.$injector} value The injector.
 */
export const setInjector = (value) => {
  injector = value;
};

/**
 * This will be set automatically by {@link os.ui.sanitize}.
 * @type {angular.$sanitize}
 */
let sanitizeFn;

/**
 * CSS selector for modal backdrops.
 * @type {string}
 */
export const MODAL_SELECTOR = '.modal-backdrop,.window-modal-bg';

/**
 * Sanitizes a string to remove potentally malicious HTML content. Note that if the entire string is disallowed by the
 * $sanitize service, you'll get an empty string back.
 *
 * @param {string} value The value to sanitize
 * @return {string} The sanitized value, or the original value if angular.$sanitize is unavailable
 */
export const sanitize = function(value) {
  if (value) {
    try {
      sanitizeFn = sanitizeFn || (injector.get('$sanitize'));
      return sanitizeFn(value);
    } catch (e) {
      // make this super obvious so we catch it in dev
      // some errors come as a result of poorly formatted text, ignore those
      if (sanitizeFn === undefined) {
        console.error('$santize service unavailable!');
      } else if (injector === undefined) {
        console.error('os.ui.injector service never defined!');
      }
    }
  }

  return value;
};

/**
 * Escape a string that contains < or > to prevent html injection
 *
 * @param {string} value The value to escape
 * @return {string} The escaped value, may be the same as the original value
 */
export const escapeHtmlOpenCloseTags = function(value) {
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
 *
 * @param {string} value The value to unescape
 * @return {string} The unescaped value, may be the same as the original value
 */
export const unescapeHtmlOpenCloseTags = function(value) {
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
 *
 * @param {string} value The string to sanitize
 * @return {string}
 */
export const sanitizeId = function(value) {
  // collapse all whitespace and replace all non-alphanumeric characters with hyphens
  return value.replace(/\s/g, '').replace(/[^\w]/g, '-');
};

/**
 * Strip HTML from text
 *
 * @param {string} html string to sanitize
 * @return {string}
 */
export const getUnformattedText = function(html) {
  var doc = new DOMParser().parseFromString(html, 'text/html');
  return escapeHtml(doc.body.textContent || '');
};

/**
 * Escape HTML in text
 *
 * @param {string} html
 * @return {string}
 */
export const escapeHtml = function(html) {
  return SafeHtml.unwrap(SafeHtml.htmlEscape(html));
};

/**
 * Measures the given string of text. Note that this function adds a node to the DOM completely
 * off the screen. This can affect flow and document size and is intended for single-page
 * applications which use <code>overflow: hidden;</code> on the <code>body</code> tag.
 *
 * @param {string} text The text to measure
 * @param {string=} opt_classes The classes to use when measuring the string
 * @param {string=} opt_font The font style to use when measuring the string
 * @return {!Size} The size of the text
 */
export const measureText = function(text, opt_classes, opt_font) {
  var el = angular.element('#measureText');

  if (!el || el.length === 0) {
    // LEAVE AS A STYLE - This runs before css is loaded leaving it on the screen while the page loads
    el = $('<div id="measureText" style="left: -9999px; position: fixed; top: -9999px;"></div>').appendTo('body');
  }

  if (el && el.length > 0) {
    var classes = 'u-offscreen ';
    if (opt_classes) {
      classes += opt_classes;
    }
    el[0].setAttribute('class', classes);
    el.css('font', opt_font || '');

    // replace newline characters with HTML breaks
    el.html(text.replace(/\n/g, '<br>'));
    return new Size(/** @type {number} */ (el.width()), /** @type {number} */ (el.height()));
  }

  return new Size(0, 0);
};

/**
 * Applies the scope with angular.Scope#apply.
 *
 * @param {?angular.Scope} scope The Angular scope.
 * @param {number=} opt_delay Timeout interval to wait before applying the scope, in milliseconds
 */
export const apply = function(scope, opt_delay) {
  if (opt_delay != null && opt_delay >= 0) {
    setTimeout(function() {
      apply(scope);
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
 * Asynchronously applies the scope with angular.Scope#applyAsync.
 *
 * @param {?angular.Scope} scope The Angular scope.
 */
export const applyAsync = function(scope) {
  if (scope) {
    scope.$applyAsync();
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
export const waitForAngular = function(callback) {
  if (injector) {
    var browser = /** @type {angular.$browser} */ (injector.get('$browser'));
    if (browser) {
      browser.notifyWhenNoOutstandingRequests(callback);
    }
  }
};

/**
 * Get the highest priority directive in a list.
 *
 * @param {!Array<!angular.Directive>} $delegate The directives.
 * @return {!Array<!angular.Directive>} The highest priority directive.
 * @ngInject
 */
const getPriorityDirective_ = function($delegate) {
  $delegate.sort(sortDirectives_);
  return [$delegate[0]];
};

/**
 * Sort directives by descending priority.
 *
 * @param {!angular.Directive} a The first directive.
 * @param {!angular.Directive} b The second directive.
 * @return {number} The sort order.
 */
const sortDirectives_ = function(a, b) {
  return a.priority > b.priority ? -1 : a.priority < b.priority ? 1 : 0;
};

/**
 * Listen to an element for size changes.
 * @param {?(angular.JQLite|jQuery)} el The element.
 * @param {?Function} fn The callback to remove.
 */
export const resize = function(el, fn) {
  if (el && fn) {
    if (window.ResizeSensor) {
      new ResizeSensor(el, fn);
    } else {
      fail('The css-element-queries ResizeSensor library is not loaded. Element resize detection will ' +
          'not work.');
    }
  }
};

/**
 * Remove resize listener from an element.
 * @param {?(angular.JQLite|jQuery)} el The element.
 * @param {?Function} fn The callback to remove.
 */
export const removeResize = function(el, fn) {
  if (el && fn && window.ResizeSensor != null) {
    ResizeSensor.detach(el, fn);
  }
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
export const replaceDirective = function(name, module, directiveFn, opt_priority) {
  // set the directive priority so the new directive is returned by os.ui.getPriorityDirective_
  var priority = opt_priority != null ? opt_priority : DIRECTIVE_PRIORITY;
  var directive = function() {
    var d = directiveFn();
    d.priority = priority;
    return d;
  };

  // register the new version of the directive
  module.directive(name, [directive]);

  // register a decorator to return the highest priority directive
  module.decorator(name + 'Directive', getPriorityDirective_);
};

/**
 * Custom events fired from a typeahead.
 * @enum {string}
 */
export const TypeaheadEventType = {
  CLICK: 'typeahead:click'
};

/**
 * Extends Bootstrap typeahead for a better user experience. Also extends Bootstrap modal to prevent it from
 * competing for focus with select2.
 */
(function() {
  'use strict'; // jshint ;_;

  if (window['jQuery'] !== undefined) {
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
          val = unescapeHtmlOpenCloseTags(val);
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
            item = escapeHtmlOpenCloseTags(item);
            i = $(that['options']['item'])['attr']('data-value', item);
            i['find']('a')['html'](that['highlighter'](item));
            return i[0];
          });
          this['$menu']['html'](items);
          return this;
        },
        'next': function(event) {
          var active = this['$menu']['find']('.active').removeClass('active');
          active.find('a').removeClass('active');
          var next = active.next();

          if (!next.length) {
            next = $(this['$menu']['find']('li')[0]);
          }

          next.addClass('active');
          next.find('a').addClass('active');
        },
        'prev': function(event) {
          var active = this['$menu']['find']('.active').removeClass('active');
          active.find('a').removeClass('active');
          var prev = active.prev();

          if (!prev.length) {
            prev = this['$menu']['find']('li').last();
          }

          prev.addClass('active');
          prev.find('a').addClass('active');
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
          // the typeahead will only update the input value, but will not submit the form. to differentiate between the
          // user hitting enter (which will trigger a form submit) and a click, fire an event from the element to
          // indicate a value was selected via click.
          this['$element'].trigger(TypeaheadEventType.CLICK);
        }
      });

      // make sure the user can't tab to the drop-down anchor tags
      $.fn.typeahead.defaults.item = '<li><a tabindex="-1" class="dropdown-item text-truncate" href=""></a></li>';
      $.fn.typeahead.defaults.menu = '<ul class="typeahead dropdown-menu mw-100"></ul>';

      // Select2 has trouble with Bootstrap modals in IE only
      if (IE) {
        // so tell it to do nothing
        $.fn.modal['Constructor'].prototype['enforceFocus'] = () => {};
      }

      // Overwriting enforceFocus and extending functionality
      // Select2 and Bootstrap Modal compete for focus; this reconciles it
      var oldEnforceFocus = $.fn.typeahead['Constructor'].prototype['enforceFocus'];
      $.extend($.fn.typeahead['Constructor'].prototype, {
        'enforceFocus': function(e) {
          $(document).on('focusin.modal', function(e) {
            if ($(e.target).hasClass('select2-input')) {
              return;
            } else {
              oldEnforceFocus.call(this); // eslint-disable-line no-invalid-this
            }
          }.bind(this));
        }
      });
    }
  }
})();

/**
 * Override jQuery UI Datepicker _checkOffset to prevent rounding/floating point equality from breaking
 * offset top calculation
 */
(function() {
  'use strict';

  if (window['jQuery'] !== undefined) {
    var $ = window['jQuery'];

    if ($.datepicker) {
      $.extend($.datepicker, {
        '_checkOffset': function(inst, offset, isFixed) {
          var dpWidth = inst['dpDiv']['outerWidth']();
          var dpHeight = inst['dpDiv']['outerHeight']();
          var inputWidth = inst['input'] ? inst['input']['outerWidth']() : 0;
          var inputHeight = inst['input'] ? inst['input']['outerHeight']() : 0;
          var viewWidth = document.documentElement.clientWidth + (isFixed ? 0 : $(document).scrollLeft());
          var viewHeight = document.documentElement.clientHeight + (isFixed ? 0 : $(document).scrollTop());

          offset['left'] -= (this['_get'](inst, 'isRTL') ? dpWidth - inputWidth : 0);
          offset['left'] -= (isFixed && offset['left'] == inst['input']['offset']()['left']) ?
            $(document).scrollLeft() : 0;
          offset['top'] -= nearlyEquals(isFixed && offset['top'],
              inst['input']['offset']()['top'] + inputHeight, 1) ?
            $(document).scrollTop() : 0;

          offset['left'] -= Math.min(offset['left'], offset['left'] + dpWidth > viewWidth && viewWidth > dpWidth ?
            Math.abs(offset['left'] + dpWidth - viewWidth) : 0);
          offset['top'] -= Math.min(offset['top'], offset['top'] + dpHeight > viewHeight && viewHeight > dpHeight ?
            Math.abs(dpHeight + inputHeight) : 0);

          return offset;
        }
      });
    }
  }
})();
