goog.provide('os.ui.text.TuiEditorCtrl');
goog.provide('os.ui.text.tuiEditorDirective');
goog.require('os.ui.text.TuiEditorUI');

/**
 * @type {function(new: os.ui.text.TuiEditorUI.Controller, ...)}
 * @deprecated Please use goog.require('os.ui.text.TuiEditorUI').Controller instead.
 */
os.ui.text.TuiEditorCtrl = os.ui.text.TuiEditorUI.Controller;

/**
 * @deprecated Please use goog.require('os.ui.text.TuiEditorUI').directive instead.
 */
os.ui.text.tuiEditorDirective = os.ui.text.TuiEditorUI.directive;
