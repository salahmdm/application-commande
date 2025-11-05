/**
 * Script d'audit complet de la base de données
 * Analyse toutes les tables et leur utilisation dans le code
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe'
};

async function getTables() {
  const pool = mysql.createPool(config);
  const [tables] = await pool.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);
  await pool.end();
  return tableNames;
}

async function getTableStructure(tableName) {
  const pool = mysql.createPool(config);
  const [columns] = await pool.query(`DESCRIBE ${tableName}`);
  const [rowCount] = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  await pool.end();
  return {
    columns: columns,
    rowCount: rowCount[0].count
  };
}

function searchTableInCode(tableName, codebasePath = '../database') {
  const adminApiPath = path.join(__dirname, 'admin-api.js');
  const adminApiContent = fs.readFileSync(adminApiPath, 'utf8');
  
  const patterns = [
    new RegExp(`FROM\\s+${tableName}\\s`, 'gi'),
    new RegExp(`INTO\\s+${tableName}\\s`, 'gi'),
    new RegExp(`UPDATE\\s+${tableName}\\s`, 'gi'),
    new RegExp(`DELETE\\s+FROM\\s+${tableName}\\s`, 'gi'),
    new RegExp(`JOIN\\s+${tableName}\\s`, 'gi'),
    new RegExp(`LEFT JOIN\\s+${tableName}\\s`, 'gi'),
    new RegExp(`RIGHT JOIN\\s+${tableName}\\s`, 'gi'),
    new RegExp(`\`${tableName}\``, 'gi'),
    new RegExp(`'${tableName}'`, 'gi'),
    new RegExp(`"${tableName}"`, 'gi'),
  ];
  
  const matches = [];
  patterns.forEach((pattern, index) => {
    const found = adminApiContent.match(pattern);
    if (found) {
      matches.push(...found);
    }
  });
  
  return {
    found: matches.length > 0,
    occurrences: matches.length,
    lines: matches.length > 0 ? findTableLines(tableName, adminApiContent) : []
  };
}

function findTableLines(tableName, content) {
  const lines = content.split('\n');
  const relevantLines = [];
  
  lines.forEach((line, index) => {
    if (line.includes(tableName)) {
      relevantLines.push({
        line: index + 1,
        content: line.trim().substring(0, 100)
      });
    }
  });
  
  return relevantLines.slice(0, 10); // Limiter à 10 premières occurrences
}

async function main() {
  console.log('========================================');
  console.log('🔍 AUDIT COMPLET DE LA BASE DE DONNÉES');
  console.log('========================================\n');
  
  try {
    // 1. Lister toutes les tables
    console.log('📋 Étape 1: Récupération de toutes les tables...\n');
    const tables = await getTables();
    console.log(`✅ ${tables.length} tables trouvées:\n`);
    
    // 2. Analyser chaque table
    const analysis = [];
    
    for (const tableName of tables) {
      console.log(`🔍 Analyse de la table: ${tableName}`);
      const structure = await getTableStructure(tableName);
      const codeUsage = searchTableInCode(tableName);
      
      analysis.push({
        name: tableName,
        rowCount: structure.rowCount,
        columns: structure.columns.length,
        usedInCode: codeUsage.found,
        occurrences: codeUsage.occurrences,
        sampleLines: codeUsage.lines
      });
      
      console.log(`   - Lignes: ${structure.rowCount}`);
      console.log(`   - Colonnes: ${structure.columns.length}`);
      console.log(`   - Utilisée dans le code: ${codeUsage.found ? '✅ OUI' : '❌ NON'} (${codeUsage.occurrences} occurrences)`);
      console.log('');
    }
    
    // 3. Générer le rapport
    console.log('\n========================================');
    console.log('📊 RAPPORT D\'ANALYSE');
    console.log('========================================\n');
    
    const usedTables = analysis.filter(t => t.usedInCode);
    const unusedTables = analysis.filter(t => !t.usedInCode);
    
    console.log(`✅ Tables utilisées: ${usedTables.length}`);
    usedTables.forEach(t => {
      console.log(`   - ${t.name} (${t.rowCount} lignes, ${t.occurrences} occurrences)`);
    });
    
    console.log(`\n❌ Tables NON utilisées: ${unusedTables.length}`);
    if (unusedTables.length > 0) {
      unusedTables.forEach(t => {
        console.log(`   - ${t.name} (${t.rowCount} lignes)`);
      });
    }
    
    // 4. Sauvegarder le rapport
    const report = {
      generatedAt: new Date().toISOString(),
      totalTables: tables.length,
      usedTables: usedTables.length,
      unusedTables: unusedTables.length,
      details: analysis
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'audit-report.json'),
      JSON.stringify(report, null, 2),
      'utf8'
    );
    
    console.log('\n✅ Rapport sauvegardé dans: database/audit-report.json');
    console.log('\n========================================\n');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'audit:', error);
    process.exit(1);
  }
}

main();

