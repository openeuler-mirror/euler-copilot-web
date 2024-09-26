// Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.

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
            .args(["--", &command])
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
