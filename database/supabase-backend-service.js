/**
 * Service Supabase pour le backend Node.js
 * Remplace le pool MySQL par Supabase
 * Utilise CommonJS pour compatibilité avec admin-api.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');

// Charger .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Configuration Supabase
// ✅ VERCEL: Support des variables NEXT_PUBLIC_* pour compatibilité Vercel
const supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    'https://crkpunuoliiqyuxtgqlr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    process.env.SUPABASE_KEY ||
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0';

// Créer le client Supabase avec service role key pour bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

logger.log('✅ Service Supabase backend initialisé');

/**
 * Service Supabase pour remplacer les appels MySQL
 */
class SupabaseBackendService {
  constructor() {
    this.client = supabase;
  }

  /**
   * Obtenir le client Supabase
   */
  getClient() {
    return this.client;
  }

  /**
   * Exécuter une requête SQL (compatibilité avec mysql2)
   * ⚠️ Support limité - parse les requêtes SQL simples
   * Remplace: pool.query('SELECT ...', [params])
   */
  async query(sql, params = []) {
    try {
      // Parser SQL simple pour compatibilité
      const sqlUpper = sql.trim().toUpperCase();
      
      // SELECT simple
      if (sqlUpper.startsWith('SELECT')) {
        // Détecter SELECT COUNT(*)
        if (sqlUpper.includes('COUNT(*)')) {
          const tableMatch = sql.match(/FROM\s+`?(\w+)`?/i);
          if (tableMatch) {
            const table = tableMatch[1];
            const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
            const where = {};
            if (whereMatch && params.length > 0) {
              // Parser simple WHERE column = ?
              const whereClause = whereMatch[1];
              const columnMatch = whereClause.match(/(\w+)\s*=\s*\?/i);
              if (columnMatch && params[0] !== undefined) {
                where[columnMatch[1]] = params[0];
              }
            }
            const [result] = await this.count(table, where);
            // Retourner le format MySQL: [[{ count: ... }]]
            const aliasMatch = sql.match(/AS\s+(\w+)/i);
            const alias = aliasMatch ? aliasMatch[1] : 'count';
            return [[{ [alias]: result.count }]];
          }
        }
        
        // SELECT * FROM table WHERE ...
        const tableMatch = sql.match(/FROM\s+`?(\w+)`?/i);
        if (tableMatch) {
          const table = tableMatch[1];
          const options = { select: '*' };
          
          // Parser WHERE
          const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
          if (whereMatch && params.length > 0) {
            const whereClause = whereMatch[1];
            const columnMatch = whereClause.match(/(\w+)\s*=\s*\?/i);
            if (columnMatch) {
              options.where = { [columnMatch[1]]: params[0] };
            }
          }
          
          // Parser ORDER BY
          const orderMatch = sql.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/i);
          if (orderMatch) {
            options.orderBy = [orderMatch[1].trim()];
          }
          
          // Parser LIMIT
          const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
          if (limitMatch) {
            options.limit = parseInt(limitMatch[1]);
          }
          
          return await this.select(table, options);
        }
      }
      
      // INSERT
      if (sqlUpper.startsWith('INSERT')) {
        const tableMatch = sql.match(/INTO\s+`?(\w+)`?/i);
        if (tableMatch) {
          const table = tableMatch[1];
          const columnsMatch = sql.match(/\(([^)]+)\)/);
          if (columnsMatch && params.length > 0) {
            const columns = columnsMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
            const data = {};
            columns.forEach((col, i) => {
              if (params[i] !== undefined) {
                data[col] = params[i];
              }
            });
            const result = await this.insert(table, data);
            // Retourner le format MySQL avec insertId
            return [{ insertId: result[0]?.id || null, ...result[0] }];
          }
        }
      }
      
      // UPDATE
      if (sqlUpper.startsWith('UPDATE')) {
        const tableMatch = sql.match(/UPDATE\s+`?(\w+)`?/i);
        if (tableMatch) {
          const table = tableMatch[1];
          const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|$)/i);
          const whereMatch = sql.match(/WHERE\s+(.+?)$/i);
          
          if (setMatch) {
            const updates = {};
            const setClause = setMatch[1];
            const setParts = setClause.split(',').map(s => s.trim());
            let paramIndex = 0;
            
            setParts.forEach(part => {
              const colMatch = part.match(/(\w+)\s*=\s*\?/);
              if (colMatch && params[paramIndex] !== undefined) {
                updates[colMatch[1]] = params[paramIndex];
                paramIndex++;
              }
            });
            
            const where = {};
            if (whereMatch) {
              const whereClause = whereMatch[1];
              const whereColMatch = whereClause.match(/(\w+)\s*=\s*\?/);
              if (whereColMatch && params[paramIndex] !== undefined) {
                where[whereColMatch[1]] = params[paramIndex];
              }
            }
            
            return await this.update(table, where, updates);
          }
        }
      }
      
      // DELETE
      if (sqlUpper.startsWith('DELETE')) {
        const tableMatch = sql.match(/FROM\s+`?(\w+)`?/i);
        if (tableMatch) {
          const table = tableMatch[1];
          const whereMatch = sql.match(/WHERE\s+(.+?)$/i);
          const where = {};
          
          if (whereMatch && params.length > 0) {
            const whereClause = whereMatch[1];
            const whereColMatch = whereClause.match(/(\w+)\s*=\s*\?/);
            if (whereColMatch) {
              where[whereColMatch[1]] = params[0];
            }
          }
          
          return await this.delete(table, where);
        }
      }
      
      // Si on ne peut pas parser, logger et lancer une erreur
      logger.warn('⚠️ Requête SQL non supportée par le parser automatique:', sql.substring(0, 100));
      throw new Error(`Requête SQL non supportée. Utilisez les méthodes spécifiques (select, insert, update, delete) au lieu de query(). SQL: ${sql.substring(0, 50)}...`);
    } catch (error) {
      logger.error('❌ Supabase query error:', error.message);
      throw error;
    }
  }

  /**
   * SELECT avec conditions
   * Remplace: pool.query('SELECT * FROM table WHERE ...')
   */
  async select(table, options = {}) {
    try {
      let query = this.client.from(table).select(options.select || '*');

      // Appliquer les filtres
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value.operator) {
            // Support pour opérateurs: { operator: '>', value: 10 }
            switch (value.operator) {
              case '>':
                query = query.gt(key, value.value);
                break;
              case '>=':
                query = query.gte(key, value.value);
                break;
              case '<':
                query = query.lt(key, value.value);
                break;
              case '<=':
                query = query.lte(key, value.value);
                break;
              case '!=':
              case '<>':
                query = query.neq(key, value.value);
                break;
              case 'like':
                query = query.like(key, value.value);
                break;
              case 'ilike':
                query = query.ilike(key, value.value);
                break;
              default:
                query = query.eq(key, value.value);
            }
          } else {
            query = query.eq(key, value);
          }
        }
      }

      // ORDER BY
      if (options.orderBy) {
        const orderBy = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
        for (const order of orderBy) {
          const [column, direction = 'asc'] = order.split(' ');
          query = query.order(column, { ascending: direction.toLowerCase() !== 'desc' });
        }
      }

      // LIMIT
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // OFFSET
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return [data]; // Format compatible avec mysql2 [rows]
    } catch (error) {
      logger.error(`❌ Supabase select error (${table}):`, error.message);
      throw error;
    }
  }

  /**
   * SELECT avec une seule ligne
   * Remplace: pool.query('SELECT * FROM table WHERE id = ?', [id])
   */
  async selectOne(table, where) {
    try {
      let query = this.client.from(table).select('*');

      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return [[data]]; // Format compatible avec mysql2 [[row]]
    } catch (error) {
      logger.error(`❌ Supabase selectOne error (${table}):`, error.message);
      throw error;
    }
  }

  /**
   * INSERT
   * Remplace: pool.query('INSERT INTO table ...')
   */
  async insert(table, data) {
    try {
      const { data: insertedData, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      if (error) throw error;
      return [insertedData]; // Format compatible avec mysql2 [rows]
    } catch (error) {
      logger.error(`❌ Supabase insert error (${table}):`, error.message);
      throw error;
    }
  }

  /**
   * UPDATE
   * Remplace: pool.query('UPDATE table SET ... WHERE ...')
   */
  async update(table, where, updates) {
    try {
      let query = this.client.from(table).update(updates);

      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }

      const { data, error } = await query.select();

      if (error) throw error;
      return [data]; // Format compatible avec mysql2 [rows]
    } catch (error) {
      logger.error(`❌ Supabase update error (${table}):`, error.message);
      throw error;
    }
  }

  /**
   * DELETE
   * Remplace: pool.query('DELETE FROM table WHERE ...')
   */
  async delete(table, where) {
    try {
      let query = this.client.from(table).delete();

      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }

      const { data, error } = await query.select();

      if (error) throw error;
      return [data]; // Format compatible avec mysql2 [rows]
    } catch (error) {
      logger.error(`❌ Supabase delete error (${table}):`, error.message);
      throw error;
    }
  }

  /**
   * Exécuter une requête SQL brute (pour compatibilité)
   * ⚠️ Supabase ne supporte pas SQL brut, cette méthode est limitée
   */
  async execute(sql, params = []) {
    logger.warn('⚠️ execute() appelé - Supabase ne supporte pas SQL brut, utilisez les méthodes spécifiques');
    throw new Error('Supabase ne supporte pas SQL brut. Utilisez select(), insert(), update(), delete()');
  }

  /**
   * Test de connexion
   * Remplace: pool.query('SELECT 1 AS ok')
   */
  async ping() {
    try {
      const { data, error } = await this.client.from('users').select('id').limit(1);
      if (error) throw error;
      return [{ ok: 1 }];
    } catch (error) {
      logger.error('❌ Supabase ping error:', error.message);
      throw error;
    }
  }

  /**
   * Compter les lignes
   * Remplace: pool.query('SELECT COUNT(*) AS count FROM table')
   */
  async count(table, where = {}) {
    try {
      let query = this.client.from(table).select('*', { count: 'exact', head: true });

      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }

      const { count, error } = await query;

      if (error) throw error;
      // Retourner le format compatible avec MySQL: [{ count: ... }]
      return [{ count: count || 0 }];
    } catch (error) {
      logger.error(`❌ Supabase count error (${table}):`, error.message);
      throw error;
    }
  }

  /**
   * Compter avec alias personnalisé (pour compatibilité)
   * Exemple: countWithAlias('orders', {}, 'ordersCount')
   */
  async countWithAlias(table, where = {}, alias = 'count') {
    try {
      const [result] = await this.count(table, where);
      return [{ [alias]: result.count }];
    } catch (error) {
      logger.error(`❌ Supabase countWithAlias error (${table}):`, error.message);
      throw error;
    }
  }
}

// Exporter une instance singleton
const supabaseService = new SupabaseBackendService();

module.exports = supabaseService;

