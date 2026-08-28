use std::{
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    process::{Command, Stdio},
    thread,
    time::Duration,
};

#[test]
fn claim_runtime_starts_with_only_port() {
    probe_server(Some(free_port()));
    probe_server(None);
}

fn free_port() -> u16 {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let port = listener.local_addr().unwrap().port();
    drop(listener);
    port
}

fn probe_server(configured_port: Option<u16>) {
    let port = configured_port.unwrap_or(8080);
    let mut command = Command::new(env!("CARGO_BIN_EXE_subcontractor-margin-chain-server"));
    command.env_clear();
    if let Some(port) = configured_port {
        command.env("PORT", port.to_string());
    }
    let mut child = command
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();

    let mut response = String::new();
    for _ in 0..100 {
        if let Ok(mut stream) = TcpStream::connect(("127.0.0.1", port)) {
            stream
                .write_all(b"GET /health HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n")
                .unwrap();
            stream.read_to_string(&mut response).unwrap();
            break;
        }
        thread::sleep(Duration::from_millis(25));
    }
    child.kill().ok();
    child.wait().ok();

    assert!(response.starts_with("HTTP/1.1 200 OK"), "{response}");
    assert!(response.contains("\"status\":\"ok\""), "{response}");
}
