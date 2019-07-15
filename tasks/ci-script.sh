#!/usr/bin/env bash

set -e

# temp debug so that release dry-runs do not takae so long
if $RELEASE; then
  exit 0
fi

yarn run build
yarn run test
#
# Cypress tests are not currently running with enough consistency to be part of the CI Build.
# When the consistency is improved, they will be enabled again.
#
# ./cypress/support/execute-tests.sh ci cli all

#
# js-dossier does not currently work with OpenSphere's version of the Closure Library, and will need a compiler
# upgrade to resolve this problem.
#
# See: https://github.com/jleyba/js-dossier/issues/111
#

# yarn run apidoc
