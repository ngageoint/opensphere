/// <reference types="Cypress" />
var opensphere = require('../../support/selectors/opensphere.js');

describe('Toolbar center', function() {
  before('Login', function() {
    cy.login();
  });

  it('Previous day', function() {
    // Setup
    // none

    // Test
    cy.get(opensphere.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(opensphere.Toolbar.PREVIOUS_DAY_BUTTON).click();
    cy.get(opensphere.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().subtract(1, 'days').format('YYYY[-]MM[-]DD'));

    // Clean up
    cy.wait(500); // Wait to avoid rapidly changing dates
    cy.get(opensphere.Toolbar.NEXT_DAY_BUTTON).click();
    cy.get(opensphere.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
  });

  it('Date', function() {
    // Setup
    cy.get(opensphere.Toolbar.Date.Calendar.PANEL).should('not.be.visible');

    // Test
    cy.get(opensphere.Toolbar.Date.INPUT).click();
    cy.get(opensphere.Toolbar.Date.Calendar.PANEL).should('be.visible');
    cy.get(opensphere.Toolbar.Date.Calendar.MONTH_DROPDOWN).should('contain', Cypress.moment().format('MMM'));
    cy.get(opensphere.Toolbar.Date.Calendar.YEAR_DROPDOWN).should('contain', Cypress.moment().format('YYYY'));
    cy.get(opensphere.Toolbar.Date.Calendar.CURRENT_DAY).should('contain', Cypress.moment().format('D'));

    // Clean up
    cy.wait(500);
    cy.get(opensphere.Toolbar.Date.Calendar.CLOSE_BUTTON).click();
    cy.get(opensphere.Toolbar.Date.Calendar.PANEL).should('not.be.visible');
  });

  it('Next day', function() {
    // Setup
    // none

    // Test
    cy.get(opensphere.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(opensphere.Toolbar.NEXT_DAY_BUTTON).click();
    cy.get(opensphere.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().add(1, 'days').format('YYYY[-]MM[-]DD'));

    // Clean up
    cy.wait(500); // Wait to avoid rapidly changing dates
    cy.get(opensphere.Toolbar.PREVIOUS_DAY_BUTTON).click();
    cy.get(opensphere.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
  });

  it('Duration', function() {
    // Setup
    // none

    // Test
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).should('have.value', 'day');
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).should('contain', 'day');
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).should('contain', 'week');
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).should('contain', 'month');
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).should('contain', 'custom');
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).select('month');
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).should('have.value', 'month');

    // Clean up
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).select('day');
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).should('have.value', 'day');
  });

  it('Time filter', function() {
    // Setup
    cy.get(opensphere.Toolbar.timeFilter.BUTTON)
        .should('not.have.class', opensphere.Toolbar.timeFilter.BUTTON_IS_ACTIVE_CLASS);
    cy.get(opensphere.Toolbar.timeFilter.PANEL).should('not.be.visible');

    // Test
    cy.get(opensphere.Toolbar.timeFilter.BUTTON).click({force: true}); // TODO: Remove force: true workaround after #732 fixed
    cy.get(opensphere.Toolbar.timeFilter.BUTTON)
        .should('have.class', opensphere.Toolbar.timeFilter.BUTTON_IS_ACTIVE_CLASS);
    cy.get(opensphere.Toolbar.timeFilter.PANEL).should('be.visible');
    cy.get(opensphere.Toolbar.timeFilter.START_HOUR_INPUT).should('be.visible');
    cy.get(opensphere.Toolbar.timeFilter.END_HOUR_INPUT).should('be.visible');
    cy.get(opensphere.Toolbar.timeFilter.APPLY_BUTTON).should('be.visible');

    // Clean up
    cy.get(opensphere.Toolbar.timeFilter.BUTTON).click({force: true}); // TODO: Remove force: true workaround after #732 fixed
    cy.get(opensphere.Toolbar.timeFilter.BUTTON)
        .should('not.have.class', opensphere.Toolbar.timeFilter.BUTTON_IS_ACTIVE_CLASS);
    cy.get(opensphere.Toolbar.timeFilter.PANEL).should('not.be.visible');
  });

  it('Timeline', function() {
    // Setup
    cy.get(opensphere.Timeline.PANEL).should('not.exist');

    // Test
    cy.get(opensphere.Toolbar.TIMELINE_TOGGLE_BUTTON).click({force: true}); // TODO: Remove force: true workaround after #732 fixed
    cy.get(opensphere.Timeline.PANEL).should('be.visible');
    cy.get(opensphere.Timeline.START_DATE_TIME_TEXT).should('be.visible');
    cy.get(opensphere.Timeline.PLAY_BUTTON).should('be.visible');
    cy.get(opensphere.Timeline.RECORD_BUTTON).should('be.visible');
    cy.get(opensphere.Timeline.END_DATE_TIME_TEXT).should('be.visible');

    // Clean up
    cy.get(opensphere.Toolbar.TIMELINE_TOGGLE_BUTTON).click({force: true}); // TODO: Remove force: true workaround after #732 fixed
    cy.get(opensphere.Timeline.PANEL).should('not.exist');
  });
});
