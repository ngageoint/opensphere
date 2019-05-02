#!/usr/bin/env bash

function main() {
  echo 'INFO: test execution script starting...'
  trap ctrl_c INT

  setVariables
  checkArguments
  configureSound
  overrideSettings
  startWebServer
  runTests
  stopWebServer
  restoreSettings

  echo 'INFO: test execution script completed!'
  exit 0
}

function ctrl_c() {
  echo "WARNING: user terminated tests, performing cleanup..."
  stopWebServer
  restoreSettings
  echo 'INFO: cleanup complete, test execution script terminated early'
  exit 1
}

function setVariables() {
  export SERVER_STARTED=false
  export SETTINGS_BACKED_UP=false

  export SOUND_CONFIGURATION_SOURCE=cypress/support/asound.conf
  export SOUND_CONFIGURATION_TARGET=/etc/asound.conf

  export SETTINGS_ORIGINAL=dist/opensphere/config/settings.json
  export SETTINGS_BACKUP=dist/opensphere/config/settings.bak
    
  export SETTINGS_OVERRIDE_SOURCE=cypress/support/settings-override.json
  export SETTINGS_OVERRIDE_TARGET=dist/opensphere/config/settings.json
  
  export SETTINGS_CYPRESS_SOURCE=cypress/support/settings_cypress.json
  export SETTINGS_CYPRESS_TARGET=dist/opensphere/config/settings_cypress.json
  
  export SETTINGS_OS_SOURCE=config/settings.json
  export SETTINGS_OS_TARGET=dist/opensphere/config/settings_os.json
  
  export ALL_TESTS=cypress/integration/**
  export SMOKE_TESTS=cypress/integration/smoke-tests/**

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

  if [ "$TESTS" == "all" ]; then
    TEST_SPEC=$ALL_TESTS
  elif [ "$TESTS" == "smoke" ]; then
    TEST_SPEC=$SMOKE_TESTS
  elif [ -z "$TESTS" ]; then
    if ! [ "$MODE" == "gui" ]; then
      echo 'ERROR: tests argument must be supplied unless mode is gui'
      exit 1
    fi
  else
    echo "ERROR: only all and smoke accepted as a valid tests argument; '$TESTS' is not valid"
    exit 1
  fi
}

function backupSettings(){
  if [ -f $SETTINGS_ORIGINAL ]; then
    echo 'INFO: build settings file exists and may need to be backed up'
    if ! diff -q $SETTINGS_OS_SOURCE $SETTINGS_ORIGINAL; then
      echo "WARNING: settings file differs from source, backing up as $SETTINGS_BACKUP"
      SETTINGS_BACKED_UP=true
      mv $SETTINGS_ORIGINAL $SETTINGS_BACKUP
    else
      echo 'INFO: settings file matches source and does not need to be backed up'
    fi
  else
    echo 'INFO: build settings file does not need to be backed up because it does not exist'
  fi
}

function configureSound() {
  if [ "$ENVIRONMENT" == "ci" ]; then
    echo "INFO: Configuring sound ouput (fixes ALSA errors)"
    sudo cp $SOUND_CONFIGURATION_SOURCE $SOUND_CONFIGURATION_TARGET
  fi
}

function overrideSettings() {
  backupSettings

  echo "INFO: creating a new settings override file: $SETTINGS_OVERRIDE_TARGET"
  cp $SETTINGS_OVERRIDE_SOURCE $SETTINGS_OVERRIDE_TARGET

  echo "INFO: creating Cypress settings file: $SETTINGS_CYPRESS_TARGET"
  cp $SETTINGS_CYPRESS_SOURCE $SETTINGS_CYPRESS_TARGET

  echo "INFO: creating OS settings file: $SETTINGS_OS_TARGET"
  cp $SETTINGS_OS_SOURCE $SETTINGS_OS_TARGET
}

function startWebServer() {
  webServerProcess=$(ps -ef | grep http-server | grep -v grep)
  
  if [ -z "$webServerProcess" ]; then
    SERVER_STARTED=true
    if [ "$ENVIRONMENT" == "ci" ]; then
      echo 'INFO: starting web server in continuous integration environment'
      $(npm bin)/http-server -p 8282 -c-1 -o -U -s &
    else
      echo 'INFO: starting web server in local developement environment'
      $(npm bin)/http-server ../../ -p 8282 -c-1 -o -U -s &
    fi
  else
    echo 'INFO: web server already running'
  fi
}

function runTests() {
  if [ "$MODE" == "cli" ]; then
    if [ "$ENVIRONMENT" == "ci" ]; then
        echo 'INFO: starting Cypress in continuous integration environment'
        $(npm bin)/cypress run --config baseUrl=http://localhost:8282/dist/opensphere --spec "$TEST_SPEC"
    else
      echo 'INFO: starting Cypress in local development environment via the command line'
      $(npm bin)/cypress run --spec "$TEST_SPEC"
    fi
    TEST_RESULT=$?
    echo "INFO: Cypress tests finished with code: $TEST_RESULT"
  else
    echo 'INFO: starting Cypress in local development environment via interactive mode'
    $(npm bin)/cypress open
    echo 'INFO: user has closed Cypress interactive mode'
  fi
}

function stopWebServer() {
  if pgrep "node" > /dev/null; then
    if $SERVER_STARTED; then
      echo 'INFO: terminating web server'
      npm run stop-server
    else
      echo 'INFO: server was running before tests started, leaving it running'
    fi
  else
    echo 'INFO: web server is not running, nothing to terminate'
  fi
}

function restoreSettings() {
  echo "WARNING: removing OS settings file: $SETTINGS_OS_TARGET"
  rm $SETTINGS_OS_TARGET

  echo "WARNING: removing Cypress settings file: $SETTINGS_CYPRESS_TARGET"
  rm $SETTINGS_CYPRESS_TARGET

  echo "WARNING: removing settings override file: $SETTINGS_OVERRIDE_TARGET"
  rm $SETTINGS_OVERRIDE_TARGET

  restoreBackup
}

function restoreBackup() {
  if $SETTINGS_BACKED_UP; then
    echo "WARNING: restoring $SETTINGS_BACKUP as $SETTINGS_ORIGINAL"
    mv $SETTINGS_BACKUP $SETTINGS_ORIGINAL
  else
    echo "INFO: settings file backup does not exist, creating standard OS settings file: $SETTINGS_OS_TARGET"
    cp $SETTINGS_OS_SOURCE $SETTINGS_OS_TARGET
  fi
}

#dev or ci
ENVIRONMENT=$1

#cli or gui
MODE=$2

#all or smoke
TESTS=$3
main