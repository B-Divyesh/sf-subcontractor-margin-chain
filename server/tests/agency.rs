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
async fn claim_real_agency_survives_replica_handoff_in_shared_persistence() {
    let directory = tempfile::tempdir().unwrap();
    let agency_store_a = DemoStore::filesystem(directory.path()).unwrap();
    let agency_store_b = DemoStore::filesystem(directory.path()).unwrap();
    let replica_a = app_with_state(
        PathBuf::from("missing-dist"),
        AppState::with_stores(DemoStore::memory(), agency_store_a),
    );
    let replica_b = app_with_state(
        PathBuf::from("missing-dist"),
        AppState::with_stores(DemoStore::memory(), agency_store_b),
    );
    let cookie = agency(&replica_a, "Shared Agency").await;
    let input = json!({"name":"Replica job","contracting_client":"Client","approved_scope":"Production","client_commitment_minor":500000,"margin_floor_basis_points":2000,"subcontractor":"Partner","cost_role":"Edit","cost_minor":200000});
    let (status, _, _) = send(
        &replica_a,
        Method::POST,
        "/api/v1/app/chains",
        Some(&cookie),
        Some(input),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, _, records) = send(
        &replica_b,
        Method::GET,
        "/api/v1/app/chains",
        Some(&cookie),
        None,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(records["chains"][0]["name"], "Replica job");
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
    assert!(shaped["chains"][0]["calculation"]["committed_cost_minor"].is_null());
    assert!(shaped["chains"][0]["calculation"]["expected_margin_minor"].is_null());
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

#[tokio::test]
async fn claim_restricted_roles_hide_client_identities_in_list_and_detail() {
    let app = app_with_state(PathBuf::from("missing-dist"), AppState::default());
    let owner = agency(&app, "Identity Agency").await;
    let input = json!({"name":"Confidential launch","contracting_client":"Secret Contracting Client","end_client":"Secret End Client","approved_scope":"Launch production","client_commitment_minor":2000000,"margin_floor_basis_points":2000,"subcontractor":"Hidden Partner","cost_role":"Production","cost_minor":500000});
    let (status, _, created) = send(
        &app,
        Method::POST,
        "/api/v1/app/chains",
        Some(&owner),
        Some(input),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let chain_id = created["id"].as_str().unwrap();

    for role in ["producer", "viewer"] {
        let (status, _, invite) = send(
            &app,
            Method::POST,
            "/api/v1/app/members",
            Some(&owner),
            Some(json!({"name":format!("{role} member"),"role":role})),
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
        let restricted_cookie = headers
            .get_all(header::SET_COOKIE)
            .iter()
            .map(|header| header.to_str().unwrap().split(';').next().unwrap())
            .collect::<Vec<_>>()
            .join("; ");

        for path in [
            "/api/v1/app/chains".to_owned(),
            format!("/api/v1/app/chains/{chain_id}"),
        ] {
            let (status, _, projected) =
                send(&app, Method::GET, &path, Some(&restricted_cookie), None).await;
            assert_eq!(status, StatusCode::OK);
            let chain = projected
                .get("chains")
                .and_then(|value| value.as_array())
                .and_then(|chains| chains.first())
                .unwrap_or(&projected);
            assert!(chain.get("contracting_client").is_none());
            assert!(chain.get("end_client").is_none());
            assert_eq!(chain["client_identity_hidden"], true);
            let serialized = chain.to_string();
            assert!(!serialized.contains("Secret Contracting Client"));
            assert!(!serialized.contains("Secret End Client"));
        }
    }
}

#[tokio::test]
async fn app_routes_never_accept_a_demo_cookie_as_an_agency_session() {
    let app = app_with_state(PathBuf::from("missing-dist"), AppState::default());
    let (status, headers, _) =
        send(&app, Method::POST, "/api/v1/demo/workspaces", None, None).await;
    assert_eq!(status, StatusCode::CREATED);
    let demo_cookie = headers
        .get(header::SET_COOKIE)
        .unwrap()
        .to_str()
        .unwrap()
        .split(';')
        .next()
        .unwrap();
    let (status, _, session) = send(
        &app,
        Method::GET,
        "/api/v1/app/session",
        Some(demo_cookie),
        None,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(session["active"], false);
    let (status, _, problem) = send(
        &app,
        Method::GET,
        "/api/v1/app/chains",
        Some(demo_cookie),
        None,
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(problem["code"], "agency_session_missing");
}
