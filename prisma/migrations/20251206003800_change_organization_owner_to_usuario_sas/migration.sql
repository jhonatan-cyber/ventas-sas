-- DropForeignKey
ALTER TABLE "public"."system_organizations" DROP CONSTRAINT "system_organizations_owner_id_fkey";

-- Migrar datos: Para cada organización, asignar el primer UsuarioSas activo como owner
-- Si no hay UsuarioSas, crear uno temporal
DO $$
DECLARE
    org_record RECORD;
    first_usuario_sas_id UUID;
    temp_usuario_id UUID;
BEGIN
    FOR org_record IN SELECT id, slug, name FROM system_organizations
    LOOP
        -- Buscar el primer UsuarioSas activo de esta organización
        SELECT id INTO first_usuario_sas_id
        FROM sales_usuarios_sas
        WHERE organization_id = org_record.id
          AND is_active = true
          AND deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT 1;

        IF first_usuario_sas_id IS NOT NULL THEN
            -- Actualizar con el UsuarioSas existente
            UPDATE system_organizations
            SET owner_id = first_usuario_sas_id
            WHERE id = org_record.id;
            
            RAISE NOTICE 'Organización % (%): Owner actualizado a UsuarioSas existente', org_record.name, org_record.slug;
        ELSE
            -- No hay UsuarioSas, crear uno temporal
            INSERT INTO sales_usuarios_sas (
                id,
                ci,
                nombre,
                apellido,
                email,
                contrasena,
                organization_id,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                'TEMP-' || org_record.slug,
                'Administrador',
                'Principal',
                'admin@' || org_record.slug || '.local',
                '$2a$10$YourHashedPasswordHere', -- Password temporal
                org_record.id,
                true,
                NOW(),
                NOW()
            ) RETURNING id INTO temp_usuario_id;

            -- Actualizar con el nuevo UsuarioSas temporal
            UPDATE system_organizations
            SET owner_id = temp_usuario_id
            WHERE id = org_record.id;
            
            RAISE NOTICE 'Organización % (%): UsuarioSas temporal creado (email: admin@%.local)', org_record.name, org_record.slug, org_record.slug;
        END IF;
    END LOOP;
END $$;

-- AddForeignKey
ALTER TABLE "system_organizations" ADD CONSTRAINT "system_organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "sales_usuarios_sas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
