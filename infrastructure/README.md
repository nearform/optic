# Infrastructure

It is possible to deploy the Optic application to the Google Cloud Platform (GCP) and automate its releases.

The [Terraform](https://www.terraform.io/) scripts into the `infrastructure/` folder let you to create
the infrastructure needed.

It creates the following resources:

- a Cloud Run application.
- one Service Account to be used by the Cloud Run application to serve the Optic application.
- one Service Account to be used by GitHub to automate the deployment.

## Prerequisites

Before proceeding with the installation, you need to have the following requirements:

1. Create a Firebase project as [described here](../README.md#prerequisites).
1. Create a Service Account:
   - From the [GCP console](https://console.cloud.google.com/iam-admin/serviceaccounts) select the Firebase project created previously.
   - Add a new Service Account as `Project Owner` role.
   - Generate a JSON key file from the `KEYS` menu and save it as `infrastructure/service-account-credentials.json`.
1. Enable the GCP APIs for the project to be able to use the infrastructure provisioning:
   - Turn on the [`Cloud Run API`](https://console.cloud.google.com/apis/library/run.googleapis.com) to create the Cloud Run application.
   - Turn on the [`Cloud Resource Manager API`](https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com) to update and deploy the application.
   - Turn on the [`Cloud Build API`](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com) to update and deploy the application.
   - Turn on the [`Identity and Access Management (IAM) API`](https://console.cloud.google.com/apis/library/iam.googleapis.com) to create additional Service Accounts.
   - Turn on the [`Artifact Registry API`](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com) to store the application build.
1. Update the `config.auto.tfvars` within your project id.

## Installation

To create the application infrastructure, run the following command:

```sh
cd infrastructure/
# download the terraform modules
terraform init

# verify the terraform execution plan
terraform plan

# execute the changes on your GCP project
terraform apply

# get the secrets to set on the GitHub repository's secrets
terraform output -json > ../github-secrets.json

# decode the GCP_SA_KEY argument before coping it as GitHub secret
jq -r '.GCP_SA_KEY.value' github-secrets.json | base64 --decode > GCP_SA_KEY.json
```

At this stage, the application infrastructure is created and ready.
You may check it navigating to the `APPLICATION_URL` shown in the terraform output.

## Deploying the application

To automate the deploy of your Optic application, it is necessary to setup your GitHub repository first.

1. Add to the GitHub repository's secrets all the `.env` variables you should have configured locally.
1. Add to the GitHub repository's secrets all the key-value pairs from the generated `github-secrets.json`:
   - `APPLICATION_URL`
   - `GCP_CLOUDRUN_SERVICE_NAME`
   - `GCP_CLOUDRUN_SERVICE_REGION`
   - `GCP_PROJECT_ID`
   - `GCP_SA_EMAIL`
   - `GCP_SA_KEY` _reminder: you need to run the base64 decode on this value first_
1. Add the `APPLICATION_URL` domain to the Firebase's Authorized domain list from the _Authentication_ menú.
1. Manage the `.github/workflows/cd.yml` GitHub Action to run when you need. 
