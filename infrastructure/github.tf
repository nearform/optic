resource "google_service_account" "github_actions" {
  account_id   = "github-actions"
  display_name = "github-actions"
}

resource "google_artifact_registry_repository" "main" {
  provider = google-beta

  location = var.region
  repository_id = var.artifact_registry_repository_name
  description = "Application Docker repository"
  format = "DOCKER"
}

resource "google_service_account_key" "github_actions" {
  service_account_id = google_service_account.github_actions.name
}

resource "google_cloud_run_service_iam_member" "github_actions_service_run_admin" {
  location = google_cloud_run_service.optic.location
  service = google_cloud_run_service.optic.name
  role = "roles/run.admin"// Cloud Run Admin
  member = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_artifact_registry_repository_iam_member" "github_actions_ar" {
  provider = google-beta

  location = var.region
  repository = google_artifact_registry_repository.main.name
  # role   = "roles/artifactregistry.writer" // Artifact Registry
  role   = "roles/artifactregistry.admin" // Needed for the first deploy
  member = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_actions_service_storage_admin" {
  role    = "roles/storage.admin" // Storage Admin
  member = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_actions_service_account_user" {
  role    = "roles/iam.serviceAccountUser" // Service Account User
  member = "serviceAccount:${google_service_account.github_actions.email}"
}

output "GCP_SA_EMAIL" {
  description = "GCP_SA_EMAIL GitHub Secret"
  value = google_service_account.github_actions.email
}

output "GCP_SA_KEY" {
  description = "GCP_SA_KEY GitHub Secret"
  value = google_service_account_key.github_actions.private_key
  sensitive = true
}
