const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Mapeo de tablas antiguas a nuevas con prefijos
const tableRenames = {
  // Sistema de Administración - ya tienen system_ pero verificamos
  'users_system': 'system_users', // Ya renombrada anteriormente
  'organizations': 'system_organizations',
  'subscription_plans': 'system_subscription_plans',
  'subscriptions': 'system_subscriptions',
  'roles': 'system_roles',
  'security_logs': 'system_security_logs',
  'jwt_secrets': 'system_jwt_secrets',
  'user_sessions': 'system_user_sessions',
  'password_changes': 'system_password_changes',
  'notifications': 'system_notifications',
  'admin_system_configs': 'system_configs',
  'admin_system_config_history': 'system_config_history',
  'admin_backups': 'system_backups',
  'admin_email_configs': 'system_email_configs',
  'admin_alert_configs': 'system_alert_configs',
  'admin_integration_configs': 'system_integration_configs',
  'invoices': 'system_invoices',
  'payments': 'system_payments',
  'payment_methods': 'system_payment_methods',
  'support_tickets': 'system_support_tickets',
  'ticket_comments': 'system_ticket_comments',
  'ticket_attachments': 'system_ticket_attachments',
  'ticket_history': 'system_ticket_history',
  'white_label_branding': 'system_white_label_branding',
  'cms_pages': 'system_cms_pages',
  'cms_blog_posts': 'system_cms_blog_posts',
  'user_feedback': 'system_user_feedback',
  'feedback_votes': 'system_feedback_votes',
  'system_versions': 'system_versions',
  'version_notifications': 'system_version_notifications',
  'ab_tests': 'system_ab_tests',
  'ab_test_variants': 'system_ab_test_variants',
  'ab_test_participants': 'system_ab_test_participants',
  'ab_test_events': 'system_ab_test_events',
  'custom_domains': 'system_custom_domains',
  'custom_domain_dns_records': 'system_custom_domain_dns_records',
  'integrations': 'system_integrations',
  'organization_integrations': 'system_organization_integrations',
  'integration_events': 'system_integration_events',
}

async function renameAllTables() {
  try {
    console.log('\n=== Renombrando todas las tablas ===\n')
    
    // Verificar qué tablas existen en la base de datos
    const existingTables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    
    console.log(`📊 Tablas encontradas en la base de datos: ${existingTables.length}\n`)
    
    let renamed = 0
    let skipped = 0
    let errors = 0
    
    // Renombrar cada tabla
    for (const [oldName, newName] of Object.entries(tableRenames)) {
      // Verificar si la tabla existe
      const tableExists = existingTables.some(t => t.table_name === oldName)
      const newTableExists = existingTables.some(t => t.table_name === newName)
      
      if (newTableExists) {
        console.log(`⏭️  ${oldName} → ${newName} (ya existe con el nombre correcto)`)
        skipped++
        continue
      }
      
      if (!tableExists) {
        console.log(`⚠️  ${oldName} → ${newName} (tabla no existe)`)
        skipped++
        continue
      }
      
      try {
        console.log(`🔄 Renombrando ${oldName} → ${newName}...`)
        await prisma.$executeRawUnsafe(`ALTER TABLE ${oldName} RENAME TO ${newName}`)
        console.log(`   ✅ Renombrada exitosamente`)
        renamed++
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
        errors++
      }
    }
    
    console.log(`\n📊 Resumen:`)
    console.log(`   ✅ Renombradas: ${renamed}`)
    console.log(`   ⏭️  Omitidas: ${skipped}`)
    console.log(`   ❌ Errores: ${errors}`)
    
    // Verificación final
    console.log(`\n🔍 Verificación final de tablas:`)
    const finalTables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    
    const systemTables = finalTables.filter(t => t.table_name.startsWith('system_'))
    const salesTables = finalTables.filter(t => t.table_name.startsWith('sales_'))
    const otherTables = finalTables.filter(t => 
      !t.table_name.startsWith('system_') && !t.table_name.startsWith('sales_')
    )
    
    console.log(`   📦 Tablas system_*: ${systemTables.length}`)
    console.log(`   📦 Tablas sales_*: ${salesTables.length}`)
    if (otherTables.length > 0) {
      console.log(`   ⚠️  Tablas sin prefijo: ${otherTables.length}`)
      otherTables.forEach(t => {
        console.log(`      - ${t.table_name}`)
      })
    }
    
    console.log('\n=== Proceso completado ===\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

renameAllTables()
