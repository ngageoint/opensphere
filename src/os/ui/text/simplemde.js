goog.provide('os.ui.text.SimpleMDE');
goog.provide('os.ui.text.SimpleMDECtrl');
goog.provide('os.ui.text.simpleMDEDirective');

goog.require('goog.dom.safe');
goog.require('ol.xml');
goog.require('os.ui.Module');


/**
 * The count by directive
 * @return {angular.Directive}
 */
os.ui.text.simpleMDEDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'text': '=',
      'edit': '=',
      'maxlength': '=',
      'isRequired': '=',
      'basictoolbar': '=?'
    },
    templateUrl: os.ROOT + 'views/text/simplemde.html',
    controller: os.ui.text.SimpleMDECtrl
  };
};


/**
 * Add the directive to the tools module
 */
os.ui.Module.directive('simplemde', [os.ui.text.simpleMDEDirective]);


/**
 * Counts the words for the simpleMDE
 * @param {Element} el
 */
os.ui.text.SimpleMDE.wordCount = function(el) {
  if (el) {
    var scope = $(el).scope();
    var html = '';

    if (scope) {
      var len = scope['text'] ? scope['text'].length : 0;
      var value = len;
      if (scope['maxlength']) {
        value += ' / ' + scope['maxlength'];
      }
      html = value;
    }

    goog.dom.safe.setInnerHtml(el, goog.html.SafeHtml.htmlEscape(html));
  }
};


/**
 * Status
 * @type {Array}
 */
os.ui.text.SimpleMDE.STATUS = [{
  'className': 'count',
  'defaultValue': os.ui.text.SimpleMDE.wordCount,
  'onUpdate': os.ui.text.SimpleMDE.wordCount
}];


/**
 * Toolbar buttons
 * @type {Array}
 */
os.ui.text.SimpleMDE.TOOLBAR = [
  'bold',
  'italic',
  'strikethrough',
  // 'heading',
  'heading-smaller',
  'heading-bigger',
  // 'heading-1',
  // 'heading-2',
  // 'heading-3',
  '|',
  'code',
  'quote',
  'unordered-list',
  'ordered-list',
  '|',
  'link',
  'image',
  'horizontal-rule',
  'table',
  '|',
  'preview',
  'side-by-side',
  'fullscreen'
];


/**
 * Toolbar buttons
 * @type {Array}
 */
os.ui.text.SimpleMDE.BASICTOOLBAR = [
  'bold',
  'italic',
  'strikethrough',
  'heading-smaller',
  'heading-bigger',
  '|',
  'code',
  'quote',
  'unordered-list',
  'ordered-list',
  '|',
  'preview'
];



/**
 * Controller class for the source switcher
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.text.SimpleMDECtrl = function($scope, $element, $timeout) {
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
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * @type {string}
   */
  this.scope_['id'] = goog.string.getRandomString();

  /**
   * the simplemde object
   * @type {Object}
   * @protected
   */
  this.simplemde = null;

  $scope['text'] = $scope['text'] || '';

  $scope.$watch('edit', goog.bind(function() {
    $timeout(this.resize_.bind(this), 100);
  }, this));
  $scope.$on('$destroy', this.onDestroy.bind(this));
  this.onReady();
};


/**
 * Method for kicking off initialization.
 */
os.ui.text.SimpleMDECtrl.prototype.onReady = function() {
  if (this.scope_) {
    this.timeout_(this.init.bind(this));
  }
};


/**
 * Cleanup
 */
os.ui.text.SimpleMDECtrl.prototype.onDestroy = function() {
  this.simplemde = null;
  this.timeout_ = null;
  this.element_ = null;
  this.scope_ = null;
};


/**
 * Make the preview return sanitized html
 * @param {string} plainText
 * @this SimpleMDE
 * @return {string}
 */
os.ui.text.SimpleMDECtrl.prototype.cleanHtml = function(plainText) {
  return os.ui.sanitize(this.parent.markdown(plainText));
};


/**
 * @param {Object=} opt_toolbar
 * @return {Object}
 */
os.ui.text.SimpleMDECtrl.prototype.getOptions = function(opt_toolbar) {
  var toolbar = os.ui.text.SimpleMDE.TOOLBAR;
  if (this.scope_['basictoolbar']) {
    toolbar = os.ui.text.SimpleMDE.BASICTOOLBAR;
  }

  if (opt_toolbar) {
    toolbar = opt_toolbar;
  }

  return {
    'autoDownloadFontAwesome': false,
    'autofocus': false,
    'autosave': {
      'enabled': false
    },
    'element': this.element_.find('.simplemdetextarea')[0],
    'initialValue': this.scope_['text'],
    'spellChecker': false,
    'toolbar': toolbar,
    'status': os.ui.text.SimpleMDE.STATUS,
    'previewRender': this.cleanHtml
  };
};


/**
 * Initialize simplemde
 * @param {Object=} opt_toolbar custom toolbar
 */
os.ui.text.SimpleMDECtrl.prototype.init = function(opt_toolbar) {
  if (this.element_) {
    this.simplemde = new SimpleMDE(this.getOptions(opt_toolbar));
    this.scope_['previewText'] = os.ui.text.SimpleMDE.removeMarkdown(this.scope_['text'], true);

    // Watch to see if something changes the text and update the value
    this.scope_.$watch('text', goog.bind(function(val) {
      if (val != this.simplemde.value()) {
        this.simplemde.value(val);
        os.ui.apply(this.scope_);
        this.timeout_(this.resize_.bind(this), 1000);
        this.timeout_(this.resize_.bind(this), 2000);
      }
      this.scope_['previewText'] = os.ui.text.SimpleMDE.removeMarkdown(this.scope_['text'], true);
    }, this));

    this.simplemde.codemirror.on('change', this.onChange_.bind(this));

    this.timeout_(this.resize_.bind(this), 2000);
  }
};


/**
 * This is a little hacky. Stolen from the codemirror on window resize logic
 * @private
 */
os.ui.text.SimpleMDECtrl.prototype.resize_ = function() {
  if (this.simplemde) {
    this.simplemde.codemirror.setSize();
  }
};


/**
 * @private
 */
os.ui.text.SimpleMDECtrl.prototype.onChange_ = function() {
  if (this.scope_ && this.scope_['simplemdeform']) {
    this.scope_['simplemdeform'].$setDirty();
  }
  this.scope_['text'] = this.simplemde.value();

  // Scope doesnt get applied automatically, so do it ourself
  os.ui.apply(this.scope_);
};


/**
 * Remove all the markdown syntax
 * @param {string} rawText
 * @param {boolean=} opt_keepLineBreaks Keep linebreaks in the text.
 * @return {string} - cleaned text
 */
os.ui.text.SimpleMDE.removeMarkdown = function(rawText, opt_keepLineBreaks) {
  if (rawText) {
    var cleanText = rawText;
    var node = os.ui.text.SimpleMDE.getHtmlNode(rawText);
    if (node) {
      cleanText = ol.xml.getAllTextContent(node, !opt_keepLineBreaks);
    }
    return os.ui.sanitize(cleanText);
  } else {
    return '';
  }
};


/**
 * Convert markdown text to an HTML node.
 * @param {string} rawText
 * @return {Node}
 */
os.ui.text.SimpleMDE.getHtmlNode = function(rawText) {
  var markdownParsed = SimpleMDE.prototype.markdown.call(/** @type {SimpleMDE} */ ({}), rawText);
  if (markdownParsed) {
    var safeHtml = goog.html.SafeHtml.create('div', undefined, markdownParsed);
    return goog.dom.safeHtmlToNode(safeHtml);
  }

  return null;
};


/**
 * Convert markdown text to html free string.
 * @param {string} rawText
 * @return {string}
 */
os.ui.text.SimpleMDE.getUnformatedText = function(rawText) {
  var markdownParsed = SimpleMDE.prototype.markdown.call(/** @type {SimpleMDE} */ ({}), rawText);
  if (markdownParsed) {
    return goog.string.normalizeSpaces(
        goog.string.normalizeWhitespace(/** @type {string} */($(markdownParsed).text())));
  }

  return '';
};
