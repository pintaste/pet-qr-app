"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings
from app.core.exceptions import PetQRException
from app.middleware.tenant import TenantMiddleware
from app.api import router as api_router
from app.api.routes import public


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns:
        FastAPI: Configured FastAPI application instance.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="基于二维码的宠物信息管理与展示系统",
        docs_url="/docs" if settings.ENABLE_DOCS else None,
        redoc_url="/redoc" if settings.ENABLE_REDOC else None,
        openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
    )

    # Configure CORS — must use explicit origin list when allow_credentials=True
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add tenant middleware
    app.add_middleware(TenantMiddleware)

    # Include API routes
    app.include_router(api_router, prefix="/api/v1")

    # Include public routes (no prefix)
    app.include_router(public.router, tags=["Public"])

    @app.exception_handler(PetQRException)
    async def pet_qr_exception_handler(request: Request, exc: PetQRException):
        """Handle custom PetQR exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "error_code": exc.error_code},
        )

    @app.get("/")
    async def root():
        """Root endpoint for health check."""
        return {
            "message": "Pet QR System API",
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "version": settings.APP_VERSION}

    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
