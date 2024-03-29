goog.declareModuleId('os.auth');

import AlertEventSeverity from './alert/alerteventseverity.js';
import AlertManager from './alert/alertmanager.js';
import Settings from './config/settings.js';


/**
 * @typedef {{
 *   title: string,
 *   pattern: RegExp,
 *   tooltip: string,
 *   message: string,
 *   link: string
 * }}
 */
export let AuthEntry;


/**
 * Registry of available authentication entries from settings.
 * @type {Object<string, AuthEntry>}
 */
const registry = {};


/**
 * Map of auth entries to whether they've fired an alert in the current app session.
 * @type {Object<string, boolean>}
 */
const alerts = {};


/**
 * The settings key for the authentication entries.
 * @type {string}
 */
export const SettingKey = 'os.auth';

/**
 * Initializes the authentication entries from settings
 */
export const initAuth = () => {
  const authSettings = Settings.getInstance().get(SettingKey, {});

  for (const key in authSettings) {
    const item = authSettings[key];

    registry[key] = {
      title: /** @type {string} */ (item['title']),
      pattern: new RegExp(item['pattern'], 'i'),
      tooltip: /** @type {string} */ (item['tooltip']),
      message: /** @type {string} */ (item['message']),
      link: /** @type {string} */ (item['link'])
    };
  }
};

/**
 * Initializes the authentication entries from settings.
 * @param {?string} urlOrName The URL or name to test for authentication requirements.
 * @return {?AuthEntry}
 */
export const getAuth = (urlOrName) => {
  let authEntry = null;

  for (const key in registry) {
    const entry = registry[key];

    if (entry && entry.pattern.test(urlOrName)) {
      authEntry = entry;
    }
  }

  return authEntry;
};

/**
 * Fires an alert message indicating that the user needs to authenticate with a given service..
 * @param {?string} urlOrName The URL or name to test for authentication requirements.
 */
export const alertAuth = (urlOrName) => {
  const auth = getAuth(urlOrName);

  if (auth && !alerts[auth.title]) {
    let message = auth.message;
    if (auth.link) {
      // if a link is available, add a link to open the auth page
      message += `<br><br><a href="${auth.link}" target="_blank">Click here to go to the login page</a>`;
    }

    AlertManager.getInstance().sendAlert(message, AlertEventSeverity.INFO);
    alerts[auth.title] = true;
  }
};
