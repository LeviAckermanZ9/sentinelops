output "model_bucket_name" { value = aws_s3_bucket.models.id }
output "model_bucket_arn" { value = aws_s3_bucket.models.arn }
output "tfstate_bucket_name" { value = aws_s3_bucket.tfstate.id }
