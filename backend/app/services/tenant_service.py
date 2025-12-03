"""
Multi-tenant service for domain routing and schema management.
"""

import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlmodel import Session, select, text
from sqlalchemy.exc import SQLAlchemyError, ProgrammingError
from app.core.config import settings
from app.models.shared import Tenant, TenantTier
import redis
import json

logger = logging.getLogger(__name__)


class TenantService:
    """
    Multi-tenant service for managing tenant routing and schema operations.
    """

    def __init__(self):
        """Initialize tenant service with Redis cache."""
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.cache_timeout = 3600  # 1 hour cache
        self.tenant_cache_key_prefix = "tenant:"

    def _get_cache_key(self, domain: str) -> str:
        """
        Get Redis cache key for tenant domain.

        Args:
            domain (str): Domain name.

        Returns:
            str: Cache key.
        """
        return f"{self.tenant_cache_key_prefix}{domain}"

    def _cache_tenant(self, domain: str, tenant_data: Dict[str, Any]) -> None:
        """
        Cache tenant data in Redis.

        Args:
            domain (str): Domain name.
            tenant_data (Dict[str, Any]): Tenant data to cache.
        """
        try:
            cache_key = self._get_cache_key(domain)
            self.redis_client.setex(
                cache_key, self.cache_timeout, json.dumps(tenant_data)
            )
        except (ConnectionError, TimeoutError, json.JSONDecodeError) as e:
            # Cache failure shouldn't break the application
            # Log for monitoring but continue operation
            import logging
            logging.getLogger(__name__).debug(f"Redis cache set failed for {domain}: {e}")

    def _get_cached_tenant(self, domain: str) -> Optional[Dict[str, Any]]:
        """
        Get cached tenant data from Redis.

        Args:
            domain (str): Domain name.

        Returns:
            Optional[Dict[str, Any]]: Cached tenant data or None.
        """
        try:
            cache_key = self._get_cache_key(domain)
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except (ConnectionError, TimeoutError, json.JSONDecodeError) as e:
            # Cache failure shouldn't break the application
            import logging
            logging.getLogger(__name__).debug(f"Redis cache get failed for {domain}: {e}")
        return None

    def _invalidate_tenant_cache(self, domain: str) -> None:
        """
        Invalidate tenant cache for domain.

        Args:
            domain (str): Domain name.
        """
        try:
            cache_key = self._get_cache_key(domain)
            self.redis_client.delete(cache_key)
        except (ConnectionError, TimeoutError) as e:
            # Cache failure shouldn't break the application
            import logging
            logging.getLogger(__name__).debug(f"Redis cache invalidate failed for {domain}: {e}")

    def extract_tenant_from_domain(self, domain: str) -> Dict[str, str]:
        """
        Extract tenant information from domain.

        Args:
            domain (str): Full domain (e.g., "demo.petqr.com" or "petstore.com")

        Returns:
            Dict[str, str]: Tenant identification info.
        """
        # Remove port if present (localhost:8000 -> localhost)
        domain = domain.split(":")[0]

        # Priority order for tenant identification:
        # 1. Custom domain (e.g., petstore.com)
        # 2. Subdomain (e.g., demo.petqr.com)
        # 3. Default to public access

        if "." in domain:
            parts = domain.split(".")
            if len(parts) >= 3:
                # Subdomain format: demo.petqr.com
                subdomain = parts[0]
                return {"type": "subdomain", "identifier": subdomain, "domain": domain}
            else:
                # Custom domain format: petstore.com
                return {"type": "custom_domain", "identifier": domain, "domain": domain}
        else:
            # localhost or single word domain
            return {"type": "default", "identifier": "default", "domain": domain}

    async def get_tenant_by_domain(self, db: Session, domain: str) -> Optional[Tenant]:
        """
        Get tenant by domain with caching.

        Args:
            db (Session): Database session.
            domain (str): Domain name.

        Returns:
            Optional[Tenant]: Tenant object if found.
        """
        # Check cache first
        cached_tenant = self._get_cached_tenant(domain)
        if cached_tenant:
            # Convert cached data back to Tenant object
            tenant = Tenant(**cached_tenant)
            return tenant

        # Extract tenant info from domain
        tenant_info = self.extract_tenant_from_domain(domain)

        # Query database based on tenant type
        tenant = None
        if tenant_info["type"] == "custom_domain":
            result = await db.execute(
                select(Tenant).where(Tenant.custom_domain == domain)
            )
            tenant = result.scalars().first()
        elif tenant_info["type"] == "subdomain":
            result = await db.execute(
                select(Tenant).where(Tenant.subdomain == tenant_info["identifier"])
            )
            tenant = result.scalars().first()
        else:
            # Default tenant for localhost/development
            result = await db.execute(select(Tenant).where(Tenant.subdomain == "demo"))
            tenant = result.scalars().first()

        # Cache the result if found
        if tenant:
            tenant_data = {
                "id": tenant.id,
                "name": tenant.name,
                "subdomain": tenant.subdomain,
                "custom_domain": tenant.custom_domain,
                "tier": tenant.tier.value
                if hasattr(tenant.tier, "value")
                else tenant.tier,
                "settings": tenant.settings,
                "is_active": tenant.is_active,
                "created_at": tenant.created_at.isoformat(),
                "updated_at": tenant.updated_at.isoformat(),
                # Note: Don't cache schema_name since Tenant model doesn't have it
            }
            self._cache_tenant(domain, tenant_data)

        return tenant

    def get_tenant_schema_name(self, tenant: Tenant) -> str:
        """
        Get schema name for tenant.

        Args:
            tenant (Tenant): Tenant object.

        Returns:
            str: Schema name.
        """
        # Schema name is derived from subdomain (Tenant model doesn't have schema_name field)
        # Replace hyphens with underscores for valid PostgreSQL schema names
        return f"tenant_{tenant.subdomain.replace('-', '_')}"

    async def create_tenant_schema(self, schema_name: str, db: Session) -> bool:
        """
        Create database schema for tenant.

        Args:
            schema_name (str): Schema name to create.
            db (Session): Database session.

        Returns:
            bool: True if schema created successfully.

        Raises:
            HTTPException: If schema creation fails.
        """
        try:
            # Create schema - quote to handle special characters
            db.exec(text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))

            # Set search path and create tables - quote to handle special characters
            db.exec(text(f'SET search_path TO "{schema_name}"'))

            # Import models to ensure they're registered

            # This would typically be done through Alembic migrations
            # For now, we'll assume the schema structure is created via migrations

            db.commit()
            return True

        except ProgrammingError as e:
            db.rollback()
            logger.error(f"SQL syntax error creating tenant schema: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create tenant schema: SQL error",
            )
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error creating tenant schema: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create tenant schema: database error",
            )

    async def create_tenant(
        self,
        db: Session,
        name: str,
        subdomain: str,
        custom_domain: Optional[str] = None,
        tier: TenantTier = TenantTier.STANDARD,
        settings: Optional[Dict[str, Any]] = None,
    ) -> Tenant:
        """
        Create a new tenant with schema.

        Args:
            db (Session): Database session.
            name (str): Tenant name.
            subdomain (str): Tenant subdomain.
            custom_domain (Optional[str]): Custom domain.
            tier (TenantTier): Tenant tier.
            settings (Optional[Dict[str, Any]]): Tenant settings.

        Returns:
            Tenant: Created tenant object.

        Raises:
            HTTPException: If tenant creation fails.
        """
        # Check if subdomain already exists
        existing_tenant = db.exec(
            select(Tenant).where(Tenant.subdomain == subdomain)
        ).first()
        if existing_tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subdomain already exists",
            )

        # Check if custom domain already exists
        if custom_domain:
            existing_domain = db.exec(
                select(Tenant).where(Tenant.custom_domain == custom_domain)
            ).first()
            if existing_domain:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Custom domain already exists",
                )

        try:
            # Create tenant
            # Replace hyphens with underscores for valid PostgreSQL schema names
            schema_name = f"tenant_{subdomain.replace('-', '_')}"
            tenant = Tenant(
                name=name,
                subdomain=subdomain,
                custom_domain=custom_domain,
                tier=tier,
                # Note: schema_name is derived from subdomain, not stored in database
                settings=settings or {},
                is_active=True,
            )

            db.add(tenant)
            db.commit()
            db.refresh(tenant)

            # Create tenant schema
            await self.create_tenant_schema(schema_name, db)

            # Invalidate any cached data for this domain
            if custom_domain:
                self._invalidate_tenant_cache(custom_domain)
            self._invalidate_tenant_cache(f"{subdomain}.petqr.com")

            return tenant

        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error creating tenant: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create tenant: database error",
            )
        except ValueError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

    def get_tenant_database_url(self, tenant: Tenant) -> str:
        """
        Get database URL with tenant schema for tenant.

        Args:
            tenant (Tenant): Tenant object.

        Returns:
            str: Database URL with schema.
        """
        schema_name = self.get_tenant_schema_name(tenant)

        # For Enterprise tier, they might have their own database
        if tenant.tier == TenantTier.ENTERPRISE and tenant.settings.get("dedicated_db"):
            # Return dedicated database URL if configured
            return tenant.settings.get("database_url", settings.DATABASE_URL)

        # For Standard tier, use shared database with schema isolation
        return settings.DATABASE_URL

    async def switch_tenant_context(self, db: Session, tenant: Tenant) -> None:
        """
        Switch database context to tenant schema.

        Args:
            db (Session): Database session.
            tenant (Tenant): Tenant to switch to.
        """
        try:
            schema_name = self.get_tenant_schema_name(tenant)
            # Set search path to tenant schema - quote to handle special characters
            db.exec(text(f'SET search_path TO "{schema_name}"'))
        except ProgrammingError as e:
            logger.error(f"SQL error switching tenant context: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to switch tenant context: invalid schema",
            )
        except SQLAlchemyError as e:
            logger.error(f"Database error switching tenant context: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to switch tenant context: database error",
            )

    def validate_tenant_access(
        self, tenant: Tenant, user_tenant_id: Optional[int]
    ) -> bool:
        """
        Validate if user has access to tenant.

        Args:
            tenant (Tenant): Tenant to access.
            user_tenant_id (Optional[int]): User's tenant ID.

        Returns:
            bool: True if access allowed.
        """
        if not tenant.is_active:
            return False

        # Super admins can access any tenant
        if user_tenant_id is None:
            return True

        # Tenant users can only access their own tenant
        return user_tenant_id == tenant.id


# Global tenant service instance
tenant_service = TenantService()
