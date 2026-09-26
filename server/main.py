import os
import re
import secrets
import string
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Response, BackgroundTasks, status, Query
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, Field
from user_agents import parse as parse_user_agent
from prisma import Prisma

# Initialize Prisma Client
prisma = Prisma(auto_register=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect Prisma on application startup
    await prisma.connect()
    yield
    # Disconnect Prisma on application shutdown
    if prisma.is_connected():
        await prisma.disconnect()

app = FastAPI(
    title="LinkPulse URL Shortener API",
    description="High-performance URL Shortener and Click Analytics Backend using FastAPI and Prisma ORM",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Vercel frontend or local development
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helpers
def generate_random_alias(length: int = 6) -> str:
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

def validate_custom_alias(alias: str) -> bool:
    # 3 to 30 alphanumeric characters with dashes and underscores
    return bool(re.match(r"^[a-zA-Z0-9_-]{3,30}$", alias))

# Pydantic Schemas
class CreateUrlRequest(BaseModel):
    original_url: str = Field(..., description="The destination long URL")
    custom_alias: Optional[str] = Field(None, description="Optional custom slug")
    title: Optional[str] = Field(None, description="Optional display title")
    description: Optional[str] = Field(None, description="Optional note or tag")
    expires_at: Optional[datetime] = Field(None, description="Optional expiry timestamp")
    password: Optional[str] = Field(None, description="Optional access password")

class UpdateUrlRequest(BaseModel):
    original_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

# Background Task for Asynchronous Analytics Capture
async def record_click_event(url_id: str, request_headers: Dict[str, str], client_ip: str):
    try:
        user_agent_str = request_headers.get("user-agent", "")
        referer = request_headers.get("referer", "Direct")

        # Parse User Agent
        ua = parse_user_agent(user_agent_str)
        browser = ua.browser.family if ua.browser.family else "Other"
        os_name = ua.os.family if ua.os.family else "Other"

        device_type = "desktop"
        if ua.is_mobile:
            device_type = "mobile"
        elif ua.is_tablet:
            device_type = "tablet"
        elif ua.is_bot:
            device_type = "bot"

        # Geo IP approximation (Header provided by Cloudflare / AWS CloudFront / Nginx)
        country = request_headers.get("cf-ipcountry") or request_headers.get("x-country-code") or "Unknown"
        country_code = country.upper() if len(country) == 2 else "UN"
        city = request_headers.get("cf-ipcity") or "Unknown"

        # Clean referer
        if referer and referer != "Direct":
            try:
                from urllib.parse import urlparse
                domain = urlparse(referer).netloc
                if domain:
                    referer = domain
            except Exception:
                pass

        await prisma.click.create(
            data={
                "urlId": url_id,
                "ip": client_ip,
                "userAgent": user_agent_str[:255] if user_agent_str else "",
                "referer": referer[:255] if referer else "Direct",
                "country": country,
                "countryCode": country_code,
                "city": city,
                "deviceType": device_type,
                "browser": browser,
                "os": os_name,
                "status": 307
            }
        )
    except Exception as e:
        print(f"Failed to record analytics click: {e}")

# API Endpoints
@app.get("/health")
async def health_check():
    db_status = "connected" if prisma.is_connected() else "disconnected"
    return {
        "status": "healthy",
        "database": db_status,
        "engine": "FastAPI + Prisma Python",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/shorten", status_code=status.HTTP_201_CREATED)
async def shorten_url(payload: CreateUrlRequest, request: Request):
    target_url = str(payload.original_url).strip()
    if not target_url.startswith(("http://", "https://")):
        target_url = f"https://{target_url}"

    alias = payload.custom_alias.strip() if payload.custom_alias else ""
    is_custom = False

    if alias:
        if not validate_custom_alias(alias):
            raise HTTPException(
                status_code=400,
                detail="Custom alias must be 3-30 characters long and contain only letters, numbers, hyphens, and underscores."
            )
        # Check if already exists
        existing = await prisma.url.find_unique(where={"alias": alias})
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"The alias '{alias}' is already in use. Please choose another one."
            )
        is_custom = True
    else:
        # Generate unique random alias
        for _ in range(5):
            candidate = generate_random_alias(6)
            existing = await prisma.url.find_unique(where={"alias": candidate})
            if not existing:
                alias = candidate
                break
        if not alias:
            raise HTTPException(status_code=500, detail="Failed to allocate unique short code. Please retry.")

    # Create in database
    created_url = await prisma.url.create(
        data={
            "originalUrl": target_url,
            "alias": alias,
            "title": payload.title or alias,
            "description": payload.description or "",
            "isCustom": is_custom,
            "password": payload.password,
            "expiresAt": payload.expires_at,
        }
    )

    base_url = str(request.base_url).rstrip("/")
    return {
        "id": created_url.id,
        "alias": created_url.alias,
        "original_url": created_url.originalUrl,
        "short_url": f"{base_url}/{created_url.alias}",
        "title": created_url.title,
        "description": created_url.description,
        "is_custom": created_url.isCustom,
        "is_active": created_url.isActive,
        "created_at": created_url.createdAt.isoformat(),
        "expires_at": created_url.expiresAt.isoformat() if created_url.expiresAt else None,
        "clicks_count": 0
    }

@app.get("/api/urls")
async def list_urls(
    search: Optional[str] = Query(None, description="Search by title, alias, or URL"),
    limit: int = Query(50, ge=1, le=100),
    request: Request = None
):
    where_clause = {}
    if search:
        where_clause = {
            "OR": [
                {"alias": {"contains": search, "mode": "insensitive"}},
                {"title": {"contains": search, "mode": "insensitive"}},
                {"originalUrl": {"contains": search, "mode": "insensitive"}},
            ]
        }

    urls = await prisma.url.find_many(
        where=where_clause,
        order={"createdAt": "desc"},
        take=limit,
        include={"_count": {"select": {"clicks": True}}}
    )

    base_url = str(request.base_url).rstrip("/") if request else ""
    return [
        {
            "id": u.id,
            "alias": u.alias,
            "original_url": u.originalUrl,
            "short_url": f"{base_url}/{u.alias}",
            "title": u.title or u.alias,
            "description": u.description,
            "is_custom": u.isCustom,
            "is_active": u.isActive,
            "created_at": u.createdAt.isoformat(),
            "expires_at": u.expiresAt.isoformat() if u.expiresAt else None,
            "clicks_count": getattr(u, "_count", {}).get("clicks", 0) if hasattr(u, "_count") else 0
        }
        for u in urls
    ]

@app.get("/api/urls/{alias}/analytics")
async def get_url_analytics(alias: str):
    url_record = await prisma.url.find_unique(
        where={"alias": alias},
        include={"clicks": {"order_by": {"timestamp": "desc"}, "take": 500}}
    )
    if not url_record:
        raise HTTPException(status_code=404, detail="Short URL not found")

    clicks = url_record.clicks
    total_clicks = len(clicks)
    unique_ips = len(set(c.ip for c in clicks if c.ip))

    # Aggregations
    device_counts = {}
    browser_counts = {}
    os_counts = {}
    country_counts = {}
    referrer_counts = {}
    timeline_map = {}

    for c in clicks:
        # Device
        dev = c.deviceType or "desktop"
        device_counts[dev] = device_counts.get(dev, 0) + 1

        # Browser
        br = c.browser or "Other"
        browser_counts[br] = browser_counts.get(br, 0) + 1

        # OS
        os_name = c.os or "Other"
        os_counts[os_name] = os_counts.get(os_name, 0) + 1

        # Country
        ctry = c.country or "Unknown"
        country_counts[ctry] = country_counts.get(ctry, 0) + 1

        # Referrer
        ref = c.referer or "Direct"
        referrer_counts[ref] = referrer_counts.get(ref, 0) + 1

        # Timeline (YYYY-MM-DD)
        date_str = c.timestamp.strftime("%Y-%m-%d")
        timeline_map[date_str] = timeline_map.get(date_str, 0) + 1

    # Format timeline chronologically
    sorted_timeline = [
        {"date": d, "clicks": timeline_map[d]}
        for d in sorted(timeline_map.keys())
    ]

    # Format distributions
    def to_sorted_list(d: dict):
        return sorted([{"label": k, "count": v, "percentage": round((v / total_clicks) * 100, 1) if total_clicks > 0 else 0} for k, v in d.items()], key=lambda x: x["count"], reverse=True)

    recent_clicks = [
        {
            "id": c.id,
            "timestamp": c.timestamp.isoformat(),
            "device": c.deviceType,
            "browser": c.browser,
            "os": c.os,
            "country": c.country,
            "referer": c.referer
        }
        for c in clicks[:20]
    ]

    return {
        "alias": url_record.alias,
        "original_url": url_record.originalUrl,
        "title": url_record.title,
        "created_at": url_record.createdAt.isoformat(),
        "total_clicks": total_clicks,
        "unique_visitors": unique_ips,
        "timeline": sorted_timeline,
        "devices": to_sorted_list(device_counts),
        "browsers": to_sorted_list(browser_counts),
        "operating_systems": to_sorted_list(os_counts),
        "countries": to_sorted_list(country_counts),
        "referrers": to_sorted_list(referrer_counts),
        "recent_clicks": recent_clicks
    }

@app.put("/api/urls/{alias}")
async def update_url(alias: str, payload: UpdateUrlRequest):
    url_record = await prisma.url.find_unique(where={"alias": alias})
    if not url_record:
        raise HTTPException(status_code=404, detail="Short URL not found")

    data = {}
    if payload.original_url:
        data["originalUrl"] = payload.original_url
    if payload.title is not None:
        data["title"] = payload.title
    if payload.description is not None:
        data["description"] = payload.description
    if payload.is_active is not None:
        data["isActive"] = payload.is_active

    updated = await prisma.url.update(
        where={"alias": alias},
        data=data
    )
    return {"status": "updated", "alias": updated.alias, "is_active": updated.isActive}

@app.delete("/api/urls/{alias}")
async def delete_url(alias: str):
    url_record = await prisma.url.find_unique(where={"alias": alias})
    if not url_record:
        raise HTTPException(status_code=404, detail="Short URL not found")

    await prisma.url.delete(where={"alias": alias})
    return {"status": "deleted", "alias": alias}

# Redirect Endpoint
@app.get("/{alias}")
async def redirect_short_url(alias: str, request: Request, background_tasks: BackgroundTasks):
    url_record = await prisma.url.find_unique(where={"alias": alias})

    if not url_record:
        raise HTTPException(status_code=404, detail=f"No URL found for short code '{alias}'")

    if not url_record.isActive:
        raise HTTPException(status_code=410, detail="This shortened link has been deactivated.")

    if url_record.expiresAt and url_record.expiresAt < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="This shortened link has expired.")

    # Record analytics in background without blocking response
    client_ip = request.client.host if request.client else "127.0.0.1"
    headers_dict = dict(request.headers)
    background_tasks.add_task(record_click_event, url_record.id, headers_dict, client_ip)

    # 307 Temporary Redirect preserves HTTP method and prevents browser permanent cache
    return RedirectResponse(url=url_record.originalUrl, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
