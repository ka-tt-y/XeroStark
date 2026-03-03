use sqlx::{Error as SqlxError, migrate::MigrateError};

#[derive(Debug)]
pub enum DatabaseError {
    // Errors related to database
    ConnectionError(String),
    QueryError(String),
    NotFound(String),
    RowAlreadyExists,
    Migrate(MigrateError),
}

impl std::fmt::Display for DatabaseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DatabaseError::ConnectionError(msg) => write!(f, "Database connection error: {}", msg),
            DatabaseError::QueryError(msg) => write!(f, "Database query error: {}", msg),
            DatabaseError::NotFound(msg) => write!(f, "Database not found error: {}", msg),
            DatabaseError::Migrate(err) => write!(f, "Database migration error: {}", err),
            DatabaseError::RowAlreadyExists => write!(f, "Database error: Row already exists"),
        }
    }
}

impl From<MigrateError> for DatabaseError {
    fn from(err: MigrateError) -> Self {
        DatabaseError::Migrate(err)
    }
}

impl From<SqlxError> for DatabaseError {
    fn from(err: SqlxError) -> Self {
        match err {
            SqlxError::RowNotFound => {
                DatabaseError::NotFound("Requested item not found".to_string())
            }
            SqlxError::Database(db_error) if db_error.constraint().is_some() => {
                DatabaseError::RowAlreadyExists
            }
            SqlxError::Migrate(err) => DatabaseError::Migrate(*err),
            SqlxError::Io(e) => DatabaseError::ConnectionError(format!("IO Error: {}", e)),
            _ => DatabaseError::QueryError(format!("SQLx Error: {}", err)),
        }
    }
}
