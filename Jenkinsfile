#!groovy

def err = null
class Global {
    static def branchName = null
    static def userName = null
    static def projName = null
}
node(getLabel()) {
  timestamps {
    try {
      initScmEnv()

      stage('scm') {
        try {
          beforeCheckout()
        } catch (NoSuchMethodError e) {
        }
      
        installPlugins('master', env.YARN_WORKSPACE_REPO)

        dir('workspace') {
          dir('opensphere') {
            checkout scm

            try {
              afterCheckout()
            } catch (NoSuchMethodError e) {
            }
            
            try {
              this_version = sh(script: 'git describe --exact-match HEAD', returnStdout: true).trim()
            } catch (e) {
              this_version = sh(script: "echo '${env.BRANCH_NAME}-${env.BUILD_NUMBER}'", returnStdout: true).trim()
            }
            echo "${this_version}"
          }
        }
      }

      stage('yarn') {
        yarnInstall()
      }

      dir('workspace/opensphere') {
        
        stage('build') {
          sh 'yarn run build'
        }

        stage('test') {        
          try {
            test()
          } catch (NoSuchMethodError e) {
          }
        }

      /* stage('docs')
      sh 'npm run compile:dossier'

      stage('deploy-docs')
      try {
        deployDocs()
      } catch (NoSuchMethodError e) {
      } */
        
        stage('package') {
          dir('dist') {
            sh "zip -q -r opensphere-${env.BRANCH_NAME}-${env.BUILD_NUMBER}.zip opensphere"

            try {
              // newer
              archiveArtifacts '*.zip'
            } catch (NoSuchMethodError e) {
              // older
              archive '*.zip'
            }
          }
        }

        stage('deploy') {
          try {
            deploy('opensphere')
          } catch (NoSuchMethodError e) {
            error 'Please define "deploy" through a shared pipeline library for this network'
          }
        }        
      }

      stage('publish') {
        if (env.BRANCH_NAME == 'master') {
          try {
            npmPublish()
          } catch (NoSuchMethodError e) {
            error 'Please define "npmPublish" through a shared pipeline library for this network'
          }
        }
      }

      try {
        onSuccess()
      } catch (NoSuchMethodError e) {
      }
    } catch (e) {
      currentBuild.result = 'FAILURE'
      err = e
    } finally {
      try {
        notifyBuild()
      } catch (NoSuchMethodError e) {
        error 'Please define "notifyBuild()" through a shared pipeline library for this network'
      }

      if (err) {
        throw err
      }
    }
  }
}