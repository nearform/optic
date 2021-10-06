resource "google_service_account" "optic" {
  account_id   = "optic-cloud-run"
  display_name = "optic-cloud-run"
}

# Enable the application to be publicly accessible
resource "google_cloud_run_service_iam_member" "app_noauth" {
  location = google_cloud_run_service.optic.location
  service  = google_cloud_run_service.optic.name
  role = "roles/run.invoker"
  member = "allUsers"
}

# Enables the GCP services to be used by the terraform
# resource "google_project_service" "run_api" {
#   service = "run.googleapis.com"
# }
# resource "google_project_service" "cloud_api" {
#   service = "cloudresourcemanager.googleapis.com"
# }
# resource "google_project_service" "iam_api" {
#   service = "iam.googleapis.com"
# }

# Create the Cloud Run service
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_service
resource "google_cloud_run_service" "optic" {
  name     = "optic-application"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.optic.email
      containers {
        image = "gcr.io/cloudrun/hello"
        ports {
          container_port = "8080"
        }
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "PORT"
          value = "8080"
        }
        env {
          name  = "FIREBASE_PROJECT_ID"
          value = "dummy"
        }
        env {
          name  = "FIREBASE_CLIENT_EMAIL"
          value = "dummy"
        }
        env {
          name  = "FIREBASE_PRIVATE_KEY_BASE64"
          value = "dummy"
        }
        env {
          name  = "VAPID_SUBJECT"
          value = "dummy"
        }
        env {
          name  = "VAPID_PRIVATE_KEY"
          value = "dummy"
        }
        env {
          name  = "VAPID_PUBLIC_KEY"
          value = "dummy"
        }
        env {
          name  = "REACT_APP_API_KEY"
          value = "dummy"
        }
        env {
          name  = "REACT_APP_AUTH_DOMAIN"
          value = "dummy"
        }
        env {
          name  = "REACT_APP_DATABASE_URL"
          value = "dummy"
        }
        env {
          name  = "REACT_APP_PROJECT_ID"
          value = "dummy"
        }
        env {
          name  = "REACT_APP_STORAGE_BUCKET"
          value = "dummy"
        }
        env {
          name  = "REACT_APP_MESSAGING_SENDER_ID"
          value = "dummy"
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "1000"
        "run.googleapis.com/client-name"   = "terraform"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
  autogenerate_revision_name = true

  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image, // the deploy is done by GitHub Actions
      template[0].metadata[0].annotations
    ]
  }

  # depends_on = [
  #   google_project_service.run_api,
  #   google_project_service.cloud_api,
  #   google_project_service.iam_api
  # ]
}

# Display the service URL
output "APPLICATION_URL" {
  value = google_cloud_run_service.optic.status[0].url
}
