#!/usr/bin/env bash
set -e

echo "This script will run a release build of OpenSphere via Travis"
echo "Prereqs:"
echo "  * install the travis cli utility (https://github.com/travis-ci/travis.rb#installation)"
echo "  * login via: travis login --org"

token=$(travis token --org | awk '{print $NF}')

body='{
  "request": {
    "branch": "master",
    "config": {
      "merge_mode": "deep_merge",
      "env": {
        "global": {
          "RELEASE": true
        }
      }
    }
  }
}'

echo ""
echo "API Response:"

curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Travis-API-Version: 3' \
  -H "Authorization: token $token" \
  -d "$body" \
  https://api.travis-ci.org/repo/ngageoint%2Fopensphere/requests

echo ""
