goog.provide('os.ui.help.supportMsg');
goog.require('goog.format.JsonPrettyPrinter');
goog.require('goog.userAgent');
goog.require('os.config.Settings');



/**
 * Provides standard subject and body email message
 * content for support mailto links.
 *
 * NOTE: IE has get url limt of 2083 characters
 * on windows 7. Chrome has a URL limit of 2046 on windows.
 * Anything longer than that will cause a mailto link to be
 * truncated or just not work. Non windows boxes seem to have
 * a higher limit, not sure of the exact value so using an
 * arbitrary 3096 default.
 * @constructor
 * @param {Object=} opt_options optional default overrides
 */
os.ui.help.supportMsg = function(opt_options) {
  opt_options = opt_options || {};
  this.subject = goog.string.escapeString(opt_options['subject'] || this.getDefaultSubjectLine_());
  this.bodyHeader = opt_options['bodyHeader'] || '';
  this.bodyContent = opt_options['bodyContent'] || 'Provide detailed description of the issue:\n\n\n\n';
  this.location = opt_options['location'] || document.location.href;
  this.maxLength = opt_options.maxLength || (goog.userAgent.WINDOWS ? 2041 : 3096);
};


/**
 * Returns a parametered string for email, e.g.
 * subject=[this.subject]&body=...
 * @return {string}
 */
os.ui.help.supportMsg.prototype.getMailToParameters = function() {
  var result = 'subject=' + escape(this.subject) + '&body=';
  var body = this.bodyHeader + this.bodyContent +
      '---- SUPPORT DATA ----\n' +
      'location:' + this.location + '\n' +
      'user-agent:' + goog.userAgent.getUserAgentString() + '\n' +
      'WINDOWS:' + goog.userAgent.WINDOWS + '\n' +
      'MAC:' + goog.userAgent.MAC + '\n' +
      'LINUX:' + goog.userAgent.LINUX + '\n' +
      'PLATFORM:' + goog.userAgent.PLATFORM + '\n' +
      this.getModernizrValues();
  // truncate the body part to acomadate the max width with a margin for encoding.
  var maxBodyLength = this.maxLength - result.length - 200;
  result = result + escape(body.substring(0, maxBodyLength));
  return result;
};


/**
 * Use settings, if possible, to build a default subject line.
 * @return {string}
 * @private
 */
os.ui.help.supportMsg.prototype.getDefaultSubjectLine_ = function() {
  var applicationName = /** @type {string|undefined} */ (os.settings.get('about.application'));
  var result = 'Support Request';
  if (applicationName) {
    result = result + ' - ' + applicationName;
  }
  return result;
};


/**
 * Returns formatted mailto href string.
 * @param {string|undefined|null} emailAddress
 * @return {string}
 */
os.ui.help.supportMsg.prototype.getMailTo = function(emailAddress) {
  var result = 'mailto:' + emailAddress + '?' + this.getMailToParameters();
  return result.substring(0, this.maxLength);
};


/**
 * Reads most values from modernizer as a string
 * @return {string}
 */
os.ui.help.supportMsg.prototype.getModernizrValues = function() {
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
};
