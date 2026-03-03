use crate::db::errors::DatabaseError as Error;
use sqlx::{Pool, Postgres, postgres::PgPoolOptions};
use tracing::info;

pub struct DatabaseConnection {
    pub username: String,
    pub password: String,
    pub host: String,
    pub port: u16,
    pub db_name: String,
    pub max_connections: u32,
}

impl DatabaseConnection {
    pub fn new(
        username: String,
        password: String,
        host: String,
        port: u16,
        db_name: String,
        max_connections: u32,
    ) -> Self {
        Self {
            username,
            password,
            host,
            port,
            db_name,
            max_connections,
        }
    }
    pub async fn connect(&self) -> Result<Pool<Postgres>, Error> {
        self.try_create_database().await;
        let database_url = format!(
            "postgres://{}:{}@{}:{}/{}",
            self.username, self.password, self.host, self.port, self.db_name
        );
        let pool = PgPoolOptions::new()
            .max_connections(self.max_connections)
            .connect(&database_url)
            .await?;
        sqlx::migrate!().run(&pool).await?;
        Ok(pool)
    }

    async fn try_create_database(&self) {
        let admin_db_url = format!(
            "postgres://{}:{}@{}:{}/postgres",
            self.username, self.password, self.host, self.port
        );
        let admin_pool = match PgPoolOptions::new()
            .max_connections(1)
            .max_lifetime(std::time::Duration::from_secs(5))
            .connect(&admin_db_url)
            .await
        {
            Ok(pool) => pool,
            Err(e) => panic!("Could not connect to admin db: {}", e),
        };

        let query_string = format!("CREATE DATABASE {};", self.db_name);
        match sqlx::query(&query_string).execute(&admin_pool).await {
            Ok(_) => info!("Database created"),
            Err(_) => info!("Database already exist"),
        }
    }
}
