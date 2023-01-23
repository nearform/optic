
variable "gcp_project_id" {
}

variable "service_name" {
  default = "optic"
}

variable "region" {
  default = "europe-west1"
}

variable "zone" {
  default = "europe-west1-b"
}

variable "secrets" {
  default = {
    "optic-firebase-project-id"   = "FIREBASE_PROJECT_ID"
    "optic-firebase-client-email" = "FIREBASE_CLIENT_EMAIL"
    "optic-firebase-private-key"  = "FIREBASE_PRIVATE_KEY_BASE64"
  }
}
