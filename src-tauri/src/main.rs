// Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use positioner::WindowExt;
use tauri::{App, AppHandle, GlobalShortcutManager, Manager, RunEvent};
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

#[cfg(all(not(target_os = "linux"), not(debug_assertions)))]
use tauri::WindowEvent;

mod chat;
mod config;
mod positioner;

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let tray_menu = SystemTrayMenu::new()
        .add_item(quit)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(show)
        .add_item(hide);

    let tray = SystemTray::new().with_menu(tray_menu);

    let app = tauri::Builder::default()
        // .plugin(tauri_plugin_http::init())
        // .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        // .plugin(tauri_plugin_shell::init())
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::DoubleClick { .. } => {
                dbg!("system tray double clicked");
                show_main_window(app);
            },
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    app.exit(0);
                }
                "show" => {
                    dbg!("menu item show clicked");
                    show_main_window(app);
                }
                "hide" => {
                    dbg!("menu item hide clicked");
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .setup(|_app| {
            #[cfg(all(not(target_os = "linux"), not(debug_assertions)))]
            {
                let window = _app.get_window("main").unwrap();
                let w = window.clone();
                window.on_window_event(move |event| match event {
                    WindowEvent::Focused(false) => {
                        w.hide().unwrap();
                    }
                    _ => {}
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            chat::create_conversation,
            chat::refresh_session_id,
            chat::receive_stream,
            chat::stop,
            config::get_api_key,
            config::update_config
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    register_shortcut(&app);

    app.run(|app, event| match event {
        RunEvent::ExitRequested { api, .. } => {
            api.prevent_exit();
        }
        RunEvent::Exit => {
            let window = app.get_window("main").unwrap();
            window.hide().unwrap();
        }
        _ => {}
    });
}

fn register_shortcut(app: &App) {
    let mut shortcut = app.global_shortcut_manager();
    let app_handler = app.handle();
    let result = shortcut.register("CmdOrCtrl+O", move || {
        let window = app_handler.get_window("main").unwrap();
        if window.is_visible().unwrap() {
            window.hide().unwrap();
        } else {
            window.setup_window_pos().unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
        }
    });
    if let Err(err) = result {
        println!("{}", err);
    }
}

fn show_main_window(app_handle: &AppHandle) {
    let window = app_handle.get_window("main").unwrap();
    if !window.is_visible().unwrap() {
        window.setup_window_pos().unwrap();
        window.show().unwrap();
        window.set_focus().unwrap();
    }
}

fn show_welcome_window(app: App) {}
