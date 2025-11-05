/**
 * Script de test de sécurité pour Blossom Café
 * Vérification des mesures de sécurité implémentées
 */

const fs = require('fs');
const path = require('path');

/**
 * Classe de test de sécurité
 */
class SecurityTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  /**
   * Ajouter un résultat de test
   */
  addResult(testName, status, message, details = null) {
    const result = {
      test: testName,
      status, // 'PASS', 'FAIL', 'WARN'
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.results.tests.push(result);
    
    switch (status) {
      case 'PASS':
        this.results.passed++;
        console.log(`✅ ${testName}: ${message}`);
        break;
      case 'FAIL':
        this.results.failed++;
        console.log(`❌ ${testName}: ${message}`);
        break;
      case 'WARN':
        this.results.warnings++;
        console.log(`⚠️ ${testName}: ${message}`);
        break;
    }
  }

  /**
   * Vérifier l'existence des fichiers de sécurité
   */
  testSecurityFiles() {
    const securityFiles = [
      'database/config.js',
      'database/security-middleware.js',
      'database/security-utils.js',
      'database/security-logger.js',
      'database/secure-upload.js',
      'src/services/secureAuthService.js',
      'src/components/security/SecureRoute.jsx',
      'src/components/security/SecureForm.jsx',
      '.gitignore',
      'SECURITY.md'
    ];

    securityFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addResult('Security File Exists', 'PASS', `File ${file} exists`);
      } else {
        this.addResult('Security File Missing', 'FAIL', `File ${file} is missing`);
      }
    });
  }

  /**
   * Vérifier la configuration de sécurité
   */
  testSecurityConfiguration() {
    try {
      const configPath = 'database/config.js';
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        
        // Vérifier les éléments de sécurité
        const securityChecks = [
          { pattern: /bcryptRounds:\s*\d+/, name: 'BCrypt rounds configured' },
          { pattern: /helmetEnabled/, name: 'Helmet security headers enabled' },
          { pattern: /rateLimit/, name: 'Rate limiting configured' },
          { pattern: /cors/, name: 'CORS configuration present' },
          { pattern: /jwt/, name: 'JWT configuration present' }
        ];

        securityChecks.forEach(check => {
          if (check.pattern.test(configContent)) {
            this.addResult('Security Config', 'PASS', check.name);
          } else {
            this.addResult('Security Config', 'FAIL', `${check.name} not found`);
          }
        });
      } else {
        this.addResult('Security Config', 'FAIL', 'Config file not found');
      }
    } catch (error) {
      this.addResult('Security Config', 'FAIL', `Error reading config: ${error.message}`);
    }
  }

  /**
   * Vérifier les middlewares de sécurité
   */
  testSecurityMiddlewares() {
    try {
      const middlewarePath = 'database/security-middleware.js';
      if (fs.existsSync(middlewarePath)) {
        const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
        
        const middlewareChecks = [
          { pattern: /helmet/, name: 'Helmet middleware' },
          { pattern: /rateLimit/, name: 'Rate limiting middleware' },
          { pattern: /authenticateToken/, name: 'Authentication middleware' },
          { pattern: /requireRole/, name: 'Role-based access control' },
          { pattern: /securityLogger/, name: 'Security logging middleware' },
          { pattern: /sanitizeResponse/, name: 'Response sanitization' }
        ];

        middlewareChecks.forEach(check => {
          if (check.pattern.test(middlewareContent)) {
            this.addResult('Security Middleware', 'PASS', check.name);
          } else {
            this.addResult('Security Middleware', 'FAIL', `${check.name} not found`);
          }
        });
      } else {
        this.addResult('Security Middleware', 'FAIL', 'Middleware file not found');
      }
    } catch (error) {
      this.addResult('Security Middleware', 'FAIL', `Error reading middleware: ${error.message}`);
    }
  }

  /**
   * Vérifier les utilitaires de sécurité
   */
  testSecurityUtils() {
    try {
      const utilsPath = 'database/security-utils.js';
      if (fs.existsSync(utilsPath)) {
        const utilsContent = fs.readFileSync(utilsPath, 'utf8');
        
        const utilsChecks = [
          { pattern: /PasswordSecurity/, name: 'Password security class' },
          { pattern: /TokenSecurity/, name: 'Token security class' },
          { pattern: /DataSecurity/, name: 'Data sanitization class' },
          { pattern: /SessionSecurity/, name: 'Session security class' },
          { pattern: /bcrypt\.hash/, name: 'Password hashing with bcrypt' },
          { pattern: /jwt\.sign/, name: 'JWT token generation' }
        ];

        utilsChecks.forEach(check => {
          if (check.pattern.test(utilsContent)) {
            this.addResult('Security Utils', 'PASS', check.name);
          } else {
            this.addResult('Security Utils', 'FAIL', `${check.name} not found`);
          }
        });
      } else {
        this.addResult('Security Utils', 'FAIL', 'Utils file not found');
      }
    } catch (error) {
      this.addResult('Security Utils', 'FAIL', `Error reading utils: ${error.message}`);
    }
  }

  /**
   * Vérifier le système de logging
   */
  testSecurityLogging() {
    try {
      const loggerPath = 'database/security-logger.js';
      if (fs.existsSync(loggerPath)) {
        const loggerContent = fs.readFileSync(loggerPath, 'utf8');
        
        const loggingChecks = [
          { pattern: /logAuth/, name: 'Authentication logging' },
          { pattern: /logAccess/, name: 'Access logging' },
          { pattern: /logSecurityError/, name: 'Security error logging' },
          { pattern: /logSecurityAlert/, name: 'Security alert system' },
          { pattern: /logSuspiciousActivity/, name: 'Suspicious activity detection' },
          { pattern: /analyzeLogs/, name: 'Log analysis functionality' }
        ];

        loggingChecks.forEach(check => {
          if (check.pattern.test(loggerContent)) {
            this.addResult('Security Logging', 'PASS', check.name);
          } else {
            this.addResult('Security Logging', 'FAIL', `${check.name} not found`);
          }
        });
      } else {
        this.addResult('Security Logging', 'FAIL', 'Logger file not found');
      }
    } catch (error) {
      this.addResult('Security Logging', 'FAIL', `Error reading logger: ${error.message}`);
    }
  }

  /**
   * Vérifier la sécurité des uploads
   */
  testUploadSecurity() {
    try {
      const uploadPath = 'database/secure-upload.js';
      if (fs.existsSync(uploadPath)) {
        const uploadContent = fs.readFileSync(uploadPath, 'utf8');
        
        const uploadChecks = [
          { pattern: /isImageFile/, name: 'File type validation' },
          { pattern: /validateFileSignature/, name: 'File signature validation' },
          { pattern: /scanFileContent/, name: 'Malicious content scanning' },
          { pattern: /multer/, name: 'Multer configuration' },
          { pattern: /fileFilter/, name: 'File filtering' },
          { pattern: /preventDoS/, name: 'DoS prevention' }
        ];

        uploadChecks.forEach(check => {
          if (check.pattern.test(uploadContent)) {
            this.addResult('Upload Security', 'PASS', check.name);
          } else {
            this.addResult('Upload Security', 'FAIL', `${check.name} not found`);
          }
        });
      } else {
        this.addResult('Upload Security', 'FAIL', 'Upload security file not found');
      }
    } catch (error) {
      this.addResult('Upload Security', 'FAIL', `Error reading upload security: ${error.message}`);
    }
  }

  /**
   * Vérifier la sécurité du frontend
   */
  testFrontendSecurity() {
    try {
      const authServicePath = 'src/services/secureAuthService.js';
      if (fs.existsSync(authServicePath)) {
        const authContent = fs.readFileSync(authServicePath, 'utf8');
        
        const frontendChecks = [
          { pattern: /sessionStorage/, name: 'Secure token storage' },
          { pattern: /InputValidator/, name: 'Input validation' },
          { pattern: /XSSProtection/, name: 'XSS protection' },
          { pattern: /sanitizeString/, name: 'String sanitization' },
          { pattern: /validateEmail/, name: 'Email validation' },
          { pattern: /validatePassword/, name: 'Password validation' }
        ];

        frontendChecks.forEach(check => {
          if (check.pattern.test(authContent)) {
            this.addResult('Frontend Security', 'PASS', check.name);
          } else {
            this.addResult('Frontend Security', 'FAIL', `${check.name} not found`);
          }
        });
      } else {
        this.addResult('Frontend Security', 'FAIL', 'Secure auth service not found');
      }
    } catch (error) {
      this.addResult('Frontend Security', 'FAIL', `Error reading frontend security: ${error.message}`);
    }
  }

  /**
   * Vérifier le .gitignore
   */
  testGitignore() {
    try {
      if (fs.existsSync('.gitignore')) {
        const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
        
        const gitignoreChecks = [
          { pattern: /\.env/, name: 'Environment files ignored' },
          { pattern: /logs/, name: 'Log files ignored' },
          { pattern: /uploads/, name: 'Upload directories ignored' },
          { pattern: /\*\.key/, name: 'Key files ignored' },
          { pattern: /\*\.pem/, name: 'Certificate files ignored' }
        ];

        gitignoreChecks.forEach(check => {
          if (check.pattern.test(gitignoreContent)) {
            this.addResult('Gitignore Security', 'PASS', check.name);
          } else {
            this.addResult('Gitignore Security', 'WARN', `${check.name} not found`);
          }
        });
      } else {
        this.addResult('Gitignore Security', 'FAIL', '.gitignore file not found');
      }
    } catch (error) {
      this.addResult('Gitignore Security', 'FAIL', `Error reading .gitignore: ${error.message}`);
    }
  }

  /**
   * Vérifier les dépendances de sécurité
   */
  testSecurityDependencies() {
    try {
      if (fs.existsSync('package.json')) {
        const packageContent = fs.readFileSync('package.json', 'utf8');
        const packageJson = JSON.parse(packageContent);
        
        const securityDeps = [
          'helmet',
          'express-rate-limit',
          'express-validator',
          'bcryptjs',
          'jsonwebtoken',
          'cookie-parser',
          'express-session'
        ];

        securityDeps.forEach(dep => {
          if (packageJson.dependencies && packageJson.dependencies[dep]) {
            this.addResult('Security Dependencies', 'PASS', `${dep} dependency installed`);
          } else {
            this.addResult('Security Dependencies', 'FAIL', `${dep} dependency missing`);
          }
        });
      } else {
        this.addResult('Security Dependencies', 'FAIL', 'package.json not found');
      }
    } catch (error) {
      this.addResult('Security Dependencies', 'FAIL', `Error reading package.json: ${error.message}`);
    }
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests() {
    console.log('🔐 Starting Security Tests for Blossom Café...\n');
    
    this.testSecurityFiles();
    this.testSecurityConfiguration();
    this.testSecurityMiddlewares();
    this.testSecurityUtils();
    this.testSecurityLogging();
    this.testUploadSecurity();
    this.testFrontendSecurity();
    this.testGitignore();
    this.testSecurityDependencies();
    
    this.generateReport();
  }

  /**
   * Générer le rapport final
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 RAPPORT DE SÉCURITÉ - BLOSSOM CAFÉ');
    console.log('='.repeat(60));
    
    console.log(`\n📊 RÉSULTATS:`);
    console.log(`   ✅ Tests réussis: ${this.results.passed}`);
    console.log(`   ❌ Tests échoués: ${this.results.failed}`);
    console.log(`   ⚠️ Avertissements: ${this.results.warnings}`);
    console.log(`   📈 Score de sécurité: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
    
    if (this.results.failed > 0) {
      console.log(`\n❌ TESTS ÉCHOUÉS:`);
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`   • ${test.test}: ${test.message}`);
        });
    }
    
    if (this.results.warnings > 0) {
      console.log(`\n⚠️ AVERTISSEMENTS:`);
      this.results.tests
        .filter(test => test.status === 'WARN')
        .forEach(test => {
          console.log(`   • ${test.test}: ${test.message}`);
        });
    }
    
    console.log(`\n🎯 RECOMMANDATIONS:`);
    if (this.results.failed === 0) {
      console.log(`   ✅ Excellent! Toutes les mesures de sécurité sont en place.`);
      console.log(`   🚀 L'application est prête pour la production.`);
    } else {
      console.log(`   🔧 Corriger les tests échoués avant le déploiement.`);
      console.log(`   📚 Consulter SECURITY.md pour plus de détails.`);
    }
    
    console.log(`\n📝 Pour plus d'informations, consultez SECURITY.md`);
    console.log('='.repeat(60));
    
    // Sauvegarder le rapport
    const reportPath = 'security-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Rapport sauvegardé dans: ${reportPath}`);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  const tester = new SecurityTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SecurityTester;
