import os
import shutil
import logging
import mimetypes
import json
import time
import random
import uuid
import sqlite3
import httpx
import uvicorn
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import FileResponse, JSONResponse

# SQLAlchemy imports
from sqlalchemy import create_engine, Column, String, Integer, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session

try:
    import docker
except ImportError:
    docker = None

# --- CONFIGURATION & LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aws-mock-combined")

# S3 Configuration
S3_ROOT_DIR = os.getenv("S3_ROOT_DIR", "./s3_data")
Path(S3_ROOT_DIR).mkdir(parents=True, exist_ok=True)

# Bedrock/Ollama Configuration
OLLAMA_GENERATE_URL = os.getenv("OLLAMA_GENERATE_URL", "http://localhost:11434/api/generate")
OLLAMA_CHAT_URL = os.getenv("OLLAMA_CHAT_URL", "http://localhost:11434/api/chat")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gpt-oss:20b-cloud")


# RDS Configuration
MOCK_RDS_PORT = int(os.getenv("MOCK_RDS_PORT", "5432"))
DEFAULT_RDS_PORT_START = 5433
active_rds_ports = set()

# Initialize Docker client (for RDS)
docker_client = None
if docker:
    try:
        docker_client = docker.from_env()
        docker_client.ping()
        logger.info("Docker client initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize Docker client: {e}. Running in Mock Metadata Mode for RDS.")
        docker_client = None
else:
    logger.warning("Docker SDK not installed. Running in Mock Metadata Mode for RDS.")

# Map engine to docker image
RDS_ENGINE_MAP = {
    "postgres": "postgres:latest",
    "mysql": "mysql:latest"
}

# --- DATABASE SETUP (Internal Metadata) ---
SQLITE_DB_PATH = "sqlite:///./aws_mock_metadata.db"
engine = create_engine(SQLITE_DB_PATH, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBInstance(Base):
    __tablename__ = "rds_instances"
    
    id = Column(String, primary_key=True, index=True) # DBInstanceIdentifier
    engine = Column(String)
    master_username = Column(String)
    db_name = Column(String)
    port = Column(Integer)
    status = Column(String, default="available")
    local_path = Column(String, nullable=True) # Path to SQLite file if fallback used
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize active ports from DB
with SessionLocal() as db:
    existing_instances = db.query(DBInstance).all()
    for inst in existing_instances:
        if inst.port:
            active_rds_ports.add(inst.port)
            logger.info(f"Registered existing RDS instance '{inst.id}' on port {inst.port}")

app = FastAPI()

# --- S3 HELPER FUNCTIONS ---

def _get_bucket_path(bucket_name):
    # Security: prevent directory traversal
    safe_name = os.path.basename(bucket_name)
    return Path(S3_ROOT_DIR) / safe_name

def _get_object_path(bucket_name, key):
    bucket_path = _get_bucket_path(bucket_name)
    # Security: prevent directory traversal
    safe_key = os.path.normpath(key)
    if safe_key.startswith("..") or safe_key.startswith("/") or safe_key.startswith("\\"):
         # Basic check, might need better validation
        pass 
    # Ensure key doesn't traverse up
    full_path = (bucket_path / safe_key).resolve()
    if not str(full_path).startswith(str(bucket_path.resolve())):
         raise HTTPException(status_code=400, detail="Invalid key path")
    return full_path

def _xml_response(content, status_code=200):
    return Response(content=content, media_type="application/xml", status_code=status_code)

def _generate_list_buckets_xml(buckets):
    root = ET.Element("ListAllMyBucketsResult", xmlns="http://s3.amazonaws.com/doc/2006-03-01/")
    owner = ET.SubElement(root, "Owner")
    ET.SubElement(owner, "ID").text = "mock-owner-id"
    ET.SubElement(owner, "DisplayName").text = "mock-owner"
    
    buckets_elem = ET.SubElement(root, "Buckets")
    for b in buckets:
        creation_date = datetime.now().isoformat()
        try:
            stat = b.stat()
            creation_date = datetime.fromtimestamp(stat.st_ctime).isoformat()
        except:
            pass
            
        bucket = ET.SubElement(buckets_elem, "Bucket")
        ET.SubElement(bucket, "Name").text = b.name
        ET.SubElement(bucket, "CreationDate").text = creation_date
        
    return ET.tostring(root, encoding="utf-8")

def _generate_list_objects_xml(bucket_name, objects, prefix=""):
    root = ET.Element("ListBucketResult", xmlns="http://s3.amazonaws.com/doc/2006-03-01/")
    ET.SubElement(root, "Name").text = bucket_name
    ET.SubElement(root, "Prefix").text = prefix
    ET.SubElement(root, "KeyCount").text = str(len(objects))
    ET.SubElement(root, "MaxKeys").text = "1000"
    ET.SubElement(root, "IsTruncated").text = "false"
    
    bucket_path = _get_bucket_path(bucket_name).resolve()

    for obj_path in objects:
        contents = ET.SubElement(root, "Contents")
        # Calculate relative key
        try:
            key = str(obj_path.resolve().relative_to(bucket_path)).replace("\\", "/")
        except ValueError:
            continue # Should not happen if objects are filtered correctly
            
        ET.SubElement(contents, "Key").text = key
        
        stat = obj_path.stat()
        ET.SubElement(contents, "LastModified").text = datetime.fromtimestamp(stat.st_mtime).isoformat()
        ET.SubElement(contents, "ETag").text = '"mock-etag"'
        ET.SubElement(contents, "Size").text = str(stat.st_size)
        ET.SubElement(contents, "StorageClass").text = "STANDARD"

    return ET.tostring(root, encoding="utf-8")

# --- RDS HELPER FUNCTIONS ---

def get_free_rds_port():
    port = DEFAULT_RDS_PORT_START
    while port in active_rds_ports:
        port += 1
    active_rds_ports.add(port)
    return port

async def handle_rds_create_db_instance(params):
    db_id = params.get("DBInstanceIdentifier")
    engine_type = params.get("Engine", "postgres")
    master_username = params.get("MasterUsername", "postgres")
    master_password = params.get("MasterUserPassword", "password")
    db_name = params.get("DBName", "mydb")
    
    db = SessionLocal()
    try:
        if db.query(DBInstance).filter(DBInstance.id == db_id).first():
            return Response(content=f"<Error><Code>DBInstanceAlreadyExists</Code><Message>DB Instance {db_id} already exists</Message></Error>", media_type="application/xml", status_code=400)

        port = get_free_rds_port()
        local_path = None
        
        # Try Docker if available
        if docker_client:
            image = RDS_ENGINE_MAP.get(engine_type)
            if not image:
                return Response(content=f"<Error><Code>InvalidParameterValue</Code><Message>Engine {engine_type} not supported</Message></Error>", media_type="application/xml", status_code=400)

            container_name = f"aws-mock-rds-{db_id}"
            env_vars = {}
            if engine_type == "postgres":
                env_vars = {"POSTGRES_USER": master_username, "POSTGRES_PASSWORD": master_password, "POSTGRES_DB": db_name}
            elif engine_type == "mysql":
                env_vars = {"MYSQL_ROOT_PASSWORD": master_password, "MYSQL_DATABASE": db_name, "MYSQL_USER": master_username, "MYSQL_PASSWORD": master_password}

            try:
                try:
                    existing = docker_client.containers.get(container_name)
                    if existing.status == "running":
                        # Should have been caught by DB check, but maybe inconsistent
                        pass
                    existing.remove()
                except docker.errors.NotFound:
                    pass

                docker_client.containers.run(
                    image,
                    name=container_name,
                    environment=env_vars,
                    ports={5432 if engine_type == "postgres" else 3306: port},
                    detach=True
                )
            except Exception as e:
                logger.error(f"Failed to create container: {e}")
                return Response(content=f"<Error><Code>InternalFailure</Code><Message>{str(e)}</Message></Error>", media_type="application/xml", status_code=500)
        else:
            # Fallback to mock (SQLite file creation)
            # We still use sqlite3 here to create the FILE the user wants, but we track it in our SQLAlchemy DB.
            documents_path = Path.home() / "Documents" / "VectrRDS"
            try:
                documents_path.mkdir(parents=True, exist_ok=True)
                db_path = documents_path / f"{db_id}.sqlite"
                conn = sqlite3.connect(db_path)
                conn.close()
                local_path = str(db_path)
                logger.info(f"Created mocked SQLite database at {db_path}")
            except Exception as e:
                logger.error(f"Failed to create SQLite database file: {e}")
                local_path = "memory"

        # Save to DB
        new_instance = DBInstance(
            id=db_id,
            engine=engine_type,
            master_username=master_username,
            db_name=db_name,
            port=port,
            status="available",
            local_path=local_path
        )
        db.add(new_instance)
        db.commit()
        
        # Return XML
        response_xml = f"""
        <CreateDBInstanceResponse xmlns="http://rds.amazonaws.com/doc/2014-10-31/">
          <CreateDBInstanceResult>
            <DBInstance>
              <DBInstanceIdentifier>{db_id}</DBInstanceIdentifier>
              <DBInstanceClass>db.t3.micro</DBInstanceClass>
              <Engine>{engine_type}</Engine>
              <DBInstanceStatus>available</DBInstanceStatus>
              <MasterUsername>{master_username}</MasterUsername>
              <DBName>{db_name}</DBName>
              <Endpoint>
                <Address>localhost</Address>
                <Port>{port}</Port>
              </Endpoint>
            </DBInstance>
          </CreateDBInstanceResult>
          <ResponseMetadata>
            <RequestId>{uuid.uuid4()}</RequestId>
          </ResponseMetadata>
        </CreateDBInstanceResponse>
        """
        return Response(content=response_xml.strip(), media_type="application/xml")
    finally:
        db.close()

async def handle_rds_describe_db_instances(params):
    db_id = params.get("DBInstanceIdentifier")
    db = SessionLocal()
    try:
        instances = []
        if db_id:
            inst = db.query(DBInstance).filter(DBInstance.id == db_id).first()
            if inst:
                instances.append(inst)
            else:
                return Response(content=f"<Error><Code>DBInstanceNotFound</Code><Message>DBInstance {db_id} not found</Message></Error>", media_type="application/xml", status_code=404)
        else:
            instances = db.query(DBInstance).all()

        # Check Docker status if applicable
        if docker_client:
            # We trust our DB, but we could sync status.
            # For simplicity, we just use what we have in DB, assuming we manage it.
            # But let's check basic container aliveness
            pass

        instances_xml = ""
        for i in instances:
            instances_xml += f"""
            <DBInstance>
              <DBInstanceIdentifier>{i.id}</DBInstanceIdentifier>
              <DBInstanceClass>db.t3.micro</DBInstanceClass>
              <Engine>{i.engine}</Engine>
              <DBInstanceStatus>{i.status}</DBInstanceStatus>
              <Endpoint>
                <Address>localhost</Address>
                <Port>{i.port}</Port>
              </Endpoint>
            </DBInstance>
            """

        response_xml = f"""
        <DescribeDBInstancesResponse xmlns="http://rds.amazonaws.com/doc/2014-10-31/">
          <DescribeDBInstancesResult>
            <DBInstances>
              {instances_xml}
            </DBInstances>
          </DescribeDBInstancesResult>
          <ResponseMetadata>
            <RequestId>{uuid.uuid4()}</RequestId>
          </ResponseMetadata>
        </DescribeDBInstancesResponse>
        """
        return Response(content=response_xml.strip(), media_type="application/xml")
    finally:
        db.close()

async def handle_rds_delete_db_instance(params):
    db_id = params.get("DBInstanceIdentifier")
    db = SessionLocal()
    try:
        inst = db.query(DBInstance).filter(DBInstance.id == db_id).first()
        if not inst:
            return Response(content=f"<Error><Code>DBInstanceNotFound</Code><Message>DBInstance {db_id} not found</Message></Error>", media_type="application/xml", status_code=404)
        
        if docker_client:
            container_name = f"aws-mock-rds-{db_id}"
            try:
                container = docker_client.containers.get(container_name)
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass
        else:
            if inst.local_path and inst.local_path != "memory":
                try:
                    p = Path(inst.local_path)
                    if p.exists():
                        p.unlink()
                except Exception:
                    pass
        
        db.delete(inst)
        db.commit()
            
        response_xml = f"""
        <DeleteDBInstanceResponse xmlns="http://rds.amazonaws.com/doc/2014-10-31/">
          <DeleteDBInstanceResult>
            <DBInstance>
              <DBInstanceIdentifier>{db_id}</DBInstanceIdentifier>
              <DBInstanceStatus>deleted</DBInstanceStatus>
            </DBInstance>
          </DeleteDBInstanceResult>
          <ResponseMetadata>
            <RequestId>{uuid.uuid4()}</RequestId>
          </ResponseMetadata>
        </DeleteDBInstanceResponse>
        """
        return Response(content=response_xml.strip(), media_type="application/xml")
    finally:
        db.close()

async def handle_rds_request(request: Request):
    try:
        values = {}
        if request.method == "POST":
            form = await request.form()
            values = dict(form)
        else:
            values = dict(request.query_params)
            
        action = values.get("Action")
        
        if action == "CreateDBInstance":
            return await handle_rds_create_db_instance(values)
        elif action == "DescribeDBInstances":
            return await handle_rds_describe_db_instances(values)
        elif action == "DeleteDBInstance":
            return await handle_rds_delete_db_instance(values)
        else:
            return Response(content=f"<Error><Code>InvalidAction</Code><Message>Action {action} not supported</Message></Error>", media_type="application/xml", status_code=400)
    except Exception as e:
        logger.error(f"RDS Error: {e}", exc_info=True)
        return Response(content=f"<Error><Code>InternalError</Code><Message>{str(e)}</Message></Error>", media_type="application/xml", status_code=500)

# --- BEDROCK (OLLAMA) HELPER FUNCTIONS ---

async def handle_converse_style(body, model_id):
    ollama_msgs = []
    if "system" in body:
        for s in body["system"]:
            if "text" in s:
                ollama_msgs.append({"role": "system", "content": s["text"]})
    
    for m in body.get("messages", []):
        role = m.get("role", "user")
        content = ""
        if isinstance(m.get("content"), list):
            for block in m["content"]:
                if "text" in block:
                    content += block["text"]
        elif isinstance(m.get("content"), str):
            content = m["content"]
        ollama_msgs.append({"role": role, "content": content})

    req = {"model": DEFAULT_OLLAMA_MODEL, "messages": ollama_msgs, "stream": False}
    if "inferenceConfig" in body:
        opts = {}
        inf_conf = body["inferenceConfig"]
        if "max_new_tokens" in inf_conf: opts["num_predict"] = inf_conf["max_new_tokens"]
        if "temperature" in inf_conf: opts["temperature"] = inf_conf["temperature"]
        if "top_p" in inf_conf: opts["top_p"] = inf_conf["top_p"]
        if opts: req["options"] = opts

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(OLLAMA_CHAT_URL, json=req, timeout=60.0)
            if resp.status_code != 200:
                logger.error(f"Ollama error: {resp.text}")
                return JSONResponse(status_code=502, content={"error": f"Ollama error: {resp.text}"})
            ollama_resp = resp.json()
            logger.info(f"Ollama Raw Chat Response: {ollama_resp}")
        except Exception as e:
            return JSONResponse(status_code=502, content={"error": str(e)})

    msg_obj = ollama_resp.get("message", {})
    response_text = msg_obj.get("content", "")
    
    # some models like deepseek/gpt-oss put reasoning in 'thinking' flag before outputting the content
    thinking_text = msg_obj.get("thinking", "")
    if thinking_text and not response_text:
        response_text = f"<{thinking_text}>\n"
    elif thinking_text:
        response_text = f"<{thinking_text}>\n{response_text}"

    nova_resp = {
        "output": {"message": {"role": "assistant", "content": [{"text": response_text}]}},
        "stopReason": "end_turn",
        "usage": {"inputTokens": ollama_resp.get("prompt_eval_count", 0), "outputTokens": ollama_resp.get("eval_count", 0)}
    }
    return JSONResponse(content=nova_resp)

async def handle_titan_style(body, model_id):
    prompt = body.get("inputText", "")
    req = {"model": DEFAULT_OLLAMA_MODEL, "prompt": prompt, "stream": False}
    
    text_gen_config = body.get("textGenerationConfig", {})
    opts = {}
    if "maxTokenCount" in text_gen_config: opts["num_predict"] = text_gen_config["maxTokenCount"]
    if "temperature" in text_gen_config: opts["temperature"] = text_gen_config["temperature"]
    if opts: req["options"] = opts
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(OLLAMA_GENERATE_URL, json=req, timeout=60.0)
            if resp.status_code != 200: return JSONResponse(status_code=502, content={"error": resp.text})
            ollama_resp = resp.json()
        except Exception as e:
            return JSONResponse(status_code=502, content={"error": str(e)})

    response_text = ollama_resp.get("response", "")
    titan_resp = {"results": [{"outputText": response_text}], "inputTextTokenCount": ollama_resp.get("prompt_eval_count", 0)}
    return JSONResponse(content=titan_resp)

async def handle_claude_style(body, model_id):
    prompt = body.get("prompt", "")
    req = {"model": DEFAULT_OLLAMA_MODEL, "prompt": prompt, "stream": False}
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(OLLAMA_GENERATE_URL, json=req, timeout=60.0)
            if resp.status_code != 200: return JSONResponse(status_code=502, content={"error": resp.text})
            ollama_resp = resp.json()
        except Exception as e:
            return JSONResponse(status_code=502, content={"error": str(e)})

    response_text = ollama_resp.get("response", "")
    claude_resp = {"completion": response_text, "stop_reason": "stop_sequence"}
    return JSONResponse(content=claude_resp)

# --- ROUTES ---

@app.get("/health")
async def health():
    return {"status": "ok", "services": ["s3", "bedrock", "rds"], "database": "sqlalchemy"}

# Bedrock Route
@app.post("/model/{model_id}/invoke")
async def invoke_model(model_id: str, request: Request):
    logger.info(f"Received invocation for model: {model_id}")
    try:
        body = await request.json()
    except:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})

    if "messages" in body: return await handle_converse_style(body, model_id)
    if "inputText" in body: return await handle_titan_style(body, model_id)
    if "prompt" in body: return await handle_claude_style(body, model_id)
    
    return JSONResponse(status_code=400, content={"error": "Unsupported Bedrock request format."})

# Root Routes (S3 List Buckets & RDS Actions)
@app.get("/")
async def root_get(request: Request):
    auth = request.headers.get("Authorization", "")
    user_agent = request.headers.get("User-Agent", "")
    
    # S3 List Buckets (aws s3 ls)
    if "AWS4-HMAC-SHA256" in auth or "aws-sdk" in user_agent.lower() or "boto3" in user_agent.lower():
        buckets = [x for x in Path(S3_ROOT_DIR).iterdir() if x.is_dir()]
        return _xml_response(_generate_list_buckets_xml(buckets))
        
    return {"status": "running", "info": "Local AWS Mock Server (S3, Bedrock, RDS) with SQLAlchemy Metadata"}

@app.post("/")
async def root_post(request: Request):
    try:
        # RDS Requests come as POSTs to / with Action param
        content_type = request.headers.get("content-type", "")
        if "application/x-www-form-urlencoded" in content_type:
            form = await request.form()
            if "Action" in form:
                return await handle_rds_request(request)
                
        return JSONResponse(status_code=404, content={"error": "Not found or unsupported service request"})
    except Exception as e:
        logger.error(f"Root Post Error: {e}", exc_info=True)
        return Response(content=f"<Error><Code>InternalError</Code><Message>{str(e)}</Message></Error>", media_type="application/xml", status_code=500)

# S3 Bucket & Object Routes
# These are generic so they go last
@app.put("/{bucket_name}")
async def s3_create_bucket(bucket_name: str, request: Request):
    path = _get_bucket_path(bucket_name)
    try:
        path.mkdir(exist_ok=True)
        return Response(status_code=200)
    except Exception as e:
        return _xml_response(f"<Error><Code>InternalError</Code><Message>{str(e)}</Message></Error>", 500)

@app.delete("/{bucket_name}")
async def s3_delete_bucket(bucket_name: str, request: Request):
    path = _get_bucket_path(bucket_name)
    if not path.exists():
        return _xml_response(f"<Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist</Message></Error>", 404)
    if any(path.iterdir()):
         return _xml_response(f"<Error><Code>BucketNotEmpty</Code><Message>The bucket you tried to delete is not empty</Message></Error>", 409)
    try:
        path.rmdir()
        return Response(status_code=204)
    except Exception as e:
        return _xml_response(f"<Error><Code>InternalError</Code><Message>{str(e)}</Message></Error>", 500)

@app.get("/{bucket_name}")
async def s3_list_objects(bucket_name: str, request: Request):
    if bucket_name in ["health", "model", "favicon.ico"]:
        return JSONResponse(status_code=404, content={"error": "Not a bucket"})
        
    path = _get_bucket_path(bucket_name)
    if not path.exists():
         return _xml_response(f"<Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist</Message></Error>", 404)
    
    params = request.query_params
    prefix = params.get("prefix", "")
    all_files = [p for p in path.rglob("*") if p.is_file()]
    # Simple prefix filter could go here
    return _xml_response(_generate_list_objects_xml(bucket_name, all_files, prefix))

@app.put("/{bucket_name}/{key:path}")
async def s3_put_object(bucket_name: str, key: str, request: Request):
    obj_path = _get_object_path(bucket_name, key)
    obj_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        body = await request.body()
        with open(obj_path, "wb") as f:
            f.write(body)
        return Response(status_code=200)
    except Exception as e:
        return _xml_response(f"<Error><Code>InternalError</Code><Message>{str(e)}</Message></Error>", 500)

@app.get("/{bucket_name}/{key:path}")
async def s3_get_object(bucket_name: str, key: str, request: Request):
    obj_path = _get_object_path(bucket_name, key)
    if not obj_path.exists() or not obj_path.is_file():
         return _xml_response(f"<Error><Code>NoSuchKey</Code><Message>The specified key does not exist</Message></Error>", 404)
    return FileResponse(obj_path)

@app.delete("/{bucket_name}/{key:path}")
async def s3_delete_object(bucket_name: str, key: str, request: Request):
    obj_path = _get_object_path(bucket_name, key)
    if obj_path.exists():
        try:
            os.remove(obj_path)
        except Exception as e:
            return _xml_response(f"<Error><Code>InternalError</Code><Message>{str(e)}</Message></Error>", 500)
    return Response(status_code=204)

@app.head("/{bucket_name}/{key:path}")
async def s3_head_object(bucket_name: str, key: str, request: Request):
    obj_path = _get_object_path(bucket_name, key)
    if not obj_path.exists() or not obj_path.is_file():
         return Response(status_code=404)
    return Response(status_code=200)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
