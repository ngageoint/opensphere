#!/usr/bin/env bash

set -e

yarn run build
yarn run test
#
# Cypress tests are not currently running with enough consistency to be part of the CI Build.
# When the consistency is improved, they will be enabled again.
#
# ./cypress/support/execute-tests.sh ci cli all

#
# js-dossier does not properly support goog.module and ES6 modules. This has
# been disabled until a functional documentation framework is ready.
#
# yarn run apidoc
