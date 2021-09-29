goog.declareModuleId('os.ui.window.ConfirmColumnOptions');

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');

/**
 * Options provided to the confirm column UI.
 * @typedef {{
 *   confirm: (Function|undefined),
 *   cancel: (Function|undefined),
 *   columns: (Array<ColumnDefinition>|undefined),
 *   prompt: (string|undefined),
 *   defaultValue: (ColumnDefinition|undefined),
 *
 *   windowOptions: (osx.window.WindowOptions|undefined)
 * }}
 */
let ConfirmColumnOptions;

export default ConfirmColumnOptions;
