import os

def get_cors_headers():
    """
    Returns secure CORS headers.

    Uses FRONTEND_URL from environment (already configured in template.yaml).
    This ensures only your frontend domain can make requests from the browser.

    For local development, defaults to localhost:5173 (Vite default port).
    For production, use the actual frontend domain set in template.yaml parameters.
    """
    allowed_origin = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    return {
        'Access-Control-Allow-Origin': allowed_origin,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
