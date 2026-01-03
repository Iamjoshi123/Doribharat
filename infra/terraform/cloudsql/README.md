# Cloud SQL Postgres (Private IP) Terraform

This module provisions a private Postgres instance for Doribharat using Google Cloud SQL with private service connect and a database/user for the application.

## What it creates
- Enables `sqladmin.googleapis.com` and `servicenetworking.googleapis.com`
- Private service connection to the provided VPC network
- Cloud SQL Postgres 15 instance with private IP only (no public IPv4)
- Application database and user credentials
- Outputs for `instance_connection_name` and the private IP address

## Inputs
See `variables.tf` for the full list. Common inputs:

| Variable | Purpose | Default |
| --- | --- | --- |
| `project_id` | Target GCP project | — |
| `region` | Cloud SQL region | `asia-south1` |
| `vpc_network` | Self link of the VPC to peer | — |
| `instance_name` | Instance name | `doribharat-postgres` |
| `db_name` | Database name | `doribharat` |
| `db_user` | App user | `doribharat_app` |
| `db_password` | App password | — |

## Usage
1. Copy the example tfvars and fill values:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```
2. Initialize and apply:
   ```bash
   terraform init
   terraform apply
   ```

Example `terraform.tfvars`:
```hcl
project_id   = "my-project"
region       = "asia-south1"
vpc_network  = "projects/my-project/global/networks/default"
instance_name = "doribharat-postgres"
db_password  = "super-secure-password"
```

## Outputs to wire services
- `instance_connection_name` — use for Cloud Run Unix socket connection (`/cloudsql/<instance_connection_name>`)
- `private_ip_address` — use with Cloud SQL Auth Proxy for local development (private IP mode)

## Post-provision steps
- Grant Cloud Run/Cloud Build service accounts the `roles/cloudsql.client` role to connect
- Store `db_password` as a Secret Manager secret and inject via environment variables
