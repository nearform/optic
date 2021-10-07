terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "3.86.0"
    }
  }
}

# The service account used to run Terraform requires the:
#  - Project Owner role
provider "google" {
  credentials = file("service-account-credentials.json")
  project     = var.gcp_project_id
  region      = var.region
  zone        = var.zone
}

provider "google-beta" {
  credentials = file("service-account-credentials.json")
  project     = var.gcp_project_id
  region      = var.region
  zone        = var.zone
}
