use axum::{body::Body, http::Request};
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
