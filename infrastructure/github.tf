resource "google_service_account" "github_actions" {
  account_id   = "github-actions"
  display_name = "github-actions"
}

# The repository id can't be modified
# https://cloud.google.com/artifact-registry/docs/integrate-cloud-run#deploy-source
resource "google_artifact_registry_repository" "main" {
  provider = google-beta

  location      = var.region
  repository_id = var.service_name
  description   = "Application Docker repository"
  format        = "DOCKER"
}

resource "google_service_account_key" "github_actions" {
  service_account_id = google_service_account.github_actions.name
}

resource "google_cloud_run_service_iam_member" "github_actions_service_run_admin" {
  location = google_cloud_run_service.optic.location
  service  = google_cloud_run_service.optic.name
  role     = "roles/run.admin" // Cloud Run Admin
  member   = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_binding" "github_actions_service_cloud_build" {
  project = var.gcp_project_id
  role    = "roles/cloudbuild.builds.builder" // Cloud Build Service Account
  members = [
    "serviceAccount:${google_service_account.github_actions.email}"
  ]
}

resource "google_project_iam_binding" "github_actions_artifact_registry" {
  project = var.gcp_project_id
  role    = "roles/artifactregistry.writer" // Artifact Registry
  members = [
    "serviceAccount:${google_service_account.github_actions.email}"
  ]
}

resource "google_project_iam_member" "github_actions_service_storage_admin" {
  project = var.gcp_project_id
  role    = "roles/storage.admin" // Storage Admin
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_actions_service_account_user" {
  project = var.gcp_project_id
  role    = "roles/iam.serviceAccountUser" // Service Account User
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

output "GCP_SA_EMAIL" {
  description = "GCP_SA_EMAIL GitHub Secret"
  value       = google_service_account.github_actions.email
}

output "GCP_SA_KEY" {
  description = "GCP_SA_KEY GitHub Secret"
  value       = google_service_account_key.github_actions.private_key
  sensitive   = true
}
