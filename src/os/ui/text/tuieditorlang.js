goog.provide('os.ui.text.TuiEditorLang');


/**
 * Since tui editor is lazy loaded, run after loading
 * No easy way to change button text. Opened issue #524 on github
 * @param {boolean=} opt_supportHotkeys
 */
os.ui.text.TuiEditorLang.setup = function(opt_supportHotkeys) {
  // This is the language block for tui editor so we can modify words in their UI
  var options = tui.Editor.i18n._langs.get('en_US');

  // Add hotkeys to tooltips
  if (opt_supportHotkeys) {
    options['Bold'] = options['Bold'] + ' (ctrl + b)';
    options['Blockquote'] = options['Blockquote'] + ' (alt + q)';
    options['Code'] = options['Code'] + ' (shift + ctrl + c)';
    // Opened issue #581
    // options['Insert CodeBlock'] = options['Insert CodeBlock'] + ' (shift + ctrl + p)';
    options['Italic'] = options['Italic'] + ' (ctrl + i)';
    options['Line'] = options['Line'] + ' (ctrl + l)';
    options['Ordered list'] = options['Ordered list'] + ' (ctrl + o)';
    options['Strike'] = options['Strike'] + ' (ctrl + s)';
    options['Task'] = options['Task'] + ' (alt + t)';
    options['Unordered list'] = options['Unordered list'] + ' (ctrl + u)';
  }

  options['Markdown'] = 'Text';
  options['WYSIWYG'] = 'Visual';
  tui.Editor.i18n._langs.set('en_US', options);
};
