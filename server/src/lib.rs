pub mod routes;

use axum::{routing::get_service, Router};
use std::path::PathBuf;
use tower_http::{services::ServeDir, trace::TraceLayer};

pub fn app(static_dir: PathBuf) -> Router {
    Router::new()
        .merge(routes::router())
        .fallback_service(get_service(
            ServeDir::new(static_dir).append_index_html_on_directories(true),
        ))
        .layer(TraceLayer::new_for_http())
}
