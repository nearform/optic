terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "3.86.0"
    }
  }
}

provider "google-beta" {
  credentials = file("service-account-credentials.json")
  project     = var.gcp_project_id
  region      = var.region
  zone        = var.zone
}

resource "google_project" "default" {
    provider = google-beta

    project_id = var.gcp_project_id
    name       = "Optic OTP API"
    org_id     = var.gcp_organization_id
}

resource "google_firebase_project" "default" {
    provider = google-beta
    project  = google_project.default.project_id
}

resource "google_firebase_web_app" "basic" {
    provider = google-beta
    project = google_project.default.project_id
    display_name = "Optic OTP API"

    depends_on = [google_firebase_project.default]
}

data "google_firebase_web_app_config" "basic" {
  provider   = google-beta
  web_app_id = google_firebase_web_app.basic.app_id
}

resource "google_storage_bucket" "default" {
    provider = google-beta
    name = "firebase-optic-storage"
}

resource "google_storage_bucket_object" "default" {
    provider = google-beta
    bucket = google_storage_bucket.default.name
    name = "firebase-config.json"

    content = jsonencode({
        appId              = google_firebase_web_app.basic.app_id
        apiKey             = data.google_firebase_web_app_config.basic.api_key
        authDomain         = data.google_firebase_web_app_config.basic.auth_domain
        databaseURL        = lookup(data.google_firebase_web_app_config.basic, "database_url", "")
        storageBucket      = lookup(data.google_firebase_web_app_config.basic, "storage_bucket", "")
        messagingSenderId  = lookup(data.google_firebase_web_app_config.basic, "messaging_sender_id", "")
        measurementId      = lookup(data.google_firebase_web_app_config.basic, "measurement_id", "")
    })
}
