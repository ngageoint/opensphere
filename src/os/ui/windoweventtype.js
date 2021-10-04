goog.declareModuleId('os.ui.WindowEventType');

/**
 * @enum {string}
 */
const WindowEventType = {
  CANCEL: 'windowCancel',
  CLOSING: 'windowClosing',
  CLOSE: 'windowClose',
  DRAGSTART: 'windowDragStart',
  DRAGSTOP: 'windowDragStop',
  HEADERBTN: 'windowHeaderBtn',
  OPEN: 'windowOpen',
  RECONSTRAIN: 'windowReConstrain',
  READY: 'window.ready'
};

export default WindowEventType;
