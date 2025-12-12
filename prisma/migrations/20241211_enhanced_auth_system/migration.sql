-- CreateTable: Sistema de Autenticación Empresarial
-- Migración para implementar tokens duales, sesiones mejoradas y seguridad avanzada

-- Tabla de sesiones mejoradas
CREATE TABLE "enhanced_sessions" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "enhanced_sessions_pkey" PRIMARY KEY ("id")
);

-- Tabla de tokens invalidados (blacklist)
CREATE TABLE "invalidated_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invalidated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),

    CONSTRAINT "invalidated_tokens_pkey" PRIMARY KEY ("id")
);

-- Tabla de cambios de contraseña (para invalidar sesiones)
CREATE TABLE "password_change_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "system_type" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invalidated_sessions" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "password_change_logs_pkey" PRIMARY KEY ("id")
);

-- Tabla de intentos de refresh (para rate limiting y auditoría)
CREATE TABLE "refresh_attempts" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL,
    "error_reason" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_attempts_pkey" PRIMARY KEY ("id")
);

-- Índices para performance óptima
CREATE INDEX "enhanced_sessions_user_id_idx" ON "enhanced_sessions"("user_id");
CREATE INDEX "enhanced_sessions_organization_id_idx" ON "enhanced_sessions"("organization_id");
CREATE INDEX "enhanced_sessions_is_active_expires_at_idx" ON "enhanced_sessions"("is_active", "expires_at");
CREATE INDEX "enhanced_sessions_device_fingerprint_idx" ON "enhanced_sessions"("device_fingerprint");
CREATE INDEX "enhanced_sessions_last_activity_at_idx" ON "enhanced_sessions"("last_activity_at");
CREATE INDEX "enhanced_sessions_user_id_organization_id_is_active_idx" ON "enhanced_sessions"("user_id", "organization_id", "is_active");

CREATE UNIQUE INDEX "invalidated_tokens_token_hash_key" ON "invalidated_tokens"("token_hash");
CREATE INDEX "invalidated_tokens_expires_at_idx" ON "invalidated_tokens"("expires_at");

CREATE INDEX "password_change_logs_user_id_system_type_idx" ON "password_change_logs"("user_id", "system_type");
CREATE INDEX "password_change_logs_changed_at_idx" ON "password_change_logs"("changed_at");

CREATE INDEX "refresh_attempts_ip_address_attempted_at_idx" ON "refresh_attempts"("ip_address", "attempted_at");
CREATE INDEX "refresh_attempts_session_id_idx" ON "refresh_attempts"("session_id");
CREATE INDEX "refresh_attempts_success_attempted_at_idx" ON "refresh_attempts"("success", "attempted_at");

-- Relaciones de clave foránea
ALTER TABLE "enhanced_sessions" ADD CONSTRAINT "enhanced_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sales_usuarios_sas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enhanced_sessions" ADD CONSTRAINT "enhanced_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_attempts" ADD CONSTRAINT "refresh_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "enhanced_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
COMMENT ON TABLE "enhanced_sessions" IS 'Sesiones de usuario con tracking avanzado y gestión de dispositivos para el sistema empresarial';
COMMENT ON TABLE "invalidated_tokens" IS 'Blacklist de tokens JWT invalidados para prevenir reutilización y ataques de replay';
COMMENT ON TABLE "password_change_logs" IS 'Registro de cambios de contraseña para invalidar sesiones automáticamente por seguridad';
COMMENT ON TABLE "refresh_attempts" IS 'Log de intentos de refresh para rate limiting, auditoría y detección de ataques';

COMMENT ON COLUMN "enhanced_sessions"."device_fingerprint" IS 'Hash único del dispositivo para detección de robo de tokens y sesiones sospechosas';
COMMENT ON COLUMN "enhanced_sessions"."device_info" IS 'Información del dispositivo (browser, OS, etc.) en formato JSON para análisis';
COMMENT ON COLUMN "enhanced_sessions"."remember_me" IS 'Indica si la sesión debe durar más tiempo (1 año vs 30 días)';
COMMENT ON COLUMN "enhanced_sessions"."refresh_count" IS 'Número de veces que se ha refrescado esta sesión para detectar uso anómalo';
COMMENT ON COLUMN "invalidated_tokens"."token_hash" IS 'SHA-256 hash del token JWT invalidado para búsqueda eficiente';
COMMENT ON COLUMN "refresh_attempts"."success" IS 'Indica si el intento de refresh fue exitoso para análisis de patrones';

-- Insertar configuración inicial del sistema
INSERT INTO "system_configs" ("key", "value", "description", "category", "is_editable") VALUES
('enhanced_auth_enabled', 'true', 'Habilitar sistema de autenticación empresarial', 'security', true),
('max_concurrent_sessions', '5', 'Máximo número de sesiones concurrentes por usuario', 'security', true),
('session_inactivity_timeout', '1800', 'Timeout de inactividad en segundos (30 minutos)', 'security', true),
('access_token_duration', '900', 'Duración del access token en segundos (15 minutos)', 'security', true),
('refresh_token_duration', '2592000', 'Duración del refresh token en segundos (30 días)', 'security', true),
('remember_me_duration', '31536000', 'Duración del remember me en segundos (1 año)', 'security', true),
('enable_device_fingerprinting', 'true', 'Habilitar detección de dispositivos', 'security', true),
('enable_session_rotation', 'true', 'Habilitar rotación de refresh tokens', 'security', true),
('refresh_rate_limit', '10', 'Límite de refresh por minuto', 'security', true),
('auto_cleanup_enabled', 'true', 'Habilitar limpieza automática de sesiones', 'maintenance', true)
ON CONFLICT ("key") DO NOTHING;