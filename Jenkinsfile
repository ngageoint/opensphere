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
      stage('scm')

      try {
        beforeCheckout()
      } catch (NoSuchMethodError e) {
      }

      checkout scm

      try {
        afterCheckout()
      } catch (NoSuchMethodError e) {
      }

      stage('npm')
      npmInstall()

      stage('build')
      sh 'npm run build'

      stage('test')
      try {
        test()
      } catch (NoSuchMethodError e) {
      }

      /* stage('docs')
      sh 'npm run compile:dossier'

      stage('deploy-docs')
      try {
        deployDocs()
      } catch (NoSuchMethodError e) {
      } */

      stage('package')
      dir('dist') {
        sh "zip -q -r opensphere-${env.BRANCH_NAME}-${env.BUILD_NUMBER}.zip opensphere"
      }

      try {
        // newer
        archiveArtifacts 'dist/*.zip'
      } catch (NoSuchMethodError e) {
        // older
        archive 'dist/*.zip'
      }

      stage('deploy')
      try {
        deploy('opensphere')
      } catch (NoSuchMethodError e) {
        error 'Please define "deploy" through a shared pipeline library for this network'
      }

      stage('publish')
      if (env.BRANCH_NAME == 'master') {
        try {
          npmPublish()
        } catch (NoSuchMethodError e) {
          error 'Please define "npmPublish" through a shared pipeline library for this network'
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
