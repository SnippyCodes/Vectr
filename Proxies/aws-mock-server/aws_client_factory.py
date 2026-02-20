import os
import boto3
from botocore.config import Config

# --- CONFIGURATION SECTION ---
# This is the single place you configure whether to use Local Mock or Real AWS
USE_LOCAL_MOCK = True  # Set to False to use real AWS

# Settings for Local Mock
LOCAL_MOCK_URL = "http://localhost:8000"
LOCAL_CREDS = {
    "aws_access_key_id": "test",
    "aws_secret_access_key": "test",
    "region_name": "us-east-1"
}

# --- FACTORY FUNCTIONS ---
# Use these functions to get your clients instead of creating them manually

def get_s3_client():
    """Returns a configured Boto3 S3 Client"""
    if USE_LOCAL_MOCK:
        print("Using Local S3 Mock...")
        return boto3.client(
            "s3",
            endpoint_url=LOCAL_MOCK_URL,
            # CRITICAL: Force path style for local S3
            config=Config(s3={'addressing_style': 'path'}), 
            **LOCAL_CREDS
        )
    else:
        print("Using Real AWS S3...")
        return boto3.client("s3")

def get_rds_client():
    """Returns a configured Boto3 RDS Client"""
    if USE_LOCAL_MOCK:
        print("Using Local RDS Mock...")
        return boto3.client(
            "rds",
            endpoint_url=LOCAL_MOCK_URL,
            **LOCAL_CREDS
        )
    else:
        print("Using Real AWS RDS...")
        return boto3.client("rds")

def get_bedrock_client():
    """Returns a configured Boto3 Bedrock Runtime Client"""
    if USE_LOCAL_MOCK:
        print("Using Local Bedrock Mock...")
        return boto3.client(
            "bedrock-runtime",
            endpoint_url=LOCAL_MOCK_URL,
            **LOCAL_CREDS
        )
    else:
        print("Using Real AWS Bedrock...")
        return boto3.client("bedrock-runtime", region_name="us-east-1")

# --- EXAMPLE USAGE ---
if __name__ == "__main__":
    print("--- Demonstrating Unified Client Factory ---")
    
    # 1. Get S3 Client
    s3 = get_s3_client()
    try:
        s3.create_bucket(Bucket="my-app-bucket")
        print("S3 Bucket created successfully.")
    except Exception as e:
        print(f"S3 Error: {e}")

    # 2. Get RDS Client
    rds = get_rds_client()
    try:
        rds.create_db_instance(
            DBInstanceIdentifier="my-app-db",
            DBInstanceClass="db.t3.micro",
            Engine="postgres",
            MasterUsername="admin",
            MasterUserPassword="password",
            DBName="appdb"
        )
        print("RDS Instance creation requested.")
    except Exception as e:
        print(f"RDS Error: {e}")

    # 3. Get Bedrock Client
    bedrock = get_bedrock_client()
    print("Bedrock client ready.")
