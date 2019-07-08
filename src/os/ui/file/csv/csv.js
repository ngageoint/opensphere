goog.provide('os.ui.file.csv');


/**
 * Configure Papa Parse for use with OpenSphere.
 */
os.ui.file.csv.configurePapaParse = function() {
  // Papa Parse locates the script path by looking up the last script element on the page. this is generally a fine
  // assumption, unless a browser extension injects scripts at the end of the page. this locates the script by a more
  // specific selector that should be less prone to false positives.
  if (!Papa.SCRIPT_PATH) {
    var papaScriptEl = /** @type {HTMLScriptElement} */ (document.querySelector('script[src*="papaparse"]'));
    if (papaScriptEl) {
      Papa.SCRIPT_PATH = papaScriptEl.src;
    }
  }

  // if workers aren't available, reduce Papa's default chunk size to prevent the browser from hanging
  if (!Modernizr.webworkers) {
    Papa.LocalChunkSize = 1024 * 1024 * 1; // 1 MB (default 10MB)
    Papa.RemoteChunkSize = 1024 * 1024 * 1; // 1 MB (default 5MB)
  }
};
