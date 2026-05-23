output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "jenkins_public_ip" {
  description = "Public IP of the Jenkins EC2 instance"
  value       = module.ec2.jenkins_public_ip
}

output "jenkins_url" {
  description = "Jenkins web UI URL"
  value       = "http://${module.ec2.jenkins_public_ip}:8080"
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "s3_model_bucket" {
  description = "S3 bucket for model weights"
  value       = module.s3.model_bucket_name
}
