goog.provide('os.ui.text.TuiEditor');
goog.provide('os.ui.text.TuiEditorCtrl');
goog.provide('os.ui.text.tuiEditorDirective');
goog.require('goog.dom.safe');
goog.require('ol.xml');
goog.require('os.ui.Module');


/**
 * @type {string}
 */
os.ui.text.TuiEditor.MODE_KEY = 'tuieditor.mode';


/**
 * The count by directive
 * @return {angular.Directive}
 */
os.ui.text.tuiEditorDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'text': '=',
      'edit': '<',
      'maxlength': '=',
      'isRequired': '=',
      'toolbar': '=?'
    },
    templateUrl: os.ROOT + 'views/text/tuieditor.html',
    controller: os.ui.text.TuiEditorCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the tools module
 */
os.ui.Module.directive('tuieditor', [os.ui.text.tuiEditorDirective]);



/**
 * Controller class for the source switcher
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.text.TuiEditorCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

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
   * the tuieditor object
   * @type {Object}
   */
  this['tuiEditor'] = null;

  /**
   * @type {string}
   */
  $scope['text'] = $scope['text'] || '';

  this.element_.on('keydown', this.onKeyboardEvent_);
  this.element_.on('keypress', this.onKeyboardEvent_);

  $timeout(function() {
    if (this.scope) {
      this.init();
    }
  }.bind(this));

  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * Cleanup
 */
os.ui.text.TuiEditorCtrl.prototype.destroy = function() {
  this['tuiEditor'] = null;
  this.element_.off('keydown');
  this.element_.off('keypress');
  this.element_ = null;
  this.scope = null;
  this.timeout_ = null;
};


/**
 * Consume keydown events so they are not passed to the map.
 * Without this event listener the following characters
 * will not be received by editor in WYSIWYG mode:
 *  'r', 'u', 'v', 'n', '>', '.', and arrow keys.
 * We had a discussion to add this to ol.events.condition.targetNotEditable but
 * decided since its an isolated case to do it here
 * @param {Object} event
 * @private
 */
os.ui.text.TuiEditorCtrl.prototype.onKeyboardEvent_ = function(event) {
  event.stopPropagation();
};


/**
 * @return {string}
 * @export
 */
os.ui.text.TuiEditorCtrl.prototype.getWordCount = function() {
  var len = this.scope['text'] ? this.scope['text'].length : 0;
  var value = len;
  if (this.scope['maxlength']) {
    value += ' / ' + this.scope['maxlength'];
  }

  return value;
};


/**
 * @return {Object}
 */
os.ui.text.TuiEditorCtrl.prototype.getOptions = function() {
  var options = {
    'el': this.element_.find('.js-tui-editor__editor')[0],
    'height': 'auto',
    'linkAttribute': {
      'target': 'blank'
    },
    'initialValue': this.scope['text'] || '',
    'initialEditType': os.settings.get(os.ui.text.TuiEditor.MODE_KEY, 'wysiwyg'),
    'toolbarItems': this.getToolbar(),
    'events': {
      'change': this.onChange_.bind(this)
    },
    'codeBlockLanguages': ['markdown'],
    'usedefaultHTMLSanitizer': true,
    'useCommandShortcut': false,
    'usageStatistics': false,
    'exts': this.getExtensions(),
    'hooks': this.getHooks()
  };

  return options;
};


/**
 * Initialize tuieditor
 */
os.ui.text.TuiEditorCtrl.prototype.init = function() {
  if (this.scope['edit']) {
    this['tuiEditor'] = new tui.Editor(this.getOptions());

    // HACK. There are no hooks to change the button text. So change it after the editor renders
    // Opened issue #524 on github
    this.timeout_(function() {
      if (this.element_) {
        var markdownButtonElement = this.element_.find('button.te-switch-button.markdown');
        if (markdownButtonElement.length) {
          markdownButtonElement.text('Text');
        }
        var wysiwygButtonElement = this.element_.find('button.te-switch-button.wysiwyg');
        if (wysiwygButtonElement.length) {
          wysiwygButtonElement.text('Visual');
        }
      }
    }.bind(this));
  } else {
    this['tuiEditor'] = tui.Editor.factory({
      'el': this.element_.find('.js-tui-editor__viewer'),
      'viewer': true,
      'height': 'auto',
      'initialValue': this.scope['text']
    });
  }

  // Watch to see if something changes the text and update the value
  this.scope.$watch('text', function(val) {
    if (val != (this.scope['edit'] ? this['tuiEditor'].getValue() : this['tuiEditor']['markdownValue'])) {
      this['tuiEditor'].setValue(val);
      os.ui.apply(this.scope);
      this.setTargetBlankPropertyInLinks();
    }
  }.bind(this));
};


/**
 * @private
 */
os.ui.text.TuiEditorCtrl.prototype.onChange_ = function() {
  if (this.scope && this.scope['tuiEditorForm']) {
    this.scope['tuiEditorForm'].$setDirty();
  }

  this.scope['text'] = this['tuiEditor'].getValue();
  os.ui.apply(this.scope);
};


/**
 * @param {string} url
 * @param {string=} opt_altText
 */
os.ui.text.TuiEditorCtrl.prototype.insertImage = function(url, opt_altText) {
  this['tuiEditor'].eventManager.emit('command', 'AddImage', {
    'imageUrl': url,
    'altText': opt_altText || 'image'
  });
};


/**
 * @param {string} linkText
 * @param {string} url
 */
os.ui.text.TuiEditorCtrl.prototype.insertLink = function(linkText, url) {
  this['tuiEditor'].eventManager.emit('command', 'AddLink', {
    'linkText': linkText,
    'url': url
  });
};



/**
 * Get all the hooks we support
 * @return {Object}
 */
os.ui.text.TuiEditorCtrl.prototype.getHooks = function() {
  return {
    'changeMode': function(mode) {
      os.settings.set(os.ui.text.TuiEditor.MODE_KEY, mode);
    }
  };
};


/**
 * Get all the extensions we support
 * @return {Array<string>}
 */
os.ui.text.TuiEditorCtrl.prototype.getExtensions = function() {
  return [
    // 'colorSyntax', This is a really cool extension, however it addes invalid markdown that we sanitize out
    // After we fix the sanitizer, we can re-enable it. Leaving this code comment in for people to know why
    // it was excluded
    'table'
  ];
};


/**
 * Get all the toolbar buttons we support (undefined is default library toolbar)
 * @return {Array|undefined}
 */
os.ui.text.TuiEditorCtrl.prototype.getToolbar = function() {
  return undefined;
};


/**
 * Temporary until option is added to tui-editor viewer mode (commented on issue #527)
 */
os.ui.text.TuiEditorCtrl.prototype.setTargetBlankPropertyInLinks = function() {
  if (this.element_ && this.element_.find('.js-tui-editor__viewer')) {
    var links = this.element_.find('.js-tui-editor__viewer a');
    if (links.length) {
      links.prop('target', '_blank');
    }
  }
};


/**
 * @param {string=} opt_markdown
 * @return {string} - markdown parsed to html
 */
os.ui.text.TuiEditor.render = function(opt_markdown) {
  return opt_markdown ? tui.Editor.markdownit.render(opt_markdown) : '';
};


/**
 * Convert markdown text to html free string.
 * @param {string=} opt_markdown
 * @return {string}
 */
os.ui.text.TuiEditor.getUnformatedText = function(opt_markdown) {
  var html = $(os.ui.text.TuiEditor.render(opt_markdown));
  if (html && html.length) {
    return goog.string.normalizeSpaces(goog.string.normalizeWhitespace(/** @type {string} */ (html.text())));
  } else {
    return '';
  }
};
