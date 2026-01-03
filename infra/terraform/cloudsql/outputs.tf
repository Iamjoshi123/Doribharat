output "instance_connection_name" {
  description = "Instance connection string for Unix socket or Cloud SQL Auth Proxy"
  value       = google_sql_database_instance.postgres.connection_name
}

output "private_ip_address" {
  description = "Private IP address assigned to the instance"
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "database_name" {
  description = "Provisioned database name"
  value       = google_sql_database.app.name
}

output "database_user" {
  description = "Provisioned database user"
  value       = google_sql_user.app.name
}
