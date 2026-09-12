# secrets/

This directory holds Docker secrets used by docker-compose.prod.yml.
**These files are NEVER committed to git** (see .gitignore).

## Files required on the server (create manually after cloning):

```
secrets/
  db_password.txt      # PostgreSQL password for the vectr user
```

### How to create on the server:
```bash
mkdir -p /opt/vectr/secrets
echo "your_strong_random_password_here" > /opt/vectr/secrets/db_password.txt
chmod 600 /opt/vectr/secrets/db_password.txt
```

Generate a strong password: `openssl rand -base64 32`
