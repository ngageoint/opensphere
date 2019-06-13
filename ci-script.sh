#!/usr/bin/env bash

set -e
yarn run build
yarn run test
./cypress/support/execute-tests.sh ci cli all

#
# js-dossier does not currently work with OpenSphere's version of the Closure Library, and will need a compiler
# upgrade to resolve this problem.
#
# See: https://github.com/jleyba/js-dossier/issues/111
#

# yarn run apidoc
