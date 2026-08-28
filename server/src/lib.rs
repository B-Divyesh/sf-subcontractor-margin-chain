pub mod demo;
pub mod domain;
pub mod routes;

use axum::{
    body::Body,
    extract::Request,
    http::{header, HeaderName, HeaderValue},
    middleware::Next,
    response::Response,
    routing::any,
    Router,
};
use demo::AppState;
use std::path::PathBuf;
use tower_http::{
    compression::CompressionLayer,
    limit::RequestBodyLimitLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};

pub fn app(static_dir: PathBuf) -> Router {
    app_with_state(static_dir, AppState::default())
}

pub fn app_with_state(static_dir: PathBuf, state: AppState) -> Router {
    let index = static_dir.join("index.html");
    let static_files = ServeDir::new(static_dir)
        .append_index_html_on_directories(true)
        .fallback(ServeFile::new(index));

    let api = routes::api_router()
        .route("/api/{*path}", any(routes::api_not_found))
        .route_layer(axum::middleware::from_fn_with_state(
            state.clone(),
            routes::global_rate_limit,
        ));

    Router::new()
        .merge(routes::health_router())
        .merge(api)
        .fallback_service(static_files)
        .layer(axum::middleware::from_fn(security_headers))
        .layer(RequestBodyLimitLayer::new(64 * 1024))
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn security_headers(request: Request<Body>, next: Next) -> Response {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(
        HeaderName::from_static("x-content-type-options"),
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        header::REFERRER_POLICY,
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    headers.insert(
        HeaderName::from_static("x-frame-options"),
        HeaderValue::from_static("DENY"),
    );
    headers.insert(
        HeaderName::from_static("permissions-policy"),
        HeaderValue::from_static("camera=(), microphone=(), geolocation=(), payment=()"),
    );
    headers.insert(
        HeaderName::from_static("content-security-policy"),
        HeaderValue::from_static(
            "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'",
        ),
    );
    headers.insert(
        HeaderName::from_static("strict-transport-security"),
        HeaderValue::from_static("max-age=31536000; includeSubDomains"),
    );
    response
}
