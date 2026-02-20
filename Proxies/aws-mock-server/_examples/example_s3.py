import boto3
from botocore.config import Config

# --- CONFIGURATION ---
MOCK_S3_URL = "http://localhost:8000"
AWS_CREDENTIALS = {
    "aws_access_key_id": "test",
    "aws_secret_access_key": "test",
    "region_name": "us-east-1"
}

def main():
    print("1. Initialize S3 client pointing to local mock...")
    # Important: s3_force_path_style=True is needed because our mock doesn't support 'bucket.localhost' DNS
    s3 = boto3.client(
        "s3",
        endpoint_url=MOCK_S3_URL,
        config=Config(s3={'addressing_style': 'path'}),
        **AWS_CREDENTIALS
    )

    bucket_name = "my-local-bucket"
    file_key = "hello.txt"
    file_content = b"Hello from local S3!"

    # 2. Create Bucket
    print(f"\n2. Creating bucket '{bucket_name}'...")
    try:
        s3.create_bucket(Bucket=bucket_name)
        print("   Bucket created.")
    except Exception as e:
        print(f"   Error: {e}")

    # 3. List Buckets
    print("\n3. Listing buckets...")
    try:
        response = s3.list_buckets()
        for b in response.get("Buckets", []):
            print(f"   - {b['Name']} (Created: {b['CreationDate']})")
    except Exception as e:
        print(f"   Error: {e}")

    # 4. Upload File
    print(f"\n4. Uploading file '{file_key}'...")
    try:
        s3.put_object(Bucket=bucket_name, Key=file_key, Body=file_content)
        print("   File uploaded.")
    except Exception as e:
        print(f"   Error: {e}")

    # 5. List Objects
    print("\n5. Listing objects in bucket...")
    try:
        response = s3.list_objects_v2(Bucket=bucket_name)
        if "Contents" in response:
            for obj in response["Contents"]:
                print(f"   - {obj['Key']} (Size: {obj['Size']} bytes)")
        else:
            print("   Bucket is empty.")
    except Exception as e:
        print(f"   Error: {e}")

    # 6. Download File
    print(f"\n6. Downloading file '{file_key}'...")
    try:
        response = s3.get_object(Bucket=bucket_name, Key=file_key)
        content = response["Body"].read()
        print(f"   Downloaded content: {content.decode()}")
        assert content == file_content
    except Exception as e:
        print(f"   Error: {e}")

    # 7. Delete File (Cleanup)
    print(f"\n7. Deleting file '{file_key}'...")
    try:
        s3.delete_object(Bucket=bucket_name, Key=file_key)
        print("   File deleted.")
    except Exception as e:
        print(f"   Error: {e}")

    # 8. Delete Bucket (Cleanup)
    print(f"\n8. Deleting bucket '{bucket_name}'...")
    try:
        s3.delete_bucket(Bucket=bucket_name)
        print("   Bucket deleted.")
    except Exception as e:
         print(f"   Error: {e}")

if __name__ == "__main__":
    main()
