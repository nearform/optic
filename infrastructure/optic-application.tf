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

# Create the Cloud Run service
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_service
resource "google_cloud_run_service" "optic" {
  name     = var.service_name
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.optic.email
      containers {
        image = "gcr.io/cloudrun/hello"
        ports {
          name = "http1"
          container_port = "8080"
        }
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        # The following reserved env names were provided: PORT. These values are automatically set by the system.
        # env {
        #   name  = "PORT"
        #   value = "8080"
        # }
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
      template[0].spec[0].containers[0].env,
      template[0].metadata[0].annotations
    ]
  }
}

# Display the service URL
output "APPLICATION_URL" {
  value = google_cloud_run_service.optic.status[0].url
}
output "GCP_PROJECT_ID" {
  value = var.gcp_project_id
}
output "GCP_CLOUDRUN_SERVICE_NAME" {
  value = google_cloud_run_service.optic.name
}
output "GCP_CLOUDRUN_SERVICE_REGION" {
  value = var.region
}
