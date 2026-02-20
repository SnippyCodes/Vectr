import boto3
import time
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

# --- CONFIGURATION ---
MOCK_RDS_URL = "http://localhost:8000"
AWS_CREDENTIALS = {
    "aws_access_key_id": "test",
    "aws_secret_access_key": "test",
    "region_name": "us-east-1"
}

# --- 1. INFRASTRUCTURE SETUP (Using Boto3) ---
def get_or_create_db():
    print("1. Infrastructure: Provisioning RDS instance via Mock...")
    rds = boto3.client("rds", endpoint_url=MOCK_RDS_URL, **AWS_CREDENTIALS)

    db_identifier = "sqlalchemy-demo-db"
    db_name = "appdb"
    master_user = "admin"
    master_pass = "secret123"

    try:
        # Try to create
        response = rds.create_db_instance(
            DBInstanceIdentifier=db_identifier,
            DBInstanceClass="db.t3.micro",
            Engine="postgres",
            MasterUsername=master_user,
            MasterUserPassword=master_pass,
            DBName=db_name
        )
        print("   Database creation requested.")
        
        # In a real scenario, you would poll 'describe_db_instances' until status is 'available'
        # Our mock is instant, but let's be safe and get the endpoint details
        response = rds.describe_db_instances(DBInstanceIdentifier=db_identifier)
        endpoint = response["DBInstances"][0]["Endpoint"]
        
        return {
            "host": endpoint["Address"],
            "port": endpoint["Port"],
            "user": master_user,
            "password": master_pass,
            "dbname": db_name
        }

    except Exception as e:
        print(f"   Error getting DB (might already exist): {e}")
        # If it fails, assume it exists and try to fetch details
        try:
            response = rds.describe_db_instances(DBInstanceIdentifier=db_identifier)
            endpoint = response["DBInstances"][0]["Endpoint"]
            return {
                "host": endpoint["Address"],
                "port": endpoint["Port"],
                "user": master_user, # In real AWS, you wouldn't get creds back, but for known test env it's fine
                "password": master_pass,
                "dbname": db_name
            }
        except:
             raise Exception("Could not create or find database")

# --- 2. APPLICATION LOGIC (Using SQLAlchemy) ---

# Define the ORM Base
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    email = Column(String(50))

    def __repr__(self):
        return f"<User(name='{self.name}', email='{self.email}')>"

def run_app_logic(db_info):
    print("\n2. Application: Connecting with SQLAlchemy...")
    
    # Force 127.0.0.1 to avoid IPv6 issues on some Windows setups
    host = db_info['host']
    if host == "localhost":
        host = "127.0.0.1"

    # Construct Connection String
    # Format: postgresql+psycopg2://user:password@host:port/dbname
    connection_str = f"postgresql+psycopg2://{db_info['user']}:{db_info['password']}@{host}:{db_info['port']}/{db_info['dbname']}"
    
    print(f"   Connection String: {connection_str}")
    engine = create_engine(connection_str)
    
    # Retry loop for DB readiness
    max_retries = 10
    for i in range(max_retries):
        try:
            print(f"   Attempt {i+1}/{max_retries} to connect...")
            with engine.connect() as connection:
                print("   Successfully connected!")
            break
        except Exception as e:
            if i == max_retries - 1:
                print("\nCRITICAL: Could not connect to database after multiple attempts.")
                print(f"Last error: {e}")
                raise
            print("   Database not ready yet, waiting 2s...")
            time.sleep(2)

    # Create Tables
    print("   Creating tables...")
    Base.metadata.create_all(engine)
    
    # Create Session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Add Data
    print("   Adding new user...")
    new_user = User(name="SQLAlchemy Wizard", email="wizard@example.com")
    session.add(new_user)
    session.commit()
    
    # Query Data
    print("   Querying users...")
    users = session.query(User).all()
    for user in users:
        print(f"   Found: {user}")
        
    session.close()

if __name__ == "__main__":
    # Step 1: Get the DB (Infrastructure)
    db_config = get_or_create_db()
    
    # Step 2: Use the DB (Application)
    run_app_logic(db_config)
    print("\nDone!")
