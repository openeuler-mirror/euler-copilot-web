// Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.

use futures_util::StreamExt;
use reqwest::{header, Client};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager, Runtime};
use url::Url;

use crate::config::{get_api_key, get_base_url};

#[derive(Clone, serde::Serialize)]
pub struct StreamPayload {
    pub message: String,
}

#[tauri::command]
pub async fn receive_stream<R: Runtime>(
    app: AppHandle<R>,
    session: &str,
    question: &str,
    conversation: &str,
    language: Option<&str>,
    record: Option<&str>,
    plugin: Option<&str>,
    flow: Option<&str>,
    flow_id: Option<&str>,
) -> Result<u16, String> {
    let mut url = Url::parse(&get_base_url()).unwrap();
    url.set_path("api/client/chat");
    println!("Chat API URL: {}", url);
    println!("Conversation ID: {}", conversation);
    println!("Session ID: {}", session);

    let mut data = json!({
        "session_id": session,
        "question": question,
        "conversation_id": conversation,
    });

    if let Some(language) = language {
        if !language.is_empty() {
            data["language"] = json!(language);
        } else {
            data["language"] = json!("zh");
        }
    } else {
        data["language"] = json!("zh");
    }

    if let Some(record) = record {
        if !record.is_empty() {
            data["record_id"] = json!(record);
        }
    }

    if let Some(plugin) = plugin {
        if !plugin.is_empty() {
            data["user_selected_plugins"] = json!([plugin]);
        }
    }

    if let Some(flow) = flow {
        if !flow.is_empty() {
            data["user_selected_flow"] = json!(flow);
        }
    }

    if let Some(flow_id) = flow_id {
        if !flow_id.is_empty() {
            data["flow_id"] = json!(flow_id);
        }
    }

    let mut headers = get_base_headers();
    headers.insert(header::ACCEPT, "text/event-stream".parse().unwrap());

    let client = Client::builder()
        .default_headers(headers)
        .build()
        .map_err(|err| format!("failed to generate client: {}", err))?;

    let response = client
        .post(url)
        .json(&data)
        .send()
        .await
        .map_err(|err| format!("failed to call API: {}", err))?;

    let status = response.status().as_u16();
    let mut stream = response.bytes_stream();

    while let Some(item) = stream.next().await {

        #[cfg(debug_assertions)]
        println!("Received item is OK: {}", item.is_ok());

        match item {
            Ok(bytes) => {
                let chunk = String::from_utf8_lossy(&bytes);
                let lines = chunk.split("\n\n").collect::<Vec<&str>>();
                for line in lines {
                    if line.starts_with("data: ") {

                        #[cfg(debug_assertions)]
                        println!("Received line: {}", line.trim());

                        emit_message(&app, &line.trim());
                    }
                }
            }
            Err(e) => {
                eprintln!("Error: {}", e);
                break;
            }
        }
    }

    Ok(status)
}

#[tauri::command]
pub async fn create_conversation() -> Result<String, String> {
    let mut url = Url::parse(&get_base_url()).unwrap();
    url.set_path("api/client/conversation");

    let client = Client::new();
    let response = client
        .post(url)
        .headers(get_base_headers())
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    json["result"]["conversation_id"]
        .as_str()
        .map(String::from)
        .ok_or_else(|| "Failed to get conversation_id".to_string())
}

#[tauri::command]
pub async fn refresh_session_id(session_id: Option<&str>) -> Result<String, String> {
    let mut url = Url::parse(&get_base_url()).unwrap();
    url.set_path("api/client/session");

    let client = Client::new();
    let mut json_body = json!({});

    if let Some(session_id) = session_id {
        json_body = json!({
            "session_id": session_id,
        });
    }

    let response = client
        .post(url)
        .headers(get_base_headers())
        .json(&json_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    json["result"]["session_id"]
        .as_str()
        .map(String::from)
        .ok_or_else(|| "Failed to get session_id".to_string())
}

#[tauri::command]
pub async fn stop() {
    let mut url = Url::parse(&get_base_url()).unwrap();
    url.set_path("api/client/stop");

    let client = Client::new();

    client
        .post(url)
        .headers(get_base_headers())
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))
        .unwrap();
}

fn emit_message<R: Runtime>(app: &AppHandle<R>, message: &str) {
    app.emit_all(
        "fetch-stream-data",
        StreamPayload {
            message: message.to_string(),
        },
    )
    .unwrap();
}

fn get_base_headers() -> header::HeaderMap {
    let mut headers = header::HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        "application/json; charset=UTF-8".parse().unwrap(),
    );
    headers.insert(header::CONNECTION, "keep-alive".parse().unwrap());
    headers.insert(
        header::AUTHORIZATION,
        format!("Bearer {}", get_api_key()).parse().unwrap(),
    );
    headers
}
