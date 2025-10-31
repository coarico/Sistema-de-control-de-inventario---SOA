package com.ferreteria.inventario.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Configuración de la base de datos y pool de conexiones
 */
public class DatabaseConfig {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);
    private static DatabaseConfig instance;
    private HikariDataSource dataSource;
    private Properties properties;

    private DatabaseConfig() {
        loadProperties();
        initializeDataSource();
    }

    public static synchronized DatabaseConfig getInstance() {
        if (instance == null) {
            instance = new DatabaseConfig();
        }
        return instance;
    }

    private void loadProperties() {
        properties = new Properties();
        try (InputStream input = getClass().getClassLoader().getResourceAsStream("database.properties")) {
            if (input == null) {
                logger.error("No se pudo encontrar el archivo database.properties");
                throw new RuntimeException("Archivo de configuración de base de datos no encontrado");
            }
            properties.load(input);
            logger.info("Propiedades de base de datos cargadas correctamente");
        } catch (IOException e) {
            logger.error("Error al cargar las propiedades de la base de datos", e);
            throw new RuntimeException("Error al cargar configuración de base de datos", e);
        }
    }

    private void initializeDataSource() {
        try {
            HikariConfig config = new HikariConfig();
            
            // Configuración básica de conexión
            config.setDriverClassName(properties.getProperty("db.driver"));
            config.setJdbcUrl(properties.getProperty("db.url"));
            config.setUsername(properties.getProperty("db.username"));
            config.setPassword(properties.getProperty("db.password"));
            
            // Configuración del pool de conexiones
            config.setMaximumPoolSize(Integer.parseInt(properties.getProperty("db.pool.maximumPoolSize", "10")));
            config.setMinimumIdle(Integer.parseInt(properties.getProperty("db.pool.minimumIdle", "2")));
            config.setConnectionTimeout(Long.parseLong(properties.getProperty("db.pool.connectionTimeout", "30000")));
            config.setIdleTimeout(Long.parseLong(properties.getProperty("db.pool.idleTimeout", "600000")));
            config.setMaxLifetime(Long.parseLong(properties.getProperty("db.pool.maxLifetime", "1800000")));
            config.setLeakDetectionThreshold(Long.parseLong(properties.getProperty("db.pool.leakDetectionThreshold", "60000")));
            
            // Configuraciones adicionales para MySQL
            config.addDataSourceProperty("cachePrepStmts", "true");
            config.addDataSourceProperty("prepStmtCacheSize", "250");
            config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
            config.addDataSourceProperty("useServerPrepStmts", "true");
            config.addDataSourceProperty("useLocalSessionState", "true");
            config.addDataSourceProperty("rewriteBatchedStatements", "true");
            config.addDataSourceProperty("cacheResultSetMetadata", "true");
            config.addDataSourceProperty("cacheServerConfiguration", "true");
            config.addDataSourceProperty("elideSetAutoCommits", "true");
            config.addDataSourceProperty("maintainTimeStats", "false");
            
            // Configuración de validación de conexiones
            config.setConnectionTestQuery("SELECT 1");
            config.setValidationTimeout(5000);
            
            dataSource = new HikariDataSource(config);
            logger.info("Pool de conexiones HikariCP inicializado correctamente");
            
        } catch (Exception e) {
            logger.error("Error al inicializar el pool de conexiones", e);
            throw new RuntimeException("Error al configurar la base de datos", e);
        }
    }

    public DataSource getDataSource() {
        return dataSource;
    }

    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    public void closeDataSource() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            logger.info("Pool de conexiones cerrado correctamente");
        }
    }

    public boolean testConnection() {
        try (Connection connection = getConnection()) {
            return connection.isValid(5);
        } catch (SQLException e) {
            logger.error("Error al probar la conexión a la base de datos", e);
            return false;
        }
    }
}
