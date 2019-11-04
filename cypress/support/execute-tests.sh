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

  echo 'INFO: test execution script completed!'
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
  
  export SERVER_STARTED=false
  export SETTINGS_BACKUP=false
  export SETTINGS_OVERRIDE=false

  export SOUND_CONFIGURATION_SOURCE=cypress/support/asound.conf
  export SOUND_CONFIGURATION_TARGET=/etc/asound.conf

  export SETTINGS_ORIGINAL=dist/opensphere/config/settings.json
  export SETTINGS_MOVED=dist/opensphere/config/original-settings.json
   
  export SETTINGS_SOURCE=cypress/support/settings/.
  export SETTINGS_TARGET=dist/opensphere/config/

  export OPENSPHERE_CONFIG_TESTER=dist/opensphere/config/opensphere-config-tester.json
  export RUNTIME_SETTINGS=dist/opensphere/config/runtime-settings.json

  export ALL_TESTS=**
  export SMOKE_TESTS=smoke-tests/**
  export TEST_PATH=cypress/integration/
  
  export TEST_RESULT
}

function checkArguments() {
  if ! [[ "$ENVIRONMENT" =~ ^(dev|ci)$ ]]; then
    echo "ERROR: only dev and ci accepted as a valid environment argument; '$ENVIRONMENT' is not valid"
    exit 1
  fi

  if ! [[ "$MODE" =~ ^(cli|gui)$ ]]; then
    echo "ERROR: only cli and gui accepted as a valid mode argument; '$MODE' is not valid"
    exit 1
  fi

  case "$TESTS" in
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
    if [ -z "$SPEC" ]; then
      echo 'WARNING: spec pattern not passed, selecting ALL tests'
      TEST_SPECS=$TEST_PATH$ALL_TESTS
    else
      TEST_SPECS=$TEST_PATH$SPEC
    fi
    ;;
	*)
		if [ -z "$TESTS" ]; then
      if ! [ "$MODE" == "gui" ]; then
        echo 'ERROR: tests argument must be supplied unless mode is gui'
        exit 1
      fi
    else
      echo "ERROR: only all, smoke, spec, or loop accepted as a valid tests argument; '$TESTS' is not valid"
      exit 1
    fi
		;;
  esac

  if [ "$CYPRESS_PROJECTION" ]; then
    if [ "$CYPRESS_PROJECTION" != 3857 ] && [ "$CYPRESS_PROJECTION" != 4326 ]; then
      echo "ERROR: CYPRESS_PROJECTION environment variable set to unexpected value: $CYPRESS_PROJECTION. Expected 3857 or 4326!"
      exit 1
    else
      echo "INFO: cypress will run tests with projection $CYPRESS_PROJECTION"
    fi
  else
    echo 'INFO: CYPRESS_PROJECTION environment variable not set, using default of 3857'
    export CYPRESS_PROJECTION=3857
  fi

  if [ -z "$STREET_MAP_URL" ]; then
    echo "INFO: STREET_MAP_URL environment variable not set, using default for $CYPRESS_PROJECTION"
    if [ "$CYPRESS_PROJECTION" = 3857 ]; then
      export STREET_MAP_URL="http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
    else
      export STREET_MAP_URL="http://services.arcgisonline.com/ArcGIS/rest/services/ESRI_StreetMap_World_2D/MapServer/tile/{z}/{y}/{x}"
    fi
  fi

  if [ -z "$WORLD_IMAGERY_URL" ]; then
    echo "INFO: WORLD_IMAGERY_URL environment variable not set, using default for $CYPRESS_PROJECTION"
    if [ "$CYPRESS_PROJECTION" = 3857 ]; then
      export WORLD_IMAGERY_URL="http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    else
      export WORLD_IMAGERY_URL="https://wi.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    fi
  fi
}

function checkEnvironment() {
  if ls $PLUGIN 1> /dev/null 2>&1; then
    echo 'WARNING: a plugin exists that may affect the test results!'
    if ! [ "$ENVIRONMENT" == "ci" ]; then
      read -t 30 -p "Press CTRL+C to Cancel, ENTER to Continue or wait 30 seconds"
      echo ''
    fi
  else
    echo 'INFO: plugin check complete; environment ready'
  fi
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

  echo 'INFO: writing projection to settings file'
  sed -i.bak 's@CYPRESS_PROJECTION@'$CYPRESS_PROJECTION'@g' $OPENSPHERE_CONFIG_TESTER && rm $OPENSPHERE_CONFIG_TESTER.bak

  echo 'INFO: writing map urls to settings file'
  sed -i.bak 's@STREET_MAP_URL@'$STREET_MAP_URL'@g' $OPENSPHERE_CONFIG_TESTER && rm $OPENSPHERE_CONFIG_TESTER.bak
  sed -i.bak 's@WORLD_IMAGERY_URL@'$WORLD_IMAGERY_URL'@g' $OPENSPHERE_CONFIG_TESTER && rm $OPENSPHERE_CONFIG_TESTER.bak

  echo 'INFO: zoom offset to settings file'
  if [ "$CYPRESS_PROJECTION" = 3857 ]; then
    sed -i.bak 's@"ZOOM_OFFSET"@'0'@g' $OPENSPHERE_CONFIG_TESTER && rm $OPENSPHERE_CONFIG_TESTER.bak
  else
    sed -i.bak 's@"ZOOM_OFFSET"@'-1'@g' $OPENSPHERE_CONFIG_TESTER && rm $OPENSPHERE_CONFIG_TESTER.bak
  fi

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
      rm $OPENSPHERE_CONFIG_TESTER
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

#dev or ci
ENVIRONMENT=$1

#cli or gui
MODE=$2

#all, smoke, spec, loop
TESTS=$3

#spec
SPEC=$4

main