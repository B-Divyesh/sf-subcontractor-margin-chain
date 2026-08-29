pub mod demo;
pub mod domain;
pub mod routes;

use axum::{
    body::Body,
    extract::Request,
    http::{header, HeaderName, HeaderValue, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    routing::{any, get, MethodRouter},
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

    let api = routes::api_router()
        .route("/api/{*path}", any(routes::api_not_found))
        .route_layer(axum::middleware::from_fn_with_state(
            state.clone(),
            routes::global_rate_limit,
        ));

    let operations = routes::operations_router().route_layer(axum::middleware::from_fn_with_state(
        state.clone(),
        routes::global_rate_limit,
    ));

    Router::new()
        .merge(routes::health_router())
        .merge(operations)
        .merge(api)
        .route("/", spa_route(index.clone(), StatusCode::OK))
        .route("/demo", spa_route(index.clone(), StatusCode::OK))
        .route("/demo/import", spa_route(index.clone(), StatusCode::OK))
        .route("/demo/chains/new", spa_route(index.clone(), StatusCode::OK))
        .route(
            "/demo/chains/{chain_id}",
            spa_route(index.clone(), StatusCode::OK),
        )
        .route("/privacy", spa_route(index.clone(), StatusCode::OK))
        .route("/terms", spa_route(index.clone(), StatusCode::OK))
        .route("/404", spa_route(index.clone(), StatusCode::NOT_FOUND))
        .nest_service("/assets", ServeDir::new(static_dir.join("assets")))
        .route_service(
            "/favicon.svg",
            ServeFile::new(static_dir.join("favicon.svg")),
        )
        .route_service(
            "/apple-touch-icon.svg",
            ServeFile::new(static_dir.join("apple-touch-icon.svg")),
        )
        .route_service(
            "/og-card.svg",
            ServeFile::new(static_dir.join("og-card.svg")),
        )
        .route_service("/robots.txt", ServeFile::new(static_dir.join("robots.txt")))
        .route_service(
            "/sitemap.xml",
            ServeFile::new(static_dir.join("sitemap.xml")),
        )
        .fallback({
            let index = index.clone();
            move || serve_index(index.clone(), StatusCode::NOT_FOUND)
        })
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            routes::count_request,
        ))
        .layer(axum::middleware::from_fn(cache_headers))
        .layer(axum::middleware::from_fn(security_headers))
        .layer(RequestBodyLimitLayer::new(64 * 1024))
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

fn spa_route(index: PathBuf, status: StatusCode) -> MethodRouter<AppState> {
    get(move || serve_index(index.clone(), status))
}

async fn serve_index(index: PathBuf, status: StatusCode) -> Response {
    match tokio::fs::read(index).await {
        Ok(body) => (
            status,
            [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
            body,
        )
            .into_response(),
        Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            "Web assets are unavailable.",
        )
            .into_response(),
    }
}

async fn cache_headers(request: Request<Body>, next: Next) -> Response {
    let immutable = request.uri().path().starts_with("/assets/");
    let mut response = next.run(request).await;
    if immutable && response.status().is_success() {
        response.headers_mut().insert(
            header::CACHE_CONTROL,
            HeaderValue::from_static("public, max-age=31536000, immutable"),
        );
    }
    response
}

async fn security_headers(request: Request<Body>, next: Next) -> Response {
    let demo_response = request.uri().path().starts_with("/api/v1/demo/");
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
    if demo_response {
        headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    }
    response
}
