use axum::{
    body::Body,
    http::{header, Method, Request, StatusCode},
};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use std::path::PathBuf;
use subcontractor_margin_chain_server::{app_with_state, demo::AppState};
use tower::ServiceExt;

async fn send(
    app: &axum::Router,
    method: Method,
    uri: &str,
    cookie: Option<&str>,
    body: Option<Value>,
) -> (StatusCode, axum::http::HeaderMap, Value) {
    let payload = body.map(|value| value.to_string()).unwrap_or_default();
    let is_post = method == Method::POST;
    let mut request = Request::builder()
        .method(method)
        .uri(uri)
        .header("x-forwarded-for", "198.51.100.9");
    if !payload.is_empty() {
        request = request.header(header::CONTENT_TYPE, "application/json");
    }
    if is_post && uri.ends_with("/chains") {
        request = request.header("idempotency-key", "agency-claim-create");
    }
    if let Some(cookie) = cookie {
        request = request.header(header::COOKIE, cookie);
    }
    let response = app
        .clone()
        .oneshot(request.body(Body::from(payload)).unwrap())
        .await
        .unwrap();
    let status = response.status();
    let headers = response.headers().clone();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let value = if bytes.is_empty() {
        Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap()
    };
    (status, headers, value)
}

async fn agency(app: &axum::Router, name: &str) -> String {
    let (status, headers, body) = send(
        app,
        Method::POST,
        "/api/v1/app/agency",
        None,
        Some(json!({"name":name})),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    assert_eq!(body["role"], "owner");
    headers
        .get_all(header::SET_COOKIE)
        .iter()
        .map(|header| header.to_str().unwrap().split(';').next().unwrap())
        .collect::<Vec<_>>()
        .join("; ")
}

#[tokio::test]
async fn claim_real_agency_records_persist_without_demo_fixtures() {
    let app = app_with_state(PathBuf::from("missing-dist"), AppState::default());
    let cookie = agency(&app, "Juniper Agency").await;
    let (status, _, empty) =
        send(&app, Method::GET, "/api/v1/app/chains", Some(&cookie), None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(empty["chains"].as_array().unwrap().len(), 0);
    let input = json!({"name":"Retail launch","contracting_client":"Mesa Retail","approved_scope":"Campaign production","client_commitment_minor":1000000,"margin_floor_basis_points":2500,"subcontractor":"Alex Roe","cost_role":"Production","cost_minor":400000});
    let (status, _, created) = send(
        &app,
        Method::POST,
        "/api/v1/app/chains",
        Some(&cookie),
        Some(input),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, _, reloaded) =
        send(&app, Method::GET, "/api/v1/app/chains", Some(&cookie), None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(reloaded["chains"].as_array().unwrap().len(), 1);
    assert_eq!(reloaded["chains"][0]["id"], created["id"]);
}

#[tokio::test]
async fn claim_real_agencies_are_tenant_isolated() {
    let app = app_with_state(PathBuf::from("missing-dist"), AppState::default());
    let first = agency(&app, "First Agency").await;
    let second = agency(&app, "Second Agency").await;
    let input = json!({"name":"Private job","contracting_client":"Client","approved_scope":"Work","client_commitment_minor":20000,"margin_floor_basis_points":2000,"subcontractor":"Rae","cost_role":"Edit","cost_minor":5000});
    let (status, _, _) = send(
        &app,
        Method::POST,
        "/api/v1/app/chains",
        Some(&first),
        Some(input),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, _, second_records) =
        send(&app, Method::GET, "/api/v1/app/chains", Some(&second), None).await;
    assert_eq!(status, StatusCode::OK);
    assert!(second_records["chains"].as_array().unwrap().is_empty());
}

#[tokio::test]
async fn claim_agency_roles_hide_rates_and_block_financial_writes() {
    let app = app_with_state(PathBuf::from("missing-dist"), AppState::default());
    let owner = agency(&app, "Role Agency").await;
    let input = json!({"name":"Private job","contracting_client":"Client","approved_scope":"Work","client_commitment_minor":20000,"margin_floor_basis_points":2000,"subcontractor":"Rae","cost_role":"Edit","cost_minor":5000});
    let (status, _, created) = send(
        &app,
        Method::POST,
        "/api/v1/app/chains",
        Some(&owner),
        Some(input),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, _, invite) = send(
        &app,
        Method::POST,
        "/api/v1/app/members",
        Some(&owner),
        Some(json!({"name":"Producer","role":"producer"})),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, headers, _) = send(
        &app,
        Method::GET,
        invite["access_path"].as_str().unwrap(),
        None,
        None,
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let producer = headers
        .get_all(header::SET_COOKIE)
        .iter()
        .map(|header| header.to_str().unwrap().split(';').next().unwrap())
        .collect::<Vec<_>>()
        .join("; ");
    let (status, _, shaped) = send(
        &app,
        Method::GET,
        "/api/v1/app/chains",
        Some(&producer),
        None,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert!(shaped["chains"][0]["costs"].as_array().unwrap().is_empty());
    let (status, _, _) = send(
        &app,
        Method::POST,
        &format!(
            "/api/v1/app/chains/{}/costs",
            created["id"].as_str().unwrap()
        ),
        Some(&producer),
        Some(json!({"subcontractor":"Sam","role":"Sound","amount_minor":100})),
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}
