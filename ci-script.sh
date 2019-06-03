#!/usr/bin/env bash

set -e
yarn run build
yarn run test
./cypress/support/execute-tests.sh ci cli all
yarn run apidoc
