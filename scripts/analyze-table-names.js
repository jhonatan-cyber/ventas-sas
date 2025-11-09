const fs = require('fs')
const path = require('path')

// Leer el schema
const schemaPath = path.join(__dirname, '../prisma/schema.prisma')
const schema = fs.readFileSync(schemaPath, 'utf8')

// Extraer todos los modelos y sus @@map
const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\s*@@map\("([^"]+)"\)/g
const models = []
let match

while ((match = modelRegex.exec(schema)) !== null) {
  const modelName = match[1]
  const tableName = match[3]
  models.push({ modelName, tableName })
}

console.log('\n=== Análisis de Nomenclatura de Tablas ===\n')

// Separar tablas del sistema admin y SAS
const systemTables = []
const salesTables = []
const otherTables = []

models.forEach(({ modelName, tableName }) => {
  if (tableName.startsWith('system_')) {
    systemTables.push({ modelName, tableName, current: 'system_', correct: true })
  } else if (tableName.startsWith('sales_')) {
    salesTables.push({ modelName, tableName, current: 'sales_', correct: true })
  } else {
    // Determinar a qué sistema pertenece
    const isSystemAdmin = 
      modelName === 'Profile' ||
      modelName === 'Organization' ||
      modelName === 'SubscriptionPlan' ||
      modelName === 'Subscription' ||
      modelName === 'Role' ||
      modelName.includes('Security') ||
      modelName.includes('JWT') ||
      modelName.includes('Session') ||
      modelName.includes('PasswordChange') ||
      modelName.includes('Notification') ||
      modelName.includes('Config') ||
      modelName.includes('Backup') ||
      modelName.includes('Email') ||
      modelName.includes('Alert') ||
      modelName.includes('Integration') ||
      modelName.includes('Invoice') ||
      modelName.includes('Payment') ||
      modelName.includes('Support') ||
      modelName.includes('Ticket') ||
      modelName.includes('WhiteLabel') ||
      modelName.includes('Cms') ||
      modelName.includes('Feedback') ||
      modelName.includes('Version') ||
      modelName.includes('AbTest') ||
      modelName.includes('CustomDomain')
    
    if (isSystemAdmin) {
      systemTables.push({ modelName, tableName, current: 'none', correct: false, needs: 'system_' })
    } else {
      otherTables.push({ modelName, tableName })
    }
  }
})

console.log('📊 TABLAS DEL SISTEMA DE ADMINISTRACIÓN (system_*):')
console.log(`   Total: ${systemTables.length}`)
systemTables.forEach(({ modelName, tableName, correct, needs }) => {
  if (correct) {
    console.log(`   ✅ ${modelName} → ${tableName}`)
  } else {
    console.log(`   ⚠️  ${modelName} → ${tableName} (necesita: ${needs}${tableName})`)
  }
})

console.log('\n📊 TABLAS DEL SISTEMA SAS (sales_*):')
console.log(`   Total: ${salesTables.length}`)
salesTables.forEach(({ modelName, tableName }) => {
  console.log(`   ✅ ${modelName} → ${tableName}`)
})

if (otherTables.length > 0) {
  console.log('\n❓ TABLAS SIN CLASIFICAR:')
  otherTables.forEach(({ modelName, tableName }) => {
    console.log(`   ❓ ${modelName} → ${tableName}`)
  })
}

console.log('\n=== Fin del análisis ===\n')

