// Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.

use std::env;
use tauri::api::process::Command;
use webbrowser::{open_browser, Browser};

#[tauri::command]
pub fn open_url(url: &str) {
    if open_browser(Browser::Default, &url).is_ok() {
        println!("{}", &url)
    }
}

#[tauri::command]
pub fn open_terminal(command: String) {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd").args(["/k", &command]).spawn().unwrap();
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("gnome-terminal")
            .args([
                "--",
                "bash",
                "-c",
                &format!("source ~/.bashrc && {} ; exec bash", command),
            ])
            .spawn()
            .unwrap();
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("osascript")
            .args([
                "-e",
                &format!("tell app \"Terminal\" to do script \"{}\"", command),
            ])
            .spawn()
            .unwrap();
    }
}

#[tauri::command]
pub fn run_command(command: &str) -> Result<String, String> {
    let output = if cfg!(target_os = "windows") {
        Command::new("cmd").args(&["/C", command]).output()
    } else {
        let shell = env::var("SHELL")
            .unwrap_or_else(|_| String::from("/bin/sh"))
            .split('/')
            .last()
            .unwrap_or("sh")
            .to_string();
        Command::new(shell).args(["-c", command]).output()
    };

    match output {
        Ok(output) => {
            if output.status.success() {
                Ok(output.stdout.trim().to_string())
            } else {
                Err(output.stderr.trim().to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}
