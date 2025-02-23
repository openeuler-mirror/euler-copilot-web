// Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.

use futures_util::StreamExt;
use reqwest::{header, Client};
use serde_json::{json, Value};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, Runtime, State};
use url::Url;

use crate::config::{get_api_key, get_base_url};

pub struct ChatState(pub Mutex<bool>);

#[derive(Clone, serde::Serialize)]
pub struct StreamPayload {
    pub message: String,
}

#[tauri::command]
pub async fn chat<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, ChatState>,
    session: &str,
    question: &str,
    conversation: &str,
    language: Option<&str>,
    record: Option<&str>,
    plugin: Option<&str>,
    flow: Option<&str>,
    flow_id: Option<&str>,
) -> Result<u16, String> {
    // 开始回答
    *state.0.lock().unwrap() = true;

    let mut url = Url::parse(&get_base_url()).unwrap();
    url.set_path("api/client/chat");
    #[cfg(debug_assertions)]
    {
        println!("Chat API URL: {}", url);
        println!("Conversation ID: {}", conversation);
        println!("Session ID: {}", session);
    }

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
        // 检查状态是否中止回答
        if !*state.0.lock().unwrap() {
            emit_message(&app, "data: [DONE]");
            break;
        }

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

    // 结束回答
    *state.0.lock().unwrap() = false;

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
pub async fn stop(state: State<'_, ChatState>) -> Result<(), String> {
    // 停止回答
    *state.0.lock().unwrap() = false;

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

    Ok(())
}

#[tauri::command]
pub async fn plugin() -> Result<Value, String> {
    let mut url = Url::parse(&get_base_url()).unwrap();
    url.set_path("api/client/plugin");

    let client = Client::new();
    let response = client
        .get(url)
        .headers(get_base_headers())
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    Ok(json)
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
    let base_url = get_base_url();
    let host = base_url
        .strip_prefix("http://")
        .or_else(|| base_url.strip_prefix("https://"))
        .unwrap()
        .strip_suffix("/")
        .unwrap()
        .to_string();
    headers.insert(header::HOST, host.parse().unwrap());
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
