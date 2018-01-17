if (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1) {
  // required to load jQuery
  // @see https://stackoverflow.com/questions/32621988/electron-jquery-is-not-defined
  if (typeof module === 'object') {
    window.module = module;
    module = undefined;
  }

  // allow the file:// protocol to be used by the fetch API
  require('electron').webFrame.registerURLSchemeAsPrivileged('file');
}
