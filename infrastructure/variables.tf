
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

variable "private_key_secret_name" {
  default = "optic-firebase-private-key"
}
