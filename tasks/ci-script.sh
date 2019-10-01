#!/usr/bin/env bash

set -e

yarn run build
yarn run test
#
# Cypress tests are not currently running with enough consistency to be part of the CI Build.
# When the consistency is improved, they will be enabled again.
#
# ./cypress/support/execute-tests.sh ci cli all

yarn run apidoc
