variable "project_id" {
  description = "GCP project ID where Cloud SQL will be provisioned"
  type        = string
}

variable "region" {
  description = "Primary region for the Cloud SQL instance"
  type        = string
  default     = "asia-south1"
}

variable "vpc_network" {
  description = "Self link of the VPC network to peer (e.g. projects/<project>/global/networks/<network>)"
  type        = string
}

variable "instance_name" {
  description = "Cloud SQL instance name"
  type        = string
  default     = "doribharat-postgres"
}

variable "tier" {
  description = "Machine tier for the database instance"
  type        = string
  default     = "db-custom-2-4096"
}

variable "availability_type" {
  description = "ZONAL or REGIONAL availability"
  type        = string
  default     = "ZONAL"
}

variable "disk_size_gb" {
  description = "Disk size for the instance"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Application database name"
  type        = string
  default     = "doribharat"
}

variable "db_user" {
  description = "Application database user"
  type        = string
  default     = "doribharat_app"
}

variable "db_password" {
  description = "Application database user password"
  type        = string
  sensitive   = true
}

variable "deletion_protection" {
  description = "Enable deletion protection on the Cloud SQL instance"
  type        = bool
  default     = true
}
