// Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.

use webbrowser::{open_browser, Browser};

#[tauri::command]
pub fn open_url(url: &str) {
    if open_browser(Browser::Default, &url).is_ok() {
        println!("{}", &url)
    }
}
