goog.module('os.ui.help.supportMsg');

const {escapeString} = goog.require('goog.string');
const userAgent = goog.require('goog.userAgent');
const Settings = goog.require('os.config.Settings');


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
 */
class supportMsg {
  /**
   * Constructor.
   * @param {Object=} opt_options optional default overrides
   */
  constructor(opt_options) {
    opt_options = opt_options || {};
    this.subject = escapeString(opt_options['subject'] || this.getDefaultSubjectLine_());
    this.bodyHeader = opt_options['bodyHeader'] || '';
    this.bodyContent = opt_options['bodyContent'] || 'Provide detailed description of the issue:\n\n\n\n';
    this.location = opt_options['location'] || document.location.href;
    this.maxLength = opt_options.maxLength || (userAgent.WINDOWS ? 2041 : 3096);
  }

  /**
   * Returns a parametered string for email, e.g.
   * subject=[this.subject]&body=...
   *
   * @return {string}
   */
  getMailToParameters() {
    var result = 'subject=' + escape(this.subject) + '&body=';
    var body = this.bodyHeader + this.bodyContent +
        '---- SUPPORT DATA ----\n' +
        'location:' + this.location + '\n' +
        'user-agent:' + userAgent.getUserAgentString() + '\n' +
        'WINDOWS:' + userAgent.WINDOWS + '\n' +
        'MAC:' + userAgent.MAC + '\n' +
        'LINUX:' + userAgent.LINUX + '\n' +
        'PLATFORM:' + userAgent.PLATFORM + '\n' +
        this.getModernizrValues();
    // truncate the body part to acomadate the max width with a margin for encoding.
    var maxBodyLength = this.maxLength - result.length - 200;
    result = result + escape(body.substring(0, maxBodyLength));
    return result;
  }

  /**
   * Use settings, if possible, to build a default subject line.
   *
   * @return {string}
   * @private
   */
  getDefaultSubjectLine_() {
    var applicationName = /** @type {string|undefined} */ (Settings.getInstance().get('about.application'));
    var result = 'Support Request';
    if (applicationName) {
      result = result + ' - ' + applicationName;
    }
    return result;
  }

  /**
   * Returns formatted mailto href string.
   *
   * @param {string|undefined|null} emailAddress
   * @return {string}
   */
  getMailTo(emailAddress) {
    var result = 'mailto:' + emailAddress + '?' + this.getMailToParameters();
    return result.substring(0, this.maxLength);
  }

  /**
   * Reads most values from modernizer as a string
   *
   * @return {string}
   */
  getModernizrValues() {
    var result = '';
    for (var key in Modernizr) {
      if (key.indexOf('_') === 0 ||
          typeof Modernizr[key] === 'function') {
        continue;
      } else if (Modernizr[key] instanceof Boolean) {
        result += key + ':' + Modernizr[key].valueOf() + '\n';
      } else if (typeof Modernizr[key] === 'object') {
        continue;
      }
      result += key + ':' + Modernizr[key] + '\n';
    }
    return result;
  }
}

exports = supportMsg;
