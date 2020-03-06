if (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1) {
  // required to load jQuery
  // @see https://stackoverflow.com/questions/32621988/electron-jquery-is-not-defined
  if (window.module) {
    module = window.module;
  }
}
