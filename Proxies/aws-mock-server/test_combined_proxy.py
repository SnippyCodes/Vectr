import boto3
import json
import time
import sys
from botocore.config import Config

# --- CONFIGURATION ---
MOCK_URL = "http://localhost:8000"
AWS_CREDENTIALS = {
    "aws_access_key_id": "test",
    "aws_secret_access_key": "test",
    "region_name": "us-east-1"
}

def test_s3():
    print("\n[TEST] S3 Mock...")
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=MOCK_URL,
            config=Config(s3={'addressing_style': 'path'}),
            **AWS_CREDENTIALS
        )
        
        # List Buckets
        print("  Listing buckets...")
        s3.list_buckets()
        
        # Create Bucket
        bucket = "test-combined-bucket"
        print(f"  Creating bucket '{bucket}'...")
        s3.create_bucket(Bucket=bucket)
        
        # Upload / Download
        key = "test.txt"
        print(f"  Putting object '{key}'...")
        s3.put_object(Bucket=bucket, Key=key, Body=b"Hello World")
        
        print(f"  Getting object '{key}'...")
        s3.get_object(Bucket=bucket, Key=key)
        
        # Clean up
        print("  Cleaning up...")
        s3.delete_object(Bucket=bucket, Key=key)
        s3.delete_bucket(Bucket=bucket)
        print("[PASS] S3 Mock seems working.")
    except Exception as e:
        print(f"[FAIL] S3 Mock Error: {e}")

def test_bedrock_ollama_connection():
    print("\n[TEST] Bedrock Mock (Ollama Connection Test)...")
    try:
        bedrock = boto3.client(
            "bedrock-runtime",
            endpoint_url=MOCK_URL,
            **AWS_CREDENTIALS
        )
        
        # Bedrock Converse API format (used by Amazon Nova models)
        model_id = "us.amazon.nova-lite-v1:0"
        print(f"  Sending Converse API request to model '{model_id}'...")
        
        messages = [
            {
                "role": "user",
                "content": [{"text": "Hello, are you connected? Please reply with 'Yes, Ollama is connected!'."}]
            }
        ]

        try:
            # Using converse API style payload but falling back to invoke_model just in case
            # The proxy supports Nova format (messages) payload on /invoke endpoint
            body = json.dumps({
                "messages": messages,
                "inferenceConfig": {
                    "max_new_tokens": 50,
                    "temperature": 0.5
                }
            })
            
            response = bedrock.invoke_model(
                modelId=model_id,
                body=body
            )
            resp_body = json.loads(response['body'].read())
            
            # Print specifically what Ollama replied with
            if 'output' in resp_body and 'message' in resp_body['output']:
                reply = resp_body['output']['message']['content'][0]['text']
                print(f"  [SUCCESS] Received reply from Ollama via Bedrock Proxy:\n   >> {reply.strip()}")
            else:
                print(f"  [SUCCESS] Response received but format unexpected: {resp_body}")
                
        except Exception as e:
            if "502" in str(e):
                print(f"  [FAIL] Make sure your LOCAL OLLAMA server is running! (Error: {e})")
            else:
                print(f"  [FAIL] Bedrock Mock Error: {e}")

    except Exception as e:
        print(f"  [FAIL] Bedrock Client Error: {e}")

def test_rds():
    print("\n[TEST] RDS Mock (API)...")
    try:
        rds = boto3.client(
            "rds",
            endpoint_url=MOCK_URL,
            **AWS_CREDENTIALS
        )
        
        print("  Describing DB Instances...")
        rds.describe_db_instances()
        
        db_id = "test-combined-db"
        print(f"  Creating DB Instance '{db_id}' (Metadata check)...")
        # Just create, don't wait for docker, check if response is valid XML
        rds.create_db_instance(
            DBInstanceIdentifier=db_id,
            DBInstanceClass="db.t3.micro",
            Engine="postgres",
            MasterUsername="admin",
            MasterUserPassword="password123",
            DBName="testdb"
        )
        
        print(f"  Checking if '{db_id}' exists in describe...")
        resp = rds.describe_db_instances(DBInstanceIdentifier=db_id)
        if len(resp['DBInstances']) > 0:
            print(f"  Found: {resp['DBInstances'][0]['DBInstanceIdentifier']}")
            
        print(f"  Deleting DB Instance '{db_id}'...")
        rds.delete_db_instance(DBInstanceIdentifier=db_id)
        
        print("[PASS] RDS Mock API seems working.")
        
    except Exception as e:
        print(f"[FAIL] RDS Mock Error: {e}")

if __name__ == "__main__":
    print(f"Connecting to Combined Proxy at {MOCK_URL}...")
    
    # Simple connectivity check
    import urllib.request
    try:
        urllib.request.urlopen(f"{MOCK_URL}/health")
    except Exception as e:
        print(f"[FATAL] Cannot connect to {MOCK_URL}. Is the server running? Error: {e}")
        sys.exit(1)

    test_s3()
    test_bedrock_ollama_connection()
    test_rds()
