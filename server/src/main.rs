use std::{env, net::SocketAddr, path::PathBuf, time::Duration};
use subcontractor_margin_chain_server::{app_with_state, demo::AppState};
use tokio::net::TcpListener;
use tracing::{info, warn};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let port = env::var("PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(8080);
    let static_dir = env::var_os("STATIC_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("dist"));
    let address = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(address)
        .await
        .expect("the configured port must be available");
    let state = AppState::default();
    let purge_store = state.demo.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(60 * 60));
        loop {
            interval.tick().await;
            let removed = purge_store.purge_expired();
            if removed > 0 {
                info!(removed, "expired demo workspaces purged");
            }
        }
    });

    info!(
        %address,
        ?static_dir,
        build_sha = routes_build_sha(),
        "server started; runtime config supplied: PORT/STATIC_DIR or defaults; generated secrets: none in M1"
    );

    axum::serve(listener, app_with_state(static_dir, state))
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server must remain available");
}

fn routes_build_sha() -> &'static str {
    option_env!("BUILD_SHA").unwrap_or("dev")
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Ctrl+C handler must install");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("terminate handler must install")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => {},
        () = terminate => {},
    }

    warn!("shutdown signal received");
}
