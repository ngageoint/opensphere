:orphan:

Cypress Artifacts
#################
On Cypress test failure, test artifacts like screenshots, image comparisons, and videos are automatically generated. These artifacts are easily accessible from the local file system for test runs via the GUI and CLI.  To obtain artifacts from test runs under CI, custom solutions may be required as the build artifacts are often destroyed after a build is completed.  Instructions for Travis CI is below; other CI environments can use a similar implementation.

Travis CI
*********
Artifacts from Cypress test failures are uploaded to an Amazon S3 bucket via a custom script ``s3-artifact-upload.sh``.  The script is only executed on failures; the script will not be executed on a successful build per the settings in `.travis.yml`.  Artifacts are also only uploaded for non-PR builds.  The environment variables containing keys for the S3 bucket are not available to PR builds under Travis for security reasons.

S3 Bucket
=========
- Create an S3 bucket using a personal Amazon account
- Setup a bucket policy with Allow on ``s3:GetObject`` and ``s3:ListBucket``
- (Recommend) Set the retention policy to one day, entire bucket, expire objects

Example Bucket Policy:

.. code-block:: none

  {
      "Version": "2012-10-17",
      "Id": "Policy12345678”,
      "Statement": [
          {
              "Sid": "Stmt12345678”,
              "Effect": "Allow",
              "Principal": "*",
              "Action": "s3:GetObject",
              "Resource": "arn:aws:s3:::your-bucket-name/*”
          },
          {
              "Sid": "Stmt12345678”,
              "Effect": "Allow",
              "Principal": "*",
              "Action": "s3:ListBucket",
              "Resource": "arn:aws:s3:::your-bucket-name”
          }
      ]
  }

Travis Repository
=================
To obtain artifacts from builds created under Travis CI, the builds must be created under a personal Travis account. Under the Travis repository for your OpenSphere fork, enter ``S3BUCKET``, ``S3KEY`` and ``S3SECRET`` as environment variables using the ``NAME``, ``KEY`` and ``SECRET`` from the S3 bucket.  Add a fourth variable ``SKIP_DEPLOY`` with value of ``true`` to skip execution of ``deploy.sh``.