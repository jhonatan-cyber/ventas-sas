-- Migración para sistema de sesiones empresarial robusto

-- Tabla de sesiones mejoradas
CREATE TABLE "enhanced_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "device_fingerprint" TEXT,
    "device_name" TEXT,
    "device_info" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "remember_me" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_refresh_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "invalidated_at" TIMESTAMP(3),
    "invalidation_reason" TEXT,
    "refresh_count" INTEGER NOT NULL DEFAULT 0,
    
    -- Relaciones
    CONSTRAINT "enhanced_sessions_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "usuarios_sas"("id") ON DELETE CASCADE,
    CONSTRAINT "enhanced_sessions_organization_id_fkey" 
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

-- Tabla de tokens invalidados (blacklist)
CREATE TABLE "invalidated_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "token_hash" TEXT NOT NULL UNIQUE,
    "invalidated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- Tabla de cambios de contraseña (para invalidar sesiones)
CREATE TABLE "password_changes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "system_type" TEXT NOT NULL, -- 'admin' | 'sas'
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invalidated_sessions" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "user_agent" TEXT
);

-- Tabla de intentos de refresh (para rate limiting)
CREATE TABLE "refresh_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id" TEXT,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL,
    "error_reason" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "refresh_attempts_session_id_fkey" 
        FOREIGN KEY ("session_id") REFERENCES "enhanced_sessions"("id") ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX "enhanced_sessions_user_id_idx" ON "enhanced_sessions"("user_id");
CREATE INDEX "enhanced_sessions_organization_id_idx" ON "enhanced_sessions"("organization_id");
CREATE INDEX "enhanced_sessions_active_idx" ON "enhanced_sessions"("is_active", "expires_at");
CREATE INDEX "enhanced_sessions_device_fingerprint_idx" ON "enhanced_sessions"("device_fingerprint");
CREATE INDEX "enhanced_sessions_last_activity_idx" ON "enhanced_sessions"("last_activity_at");

CREATE INDEX "invalidated_tokens_hash_idx" ON "invalidated_tokens"("token_hash");
CREATE INDEX "invalidated_tokens_expires_idx" ON "invalidated_tokens"("expires_at");

CREATE INDEX "password_changes_user_system_idx" ON "password_changes"("user_id", "system_type");
CREATE INDEX "password_changes_changed_at_idx" ON "password_changes"("changed_at");

CREATE INDEX "refresh_attempts_ip_attempted_idx" ON "refresh_attempts"("ip_address", "attempted_at");
CREATE INDEX "refresh_attempts_session_idx" ON "refresh_attempts"("session_id");

-- Función para limpiar automáticamente tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Limpiar tokens invalidados expirados
    DELETE FROM "invalidated_tokens" 
    WHERE "expires_at" < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Limpiar intentos de refresh antiguos (más de 7 días)
    DELETE FROM "refresh_attempts" 
    WHERE "attempted_at" < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- Marcar sesiones expiradas como inactivas
    UPDATE "enhanced_sessions" 
    SET "is_active" = false, 
        "invalidated_at" = CURRENT_TIMESTAMP,
        "invalidation_reason" = 'EXPIRED'
    WHERE "is_active" = true 
    AND ("expires_at" < CURRENT_TIMESTAMP 
         OR "last_activity_at" < CURRENT_TIMESTAMP - INTERVAL '30 minutes');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enhanced_sessions_updated_at 
    BEFORE UPDATE ON "enhanced_sessions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE "enhanced_sessions" IS 'Sesiones de usuario con tracking avanzado y gestión de dispositivos';
COMMENT ON TABLE "invalidated_tokens" IS 'Blacklist de tokens JWT invalidados para prevenir reutilización';
COMMENT ON TABLE "password_changes" IS 'Registro de cambios de contraseña para invalidar sesiones automáticamente';
COMMENT ON TABLE "refresh_attempts" IS 'Log de intentos de refresh para rate limiting y auditoría';

COMMENT ON COLUMN "enhanced_sessions"."device_fingerprint" IS 'Hash único del dispositivo para detección de robo de tokens';
COMMENT ON COLUMN "enhanced_sessions"."device_info" IS 'Información del dispositivo (browser, OS, etc.) en formato JSON';
COMMENT ON COLUMN "enhanced_sessions"."remember_me" IS 'Indica si la sesión debe durar más tiempo (1 año vs 30 días)';
COMMENT ON COLUMN "enhanced_sessions"."refresh_count" IS 'Número de veces que se ha refrescado esta sesión';
COMMENT ON COLUMN "invalidated_tokens"."token_hash" IS 'SHA-256 hash del token JWT invalidado';
COMMENT ON COLUMN "refresh_attempts"."success" IS 'Indica si el intento de refresh fue exitoso';