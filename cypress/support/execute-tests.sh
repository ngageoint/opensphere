#!/usr/bin/env bash

function main() {
  echo 'INFO: test execution script starting...'
  trap ctrl_c INT

  setVariables
  checkArguments
  checkEnvironment
  configureSound
  overrideSettings
  startWebServer
  runTests
  stopWebServer
  restoreSettings

  echo "INFO: test execution script completed; code $TEST_RESULT"
  exit $TEST_RESULT
}

function ctrl_c() {
  echo ''
  echo 'WARNING: user terminated tests, performing cleanup...'
  stopWebServer
  restoreSettings
  echo 'INFO: cleanup complete, test execution script terminated early'
  echo 'INFO: press CTRL+C again to fully exit and return to the terminal'
  exit 1
}

function setVariables() {
  export PLUGIN=../opensphere-plugin*
  export OPENSPHERE_CONFIG_TESTER_FOLDER=../opensphere-config-tester
  export OPENSPHERE_NO_MERGE_CONFIG_TESTER_FOLDER=../opensphere-no-merge-config-tester
  export OPENSPHERE_CONFIG_TESTER_FOLDER_SOURCE
  export OPENSPHERE_CONFIG_TESTER_EXISTS

  export SERVER_STARTED=false
  export SETTINGS_BACKUP=false
  export SETTINGS_OVERRIDE=false

  export MAP_CONFIG=map.config

  export SOUND_CONFIGURATION_SOURCE=cypress/support/asound.conf
  export SOUND_CONFIGURATION_TARGET=/etc/asound.conf

  export SETTINGS_ORIGINAL=dist/opensphere/config/settings.json
  export SETTINGS_MOVED=dist/opensphere/config/original-settings.json
   
  export SETTINGS_SOURCE=cypress/support/settings/.
  export SETTINGS_TARGET=dist/opensphere/config/

  export SETTINGS_OVERWRITE_WITHOUT=dist/opensphere/config/settings-without-config-tester.json
  export SETTINGS_OVERWRITE_WITH=dist/opensphere/config/settings-with-config-tester.json

  export OPENSPHERE_CONFIG_TESTER_SOURCE=/settings.json
  export OPENSPHERE_CONFIG_TESTER_TARGET=dist/opensphere/config/opensphere-config-tester.json
  
  export RUNTIME_SETTINGS=dist/opensphere/config/runtime-settings.json
  export RUNTIME_SETTINGS_WITH_PROJECTION=dist/opensphere/config/runtime-settings-with-projection.json
  export RUNTIME_SETTINGS_WITHOUT_PROJECTION=dist/opensphere/config/runtime-settings-without-projection.json

  export STREET_MAP_URL
  export WORLD_IMAGERY_URL

  export ALL_TESTS=**
  export SMOKE_TESTS=smoke-tests/**
  export TEST_PATH=cypress/integration/
  
  export TEST_RESULT

  export CYPRESS_PROJECTION
}

function checkArguments() {
  echo 'INFO: checking script arguments'

  if ! [[ "$ENVIRONMENT" =~ ^(dev|ci)$ ]]; then
    echo "ERROR: only dev and ci accepted as a valid environment argument; '$ENVIRONMENT' is not valid"
    exit 1
  fi

  if ! [[ "$MODE" =~ ^(cli|gui)$ ]]; then
    echo "ERROR: only cli and gui accepted as a valid mode argument; '$MODE' is not valid"
    exit 1
  fi

  case "$TESTS" in
	"user")
		;;
	"all")
    TEST_SPECS=$TEST_PATH$ALL_TESTS
		;;
	"smoke")
    TEST_SPECS=$TEST_PATH$SMOKE_TESTS
		;;
  "spec")
    TEST_SPECS=$TEST_PATH$SPEC
		;;
  "loop")
    TEST_SPECS=$TEST_PATH$SPEC
    ;;
	*)
    echo "ERROR: only user, all, smoke, spec, or loop accepted as a valid tests argument; '$TESTS' is not valid"
    exit 1
 		;;
  esac

  if ! [ "$SPEC" ]; then
    echo 'ERROR: spec pattern not passed!'
    exit 1
  fi

  if ! [ "$PROJECTION" ]; then
    echo 'INFO: projection not passed; using default'
    PROJECTION=default
  elif [[ "$PROJECTION" =~ ^(3857|4326)$ ]]; then
    PROJECTION="EPSG:$PROJECTION"
    echo "INFO: projection override; using $PROJECTION"
  else
    echo "ERROR: only 3857 and 4326 accepted as a valid projections; '$PROJECTION' is not valid"
    exit 1
  fi

  echo 'INFO: script argument check complete'
}

function checkEnvironment() {
  echo 'INFO: checking environment'

  if ls $PLUGIN 1> /dev/null 2>&1; then
    echo 'WARNING: a plugin exists that may affect the test results!'
    if ! [ "$ENVIRONMENT" == "ci" ]; then
      read -t 30 -p "Press CTRL+C to Cancel, ENTER to Continue or wait 30 seconds"
      echo ''
    fi
  else
    echo 'INFO: plugin check complete; environment ready'
  fi

  if [ -d $OPENSPHERE_CONFIG_TESTER_FOLDER ]; then
    OPENSPHERE_CONFIG_TESTER_FOLDER_SOURCE=$OPENSPHERE_CONFIG_TESTER_FOLDER
    OPENSPHERE_CONFIG_TESTER_EXISTS=true
    echo 'INFO: opensphere-config-tester check complete; found tester machine'
  elif [ -d $OPENSPHERE_NO_MERGE_CONFIG_TESTER_FOLDER ]; then
    OPENSPHERE_CONFIG_TESTER_FOLDER_SOURCE=$OPENSPHERE_NO_MERGE_CONFIG_TESTER_FOLDER
    OPENSPHERE_CONFIG_TESTER_EXISTS=true
    echo 'INFO: opensphere-config-tester check complete; found developer machine'
  else
    echo 'INFO: opensphere-config-tester not present, continuing without it'
    OPENSPHERE_CONFIG_TESTER_EXISTS=false
  fi

  if $OPENSPHERE_CONFIG_TESTER_EXISTS; then
    echo 'INFO: loading variables from configuration files'
    . $OPENSPHERE_CONFIG_TESTER_FOLDER_SOURCE/$MAP_CONFIG
    STREET_MAP_URL=$STREET_MAP_URL_3857
    WORLD_IMAGERY_URL=$WORLD_IMAGERY_URL_3857

    if grep -E '"baseProjection":\s*"EPSG:4326"' $OPENSPHERE_CONFIG_TESTER_FOLDER_SOURCE$OPENSPHERE_CONFIG_TESTER_SOURCE 1> /dev/null 2>&1; then
        CYPRESS_PROJECTION=4326
      elif grep -E '"baseProjection":\s*"EPSG:3857"' $OPENSPHERE_CONFIG_TESTER_FOLDER_SOURCE$OPENSPHERE_CONFIG_TESTER_SOURCE 1> /dev/null 2>&1; then
        CYPRESS_PROJECTION=3857
      fi
  else
    echo 'INFO: no configuration files present, using default configuration'
    STREET_MAP_URL=//services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}
    WORLD_IMAGERY_URL=//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
    CYPRESS_PROJECTION=3857
  fi

  echo "INFO: using a projection of EPSG:$CYPRESS_PROJECTION"
  echo 'INFO: environment check complete'
}

function configureSound() {
  if [ "$ENVIRONMENT" == "ci" ]; then
    echo 'INFO: configuring sound ouput (fixes ALSA errors)'
    sudo cp $SOUND_CONFIGURATION_SOURCE $SOUND_CONFIGURATION_TARGET
  fi
}

function overrideSettings() {
  echo 'INFO: temporarily adjusting settings to prepare for running the tests'
  if [ -f $SETTINGS_ORIGINAL ]; then
    echo 'INFO: backing up original settings file'
    SETTINGS_BACKUP=true
    mv $SETTINGS_ORIGINAL $SETTINGS_MOVED
  else
    echo 'WARNING: settings file does not exist!'
  fi

  echo 'INFO: copying settings files for use during testing'
  SETTINGS_OVERRIDE=true
  cp -r $SETTINGS_SOURCE $SETTINGS_TARGET

  if $OPENSPHERE_CONFIG_TESTER_EXISTS; then
    echo 'INFO: copying settings files from tester repo'
    cp $OPENSPHERE_CONFIG_TESTER_FOLDER_SOURCE$OPENSPHERE_CONFIG_TESTER_SOURCE $OPENSPHERE_CONFIG_TESTER_TARGET
    rm $SETTINGS_OVERWRITE_WITHOUT
    mv $SETTINGS_OVERWRITE_WITH $SETTINGS_ORIGINAL
  else
    echo 'INFO: no settings files to copy from tester repo (it is not present)'
    rm $SETTINGS_OVERWRITE_WITH
    mv $SETTINGS_OVERWRITE_WITHOUT $SETTINGS_ORIGINAL
  fi

  if [ "$PROJECTION" == "default" ]; then
    echo 'INFO: using default projection'
    rm $RUNTIME_SETTINGS_WITH_PROJECTION
    mv $RUNTIME_SETTINGS_WITHOUT_PROJECTION $RUNTIME_SETTINGS
  else
    echo 'INFO: writing projection to settings file'
    rm $RUNTIME_SETTINGS_WITHOUT_PROJECTION
    mv $RUNTIME_SETTINGS_WITH_PROJECTION $RUNTIME_SETTINGS
    sed -i.bak 's@BASE_PROJECTION_OVERRIDE@'$PROJECTION'@g' $RUNTIME_SETTINGS && rm $RUNTIME_SETTINGS.bak
  fi

  echo 'INFO: writing map urls to settings file'
  sed -i.bak 's@STREET_MAP_URL@'$STREET_MAP_URL'@g' $RUNTIME_SETTINGS && rm $RUNTIME_SETTINGS.bak
  sed -i.bak 's@WORLD_IMAGERY_URL@'$WORLD_IMAGERY_URL'@g' $RUNTIME_SETTINGS && rm $RUNTIME_SETTINGS.bak

  echo 'INFO: all settings adjustments finished'
}

function startWebServer() {
  if [ "$OSTYPE" == "msys" ]; then
    webServerProcess="$(netstat -ano | findstr 0.0.0.0:8282 | awk '{print $5}')" # TODO: Use a process name instead after this is fixed: https://github.com/http-party/http-server/issues/333
  else
    webServerProcess="$(ps -ef | grep http-server | grep -v grep)"
  fi

  if [ -z "$webServerProcess" ]; then
    SERVER_STARTED=true
    if [ "$ENVIRONMENT" == "ci" ]; then
      echo 'INFO: starting web server in continuous integration environment'
      $(npm bin)/http-server -p 8282 -c-1 -s &
    else
      echo 'INFO: starting web server in local development environment'
      $(npm bin)/http-server ../../ -p 8282 -c-1 -s &
    fi
  else
    echo 'INFO: web server already running'
  fi
}

function runTests() {
  if [ "$MODE" == "cli" ]; then
    if [ "$ENVIRONMENT" == "ci" ]; then
      echo 'INFO: starting Cypress in continuous integration environment'
      $(npm bin)/cypress run --config baseUrl=http://localhost:8282/dist/opensphere --spec "$TEST_SPECS"
      TEST_RESULT=$?
    else
      echo 'INFO: starting Cypress in local development environment via the command line'
      if [ "$TESTS" == "loop" ]; then
        result_counter=0
        echo 'INFO: starting test loop to check for flaky tests'
        for i in 1 2 3 4 5
        do
          echo "INFO: test run $i/5 starting..."
          $(npm bin)/cypress run --spec "$TEST_SPECS"
          last_result=$?
          echo "INFO: test run $i/5 finished with code: $last_result"
          result_counter=$(($result_counter + $last_result))
        done
        TEST_RESULT=$result_counter
        if (( $TEST_RESULT > 0)); then
          if (( $TEST_RESULT == 5)); then
            echo 'WARNING: each test loop finished with code: 1. Tests appear to consisently FAIL.'
          else
            echo 'WARNING: *******************'
            echo "WARNING: FLAKY TESTS!! There were $TEST_RESULT failed loops out of 5 loops completed."
            echo 'WARNING: *******************'
          fi
        else
          echo 'INFO: test loop finished, all loops passed'
        fi
      else
        $(npm bin)/cypress run --spec "$TEST_SPECS"
        TEST_RESULT=$?
        echo "INFO: cypress tests finished with code: $TEST_RESULT"
      fi
    fi
  else
    echo 'INFO: starting Cypress in local development environment via interactive mode'
    $(npm bin)/cypress open
    TEST_RESULT=0
    echo 'INFO: user has closed Cypress interactive mode'
  fi
}

function stopWebServer() {
  if $SERVER_STARTED; then
    echo 'INFO: terminating web server'
    npm run stop-server
  else
    echo 'INFO: server was not started by this script, leaving it as is'
  fi
}

function restoreSettings() {
  if $SETTINGS_OVERRIDE || $SETTINGS_BACKUP; then
    echo 'INFO: restoring settings to their original state before tests were started'
    
    if $SETTINGS_OVERRIDE; then
      echo 'INFO: removing temporary settings files'
      
      if $OPENSPHERE_CONFIG_TESTER_EXISTS; then
        rm $OPENSPHERE_CONFIG_TESTER_TARGET
      fi
      
      rm $RUNTIME_SETTINGS
      rm $SETTINGS_ORIGINAL
    fi

    if $SETTINGS_BACKUP; then
      echo 'INFO: restoring settings backup'
      mv $SETTINGS_MOVED $SETTINGS_ORIGINAL
    else
      echo 'INFO: settings were never backed up, nothing to do'
    fi
    echo 'INFO: settings have been restored to their original state'
  else
    echo 'INFO: settings were never modified, nothing to do'
  fi
}

#dev or ci (required)
ENVIRONMENT=$1

#cli or gui (required)
MODE=$2

#user, all, smoke, spec, loop (required)
TESTS=$3

#smoke-tests/smoke-test.spec.sh or na (required)
SPEC=$4

#3857 or 4326 (optional)
PROJECTION=$5

main