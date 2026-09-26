from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize the rate limiter (tracks by user IP address)
limiter = Limiter(key_func=get_remote_address)
