// Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.

use futures_util::StreamExt;
use reqwest::{header, Client};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Runtime};
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
    language: &str,
    conversation: &str,
    plugin: &str,
) -> Result<String, String> {
    let mut url = Url::parse(&get_base_url()).unwrap();
    url.set_path("api/client/chat");
    println!("Chat API URL: {}", url);

    let data = json!({
        "session_id": session,
        "question": question,
        "language": language,
        "conversation_id": conversation,
        "user_selected_plugins": [
            plugin
        ],
    });

    let cookie = format!("ECSESSION={};", session);

    let mut headers = get_base_headers();
    headers.insert(header::COOKIE, cookie.parse().unwrap());
    headers.insert(header::ACCEPT, "text/event-stream".parse().unwrap());

    let client = Client::builder()
        .default_headers(headers)
        .build()
        .map_err(|err| format!("failed to generate client: {}", err))?;

    let mut stream = client
        .post(url)
        .json(&data)
        .send()
        .await
        .map_err(|err| format!("failed to call API: {}", err))?
        .bytes_stream();

    while let Some(item) = stream.next().await {
        println!("Received item is OK: {}", item.is_ok());
        match item {
            Ok(bytes) => {
                println!("Received bytes: {}", bytes.len());
                let chunk = String::from_utf8_lossy(&bytes);
                println!("Received chunk: {}", chunk);
                if let Some(json_str) = chunk.strip_prefix("data: ") {
                    match json_str {
                        "[ERROR]" | "[SENSITIVE]" | "[DONE]" => emit_message(&app, json_str),
                        _ => {
                            if let Ok(json_value) = serde_json::from_str::<Value>(json_str) {
                                let payload = parse_json_payload(&json_value);
                                emit_message(&app, &payload);
                            } else {
                                println!("Failed to parse JSON: {}", json_str);
                            }
                        }
                    }
                } else {
                    println!("Received non-JSON data: {}", chunk);
                }
            }
            Err(e) => {
                eprintln!("Error: {}", e);
                continue;
            }
        }
    }

    Ok("success".to_string())
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

fn parse_json_payload(json_value: &Value) -> String {
    match json_value {
        Value::Object(obj) => {
            if let Some(content) = obj.get("content") {
                content.as_str().unwrap_or_default().to_string()
            } else if obj.contains_key("search_suggestions") {
                json_value.to_string()
            } else if let Some(extract) = obj.get("extract") {
                if let Some(extract_obj) = extract.as_object() {
                    if let Some(data) = extract_obj.get("data") {
                        data.to_string()
                    } else {
                        String::new()
                    }
                } else {
                    String::new()
                }
            } else {
                String::new()
            }
        }
        _ => String::new(),
    }
}

fn emit_message<R: Runtime>(app: &AppHandle<R>, message: &str) {
    app.emit_to(
        "main",
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
