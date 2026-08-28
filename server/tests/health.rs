use axum::{
    body::Body,
    http::{header, Request, StatusCode},
};
use http_body_util::BodyExt;
use std::path::PathBuf;
use subcontractor_margin_chain_server::app;
use tower::ServiceExt;

#[tokio::test]
async fn health_reports_build_identity() {
    let response = app(PathBuf::from("missing-dist-is-allowed"))
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), 200);
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let text = String::from_utf8(body.to_vec()).unwrap();
    assert!(text.contains("\"status\":\"ok\""));
    assert!(text.contains("\"build_sha\":\"dev\""));
}

fn test_app() -> (tempfile::TempDir, axum::Router) {
    let directory = tempfile::tempdir().unwrap();
    std::fs::create_dir(directory.path().join("assets")).unwrap();
    std::fs::write(
        directory.path().join("index.html"),
        "<!doctype html><main>app</main>",
    )
    .unwrap();
    std::fs::write(
        directory.path().join("assets/index-abc123.js"),
        "export {};",
    )
    .unwrap();
    let app = app(directory.path().to_path_buf());
    (directory, app)
}

#[tokio::test]
async fn claim_operational_endpoints_return_readiness_and_metrics() {
    let (_directory, app) = test_app();
    let ready = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/ready")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ready.status(), StatusCode::OK);
    assert_eq!(ready.headers()[header::CONTENT_TYPE], "application/json");

    let metrics = app
        .oneshot(
            Request::builder()
                .uri("/internal/metrics")
                .header("x-forwarded-for", "198.51.100.90")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(metrics.status(), StatusCode::OK);
    assert!(metrics.headers()[header::CONTENT_TYPE]
        .to_str()
        .unwrap()
        .starts_with("text/plain"));
}

#[tokio::test]
async fn claim_unknown_routes_return_true_404() {
    let (_directory, app) = test_app();
    let response = app
        .oneshot(
            Request::builder()
                .uri("/not-a-real-page")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn claim_hashed_assets_are_cached_immutably() {
    let (_directory, app) = test_app();
    let response = app
        .oneshot(
            Request::builder()
                .uri("/assets/index-abc123.js")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers()[header::CACHE_CONTROL],
        "public, max-age=31536000, immutable"
    );
}

#[tokio::test]
async fn claim_security_headers_are_sent() {
    let (_directory, app) = test_app();
    let response = app
        .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    for name in [
        "content-security-policy",
        "strict-transport-security",
        "x-content-type-options",
        "referrer-policy",
        "permissions-policy",
        "x-frame-options",
    ] {
        assert!(response.headers().contains_key(name), "missing {name}");
    }
}
