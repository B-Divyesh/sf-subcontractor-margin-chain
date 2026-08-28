use axum::{
    body::Body,
    http::{header, Method, Request, StatusCode},
};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use std::path::PathBuf;
use subcontractor_margin_chain_server::{
    app_with_state,
    demo::{AppState, DemoStore},
};
use tower::ServiceExt;

async fn send(
    app: &axum::Router,
    method: Method,
    uri: &str,
    cookie: Option<&str>,
    body: Option<Value>,
    idempotency: Option<&str>,
    ip: &str,
) -> (StatusCode, axum::http::HeaderMap, Value) {
    let payload = body.map(|value| value.to_string()).unwrap_or_default();
    let mut builder = Request::builder()
        .method(method)
        .uri(uri)
        .header("x-forwarded-for", ip);
    if !payload.is_empty() {
        builder = builder.header(header::CONTENT_TYPE, "application/json");
    }
    if let Some(cookie) = cookie {
        builder = builder.header(header::COOKIE, cookie);
    }
    if let Some(key) = idempotency {
        builder = builder.header("idempotency-key", key);
    }
    let response = app
        .clone()
        .oneshot(builder.body(Body::from(payload)).unwrap())
        .await
        .unwrap();
    let status = response.status();
    let headers = response.headers().clone();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let value = if bytes.is_empty() {
        Value::Null
    } else {
        serde_json::from_slice(&bytes)
            .unwrap_or_else(|_| json!({"raw": String::from_utf8_lossy(&bytes)}))
    };
    (status, headers, value)
}

async fn workspace(app: &axum::Router, ip: &str) -> String {
    let (status, headers, _) = send(
        app,
        Method::POST,
        "/api/v1/demo/workspaces",
        None,
        None,
        None,
        ip,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    headers
        .get(header::SET_COOKIE)
        .unwrap()
        .to_str()
        .unwrap()
        .split(';')
        .next()
        .unwrap()
        .to_owned()
}

#[tokio::test]
async fn workspace_survives_replica_handoff_in_shared_persistence() {
    let directory = tempfile::tempdir().unwrap();
    let replica_a = app_with_state(
        PathBuf::from("missing-dist"),
        AppState::with_demo(DemoStore::filesystem(directory.path()).unwrap()),
    );
    let replica_b = app_with_state(
        PathBuf::from("missing-dist"),
        AppState::with_demo(DemoStore::filesystem(directory.path()).unwrap()),
    );
    let cookie = workspace(&replica_a, "198.51.100.77").await;

    for target in [&replica_b, &replica_a, &replica_b] {
        let (status, _, body) = send(
            target,
            Method::GET,
            "/api/v1/demo/chains",
            Some(&cookie),
            None,
            None,
            "198.51.100.77",
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["chains"].as_array().unwrap().len(), 3);
    }

    let (status, _, _) = send(
        &replica_b,
        Method::POST,
        "/api/v1/demo/chains/autumn-launch-films/costs",
        Some(&cookie),
        Some(
            json!({"subcontractor":"Mara Bell","role":"Location sound mix","amount_minor":600000}),
        ),
        Some("replica-shared-write"),
        "198.51.100.77",
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, _, body) = send(
        &replica_a,
        Method::GET,
        "/api/v1/demo/chains/autumn-launch-films",
        Some(&cookie),
        None,
        None,
        "198.51.100.77",
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["calculation"]["margin_at_risk_minor"], 130000);
}

#[tokio::test]
async fn demo_seed_mutations_idempotency_and_reset_work_end_to_end() {
    let state = AppState::default();
    let app = app_with_state(PathBuf::from("missing-dist"), state);
    let cookie = workspace(&app, "198.51.100.21").await;

    let (status, headers, list) = send(
        &app,
        Method::GET,
        "/api/v1/demo/chains",
        Some(&cookie),
        None,
        None,
        "198.51.100.21",
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(headers.get(header::CACHE_CONTROL).unwrap(), "no-store");
    assert_eq!(list["chains"].as_array().unwrap().len(), 3);
    let autumn = list["chains"]
        .as_array()
        .unwrap()
        .iter()
        .find(|chain| chain["id"] == "autumn-launch-films")
        .unwrap();
    assert_eq!(autumn["calculation"]["expected_margin_minor"], 950_000);
    assert_eq!(autumn["calculation"]["margin_percent_tenths"], 396);

    let new_chain = json!({
        "name": "Brand identity sprint",
        "contracting_client": "Paper Street Studio",
        "end_client": "Cedar Kitchens",
        "approved_scope": "Identity system and handoff",
        "client_commitment_minor": 1200000,
        "margin_floor_basis_points": 2500,
        "subcontractor": "Leah Kim",
        "cost_role": "Identity design",
        "cost_minor": 650000
    });
    let (status, _, created) = send(
        &app,
        Method::POST,
        "/api/v1/demo/chains",
        Some(&cookie),
        Some(new_chain.clone()),
        Some("create-brand-identity"),
        "198.51.100.21",
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let created_id = created["id"].as_str().unwrap();
    let (status, _, repeated) = send(
        &app,
        Method::POST,
        "/api/v1/demo/chains",
        Some(&cookie),
        Some(new_chain),
        Some("create-brand-identity"),
        "198.51.100.21",
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(repeated["id"], created_id);

    let cost =
        json!({"subcontractor":"Mara Bell","role":"Location sound mix","amount_minor":600000});
    let (status, _, changed) = send(
        &app,
        Method::POST,
        "/api/v1/demo/chains/autumn-launch-films/costs",
        Some(&cookie),
        Some(cost.clone()),
        Some("add-sound-commitment"),
        "198.51.100.21",
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    assert_eq!(changed["calculation"]["margin_at_risk_minor"], 130000);
    assert_eq!(
        changed["calculation"]["cause"],
        "Location sound mix was added"
    );
    let (_, _, repeated) = send(
        &app,
        Method::POST,
        "/api/v1/demo/chains/autumn-launch-films/costs",
        Some(&cookie),
        Some(cost),
        Some("add-sound-commitment"),
        "198.51.100.21",
    )
    .await;
    assert_eq!(repeated["costs"].as_array().unwrap().len(), 3);

    let (status, _, approved) = send(
        &app,
        Method::PATCH,
        "/api/v1/demo/chains/autumn-launch-films/scopes/social-cutdown",
        Some(&cookie),
        Some(json!({"status":"approved"})),
        None,
        "198.51.100.21",
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(approved["scopes"][1]["status"], "approved");
    let (status, _, invoiced) = send(
        &app,
        Method::PATCH,
        "/api/v1/demo/chains/autumn-launch-films/milestones/autumn-balance",
        Some(&cookie),
        Some(json!({"status":"sent"})),
        None,
        "198.51.100.21",
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(invoiced["milestones"][1]["status"], "sent");

    let (status, _, patched) = send(
        &app,
        Method::PATCH,
        &format!("/api/v1/demo/chains/{created_id}"),
        Some(&cookie),
        Some(json!({"margin_floor_basis_points":3000})),
        None,
        "198.51.100.21",
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(patched["margin_floor_basis_points"], 3000);

    let (status, _, _) = send(
        &app,
        Method::DELETE,
        "/api/v1/demo/workspaces/current",
        Some(&cookie),
        None,
        None,
        "198.51.100.21",
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _, problem) = send(
        &app,
        Method::GET,
        "/api/v1/demo/chains",
        Some(&cookie),
        None,
        None,
        "198.51.100.21",
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(problem["code"], "demo_workspace_missing");
}

#[tokio::test]
async fn invalid_requests_are_bounded_and_return_problem_details() {
    let app = app_with_state(PathBuf::from("missing-dist"), AppState::default());
    let cookie = workspace(&app, "198.51.100.22").await;
    let (status, headers, _) = send(
        &app,
        Method::GET,
        "/api/v1/demo/chains",
        Some(&cookie),
        None,
        None,
        "198.51.100.22",
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(headers.get(header::CACHE_CONTROL).unwrap(), "no-store");
    let (status, headers, problem) = send(
        &app,
        Method::POST,
        "/api/v1/demo/chains",
        Some(&cookie),
        Some(json!({
            "name":"x", "contracting_client":"x", "approved_scope":"x", "client_commitment_minor":0,
            "margin_floor_basis_points":12000, "subcontractor":"x", "cost_role":"x", "cost_minor":-1
        })),
        Some("invalid-request"),
        "198.51.100.22",
    )
    .await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
    assert_eq!(
        headers.get(header::CONTENT_TYPE).unwrap(),
        "application/problem+json"
    );
    assert_eq!(problem["code"], "invalid_chain");
    assert_eq!(headers.get(header::CACHE_CONTROL).unwrap(), "no-store");
    assert!(problem["request_id"].as_str().unwrap().len() > 20);

    let oversized = "z".repeat(70 * 1024);
    let request = Request::builder()
        .method(Method::POST)
        .uri("/api/v1/demo/chains")
        .header(header::COOKIE, &cookie)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(oversized))
        .unwrap();
    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::PAYLOAD_TOO_LARGE);
}

#[tokio::test]
async fn claim_demo_cookie_is_scoped_and_secure_on_https() {
    let app = app_with_state(PathBuf::from("missing-dist"), AppState::default());
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/demo/workspaces")
                .header("x-forwarded-for", "198.51.100.88")
                .header("x-forwarded-proto", "https")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);
    let cookie = response.headers()[header::SET_COOKIE].to_str().unwrap();
    assert!(cookie.contains("; Secure"));
    assert!(cookie.contains("; HttpOnly"));
    assert!(cookie.contains("; SameSite=Lax"));
    assert!(!cookie.to_ascii_lowercase().contains("domain="));
}

#[tokio::test]
async fn global_and_provision_limits_use_forwarded_ip_and_send_retry_after() {
    let app = app_with_state(PathBuf::from("missing-dist"), AppState::default());
    for attempt in 0..6 {
        let (status, headers, _) = send(
            &app,
            Method::POST,
            "/api/v1/demo/workspaces",
            None,
            None,
            None,
            "203.0.113.9",
        )
        .await;
        if attempt < 5 {
            assert_eq!(status, StatusCode::CREATED);
        } else {
            assert_eq!(status, StatusCode::TOO_MANY_REQUESTS);
            assert!(headers.get(header::RETRY_AFTER).is_some());
        }
    }

    for attempt in 0..41 {
        let (status, headers, _) = send(
            &app,
            Method::GET,
            "/api/v1/not-a-route",
            None,
            None,
            None,
            "203.0.113.10",
        )
        .await;
        if attempt < 40 {
            assert_eq!(status, StatusCode::NOT_FOUND);
        } else {
            assert_eq!(status, StatusCode::TOO_MANY_REQUESTS);
            assert!(headers.get(header::RETRY_AFTER).is_some());
        }
    }
}
