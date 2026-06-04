# Python examples

## Files

| File | Description |
|---|---|
| `basic.py` | Standalone script — every endpoint |
| `client.py` | Reusable client class |
| `django_middleware.py` | Django middleware — attaches `request.t()` |
| `fastapi_dependency.py` | FastAPI dependency — inject translations into routes |

## Requirements

```bash
pip install httpx          # used in client.py and basic.py
# django_middleware.py: no extra deps beyond Django
# fastapi_dependency.py: no extra deps beyond FastAPI
```
