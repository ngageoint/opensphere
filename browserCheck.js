/**
 * smallest native js domready ever
 */
function ready() {
  if (/in/.test(document.readyState)) {
    setTimeout(ready, 9);
  } else {
    populateCheckInfo();
    setContactInfo();
  }
}


/**
 * Appends test results to DOM
 * @param {element} el
 * @param {string} msg
 * @param {boolean} test
 * @return {boolean}
 */
function append(el, msg, test) {
  var li = document.createElement('li');
  if (typeof (platform) != 'undefined' && platform.name == 'IE' && parseFloat(platform.version) < 8) {
    li.innerHTML = (test ? '/' : 'X') + ' ' + msg;
  } else {
    li.innerHTML = msg;
    li.className = test ? 'js-found' : 'js-missing';
  }
  el.appendChild(li);
  return test;
}


/**
 * runs the browser check
 */
function runBrowserCheck() {
  var baseUrl = 'old.html';
  var currentLocation = window.location.toString();
  if (!checkCompat() && !checkVersion()) {
    if (currentLocation.indexOf('/' + baseUrl) == -1) {
      // old.html is in the version directory, so prepend if we have a version string
      // version string will be replaced by the build. if not, clear it out so it doesn't affect the target url.
      var version = '@version@'.replace(/@\w+@/, '');
      window.location = version && currentLocation.indexOf(version) == -1 ? (version + baseUrl) : baseUrl;
    } else {
      ready();
    }
  } else if (currentLocation.indexOf('/' + baseUrl) != -1) {
    ready();
  }
}


/**
 * removes test results and reruns browser check
 * @param {boolean} doSpin
 */
function populateCheckInfo(doSpin) {
  showBrowserWaitSpin(false);
  var el = document.getElementsByClassName('js-full-list')[0];
  var html = document.getElementsByTagName('html')[0];
  if (el && html) {
    var result = getModernizrValues();
    el.innerHTML = result != '' ? result : 'no capabilities found';
    toggleFullList(true);
  }
  var ul = document.getElementsByClassName('js-checks')[0];
  if (ul) { // do each check and add the result
    append(ul, 'Canvas render - draws graphics like the map',
        typeof (Modernizr) != 'undefined' && Modernizr.canvas);
    append(ul, 'Cross-Origin Resource Sharing - allows retrieving resources from other domains',
        typeof (Modernizr) != 'undefined' && Modernizr.cors);
    append(ul, 'Flexbox - used for layout and making things pretty',
        typeof (Modernizr) != 'undefined' && Modernizr.flexbox);
    append(ul, 'IndexedDB - allows data to be stored in local browser database',
        typeof (Modernizr) != 'undefined' && Modernizr.indexeddb);
    append(ul, 'Local storage - stores settings & caches images',
        typeof (Modernizr) != 'undefined' && Modernizr.localstorage);
    append(ul, 'SVG render - draws 2D vectors like the legend and timeline',
        typeof (Modernizr) != 'undefined' && Modernizr.svg);
    append(ul, 'Webworkers - allows tasks to run in the background',
        typeof (Modernizr) != 'undefined' && Modernizr.webworkers);
  }
  var result = document.getElementsByClassName('js-report')[0];
  if (result) {
    var report = 'Unsupported Browser!';
    if (checkVersion()) {
      report = 'Supported Browser!';
      if (!checkCompat()) {
        report += ' <small><strong>(required features may be disabled!)</strong></small>';
      }
    }
    result.innerHTML = report;
  }
}


/**
 * checks compatibility
 * @return {boolean}
 */
function checkCompat() {
  return typeof (Modernizr) != 'undefined' && Modernizr.canvas && Modernizr.localstorage && Modernizr.svg &&
      Modernizr.webworkers && Modernizr.flexbox && Modernizr.indexeddb && Modernizr.cors;
}


/**
 * checks minimum version
 * @return {boolean}
 */
function checkVersion() {
  return typeof (platform) != 'undefined' && ((platform.name == 'Chrome' && parseFloat(platform.version) >= 35) ||
      (platform.name == 'Firefox' && parseFloat(platform.version) >= 38));
}


/**
 * removes test results and reruns browser check
 * @return {string}
 */
function getModernizrValues() {
  var result = '';
  for (var key in Modernizr) {
    if (key.indexOf('_') === 0 ||
        typeof Modernizr[key] === 'function' ||
        typeof Modernizr[key] === 'object') {
      continue;
    }
    result += key + ':' + Modernizr[key] + '\n';
  }
  return result;
}


/**
 * extracts all info from config
 * @return {string}
 */
function getConfig() {
  var request = new XMLHttpRequest();
  var parsed;

  request.open('GET', 'config/settings.json', false);
  request.onload = function() {
    if (request.readyState === 4 && request.status === 200) {
      parsed = JSON.parse(request.responseText);
    }
  };
  request.send(null);
  return parsed;
}


/**
 * extracts contact info from config and put it in the DOM
 */
function setContactInfo() {
  var parsed = getConfig();
  var browserPage = '';
  if (parsed) {
    var contactEl = document.getElementsByClassName('js-contact-info')[0];
    if (parsed && parsed['admin'] && contactEl) {
      var a = document.createElement('a');
      var strong = document.createElement('strong');
      strong.innerText = 'Help: ';
      var link = parsed['admin']['supportWebsite'];
      var text = parsed['admin']['supportWebsiteText'];
      if (link && text) {
        contactEl.appendChild(strong);
        contactEl.appendChild(document.createElement('br'));
        a.setAttribute('href', link);
        a.className = 'btn btn-info';
        a.innerHTML = text;
        contactEl.appendChild(a);
        contactEl.appendChild(document.createElement('p'));
      }
    }
  }

  if (!checkCompat() && checkVersion()) {
    var warn = '<em>Your browser has been configured to disable features required by this application.</em> ' +
      '<p>Please enable those features or contact your IT department for support.</p>';
    if (platform.name == 'Firefox' && (!Modernizr.localstorage || !Modernizr.indexeddb)) {
      var parsed = getConfig();
      if (parsed && parsed['admin'] && parsed['admin']['firefoxCompatibleVersionLocalStorageOrIndexedDBErrorLink']) {
        warn += '<p>For local storage or indexedDB related issues, see <a href="' +
          parsed['admin']['firefoxCompatibleVersionLocalStorageOrIndexedDBErrorLink'] + '">this article</a></p>';
      }
    }
    var link = '';
    if (browserPage) {
      link = '<a href="' + browserPage + '" class="btn btn-danger">Browser Download</a> <br> <br>';
    }
    setWarn(warn, link);
  } else if (checkVersion()) {
    setWarn('');
  } else {
    var minSupportInfo = '<strong>Recommended Browsers:</strong>' +
      '<ul class="u-bullet">' +
      '<li>Google Chrome version 60+</li>' +
      '<li>Mozilla Firefox version 57+</li>' +
      '</ul>' +
      '<p>If you do not have one of these browsers installed, contact your local IT department for help.</p>';

    if (browserPage) {
      minSupportInfo += '<a href="' + browserPage + '" class="btn btn-danger">Browser Download</a> <br> <br>';
    }
    setWarn(minSupportInfo);
  }
  var browserInfo = document.getElementsByClassName('js-browser-info')[0];
  if (browserInfo && typeof (platform) != 'undefined') {
    browserInfo.innerHTML = '<ul><li class="' + (checkVersion() ? 'js-found' : 'js-missing' ) + '">' +
        platform.name + ' Version ' + platform.version + ' detected</li></ul>';
  }
}


/**
 * updates the warning message
 * @param {string} msg1
 * @param {string=} opt_msg2
 */
function setWarn(msg1, opt_msg2) {
  var minBrowserEl = document.getElementsByClassName('js-min-browser-msg')[0];
  if (minBrowserEl) {
    while (minBrowserEl.hasChildNodes()) {
      minBrowserEl.removeChild(minBrowserEl.firstChild);
    }
    if (opt_msg2) {
      var p = document.createElement('p');
      p.innerHTML = msg1;
      var p2 = document.createElement('p');
      p2.innerHTML = opt_msg2;
      minBrowserEl.appendChild(p);
      minBrowserEl.appendChild(p2);
    } else {
      minBrowserEl.innerHTML = msg1;
    }
  }
}


/**
 * removes test results and reruns browser check
 * @param {boolean} doSpin
 */
function showBrowserWaitSpin(doSpin) {
  var spin = document.getElementsByClassName('js-browser-check-wait')[0];
  if (spin) {
    spin.style.display = doSpin ? '' : 'none';
  }
}


/**
 * removes test results and reruns browser check
 */
function retryBrowserCheck() {
  var ul = document.getElementsByClassName('js-checks')[0];
  if (ul) {
    while (ul.hasChildNodes()) {
      ul.removeChild(ul.firstChild);
    }
  }
  showBrowserWaitSpin(true);
  var result = document.getElementsByClassName('js-report')[0];
  if (result) {
    result.innerHTML = '';
  }
  window.setTimeout(populateCheckInfo, 500);
}


/**
 * toggles full list of detected capabilities
 * @param {boolean=} opt_hide
 */
function toggleFullList(opt_hide) {
  var el = document.getElementsByClassName('js-full-list')[0];
  if (el) {
    el.style.display = opt_hide ? 'none' : el.style.display == 'none' ? '' : 'none';
  }
}

runBrowserCheck();
