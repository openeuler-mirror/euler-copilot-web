// Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use api::ChatState;
use positioner::WindowExt;
use std::sync::Mutex;
use tauri::{App, AppHandle, GlobalShortcutManager, Manager, RunEvent, WindowBuilder, WindowUrl};
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
use tauri_plugin_autostart::MacosLauncher;

mod api;
mod config;
mod positioner;
mod utility;

fn main() {
    // Fix issue with nVidia GPU on Linux
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    let settings = CustomMenuItem::new("settings".to_string(), "设置");
    let quit = CustomMenuItem::new("quit".to_string(), "退出");
    let hide = CustomMenuItem::new("hide".to_string(), "隐藏窗口");
    let show = CustomMenuItem::new("show".to_string(), "显示窗口");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(settings)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let tray = SystemTray::new().with_menu(tray_menu);

    let app = tauri::Builder::default()
        .manage(ChatState(Mutex::new(false)))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            dbg!("app exists");
            show_main_window(app.clone());
        }))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_context_menu::init())
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::DoubleClick { .. } => {
                dbg!("system tray double clicked");
                show_main_window(app.clone());
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    app.exit(0);
                }
                "show" => {
                    dbg!("menu item show clicked");
                    show_main_window(app.clone());
                }
                "hide" => {
                    dbg!("menu item hide clicked");
                    let window = app.get_window("main");
                    if let Some(window) = window {
                        window.hide().unwrap();
                    }
                }
                "settings" => {
                    dbg!("menu item settings clicked");
                    show_settings_window(app.clone());
                }
                _ => {}
            },
            _ => {}
        })
        .setup(|_app| {
            create_floating_icon(_app);
            let api_key = config::get_api_key();
            if api_key.is_empty() {
                create_welcome_window(_app);
            }
            #[cfg(all(not(target_os = "linux"), not(debug_assertions)))]
            {
                use tauri::WindowEvent;
                let window = _app.get_window("main");
                if let Some(window) = window {
                    let w = window.clone();
                    window.on_window_event(move |event| match event {
                        WindowEvent::Focused(false) => {
                            w.hide().unwrap();
                        }
                        _ => {}
                    });
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            exit_app,
            show_main_window,
            show_settings_window,
            api::create_conversation,
            api::refresh_session_id,
            api::plugin,
            api::chat,
            api::chat_mcp,
            api::stop,
            config::get_base_url,
            config::get_api_key,
            config::update_config,
            utility::open_url,
            utility::open_terminal,
            utility::run_command
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
    let app_handle = app.handle();
    let result = shortcut.register("Shift+CmdOrCtrl+O", move || {
        let window = app_handle.get_window("main");
        if window.is_none() {
            create_main_window(&app_handle);
        } else {
            let window = window.unwrap();
            if window.is_visible().unwrap() {
                window.hide().unwrap();
            } else {
                window.setup_window_pos().unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        }
    });
    if let Err(err) = result {
        println!("{}", err);
    }
}

fn create_floating_icon(app: &App) {
    let builder = WindowBuilder::new(app, "floating", WindowUrl::App("/floating".into()))
        .title("悬浮球")
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .inner_size(64., 64.)
        .decorations(false)
        .transparent(true)
        .position(0., 576.);

    builder.build().expect("无法创建悬浮球");
}

#[tauri::command]
fn show_main_window(app_handle: AppHandle) {
    let window = app_handle.get_window("main");
    if window.is_none() {
        create_main_window(&app_handle);
    } else {
        let window = window.unwrap();
        if !window.is_visible().unwrap() {
            window.setup_window_pos().unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
        }
    }
}

fn create_main_window(app_handle: &AppHandle) {
    let mut builder = WindowBuilder::new(app_handle, "main", WindowUrl::App("/".into()))
        .title("Copilot")
        .resizable(true)
        .maximizable(false)
        .minimizable(false)
        .skip_taskbar(true)
        .inner_size(1280., 680.)
        .min_inner_size(1280., 680.)
        .max_inner_size(1440., 4096.);

    #[cfg(target_os = "macos")]
    {
        builder = builder
            .title_bar_style(tauri::TitleBarStyle::Overlay)
            .hidden_title(true);
    }

    #[cfg(target_os = "linux")]
    {
        builder = builder.decorations(false);
    }

    builder.build().expect("无法创建主窗口");

    let window = app_handle.get_window("main").unwrap();
    window.setup_window_pos().unwrap();
}

fn create_welcome_window(app: &App) {
    let mut builder = WindowBuilder::new(app, "welcome", WindowUrl::App("/welcome".into()))
        .title("欢迎")
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .inner_size(720., 540.)
        .center();

    #[cfg(target_os = "macos")]
    {
        builder = builder
            .title_bar_style(tauri::TitleBarStyle::Overlay)
            .hidden_title(true);
    }

    #[cfg(target_os = "linux")]
    {
        builder = builder.decorations(false);
    }

    builder.build().expect("无法创建欢迎窗口");
}

#[tauri::command]
fn show_settings_window(app_handle: AppHandle) {
    let window = app_handle.get_window("settings");
    if window.is_none() {
        create_settings_window(&app_handle);
    } else {
        let window = window.unwrap();
        window.show().unwrap();
        window.set_focus().unwrap();
    }
}

fn create_settings_window(app_handle: &AppHandle) {
    let builder = WindowBuilder::new(app_handle, "settings", WindowUrl::App("/settings".into()))
        .title("设置")
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .inner_size(540., 360.)
        .center();

    builder.build().expect("无法创建设置窗口");
}

#[tauri::command]
fn exit_app(app_handle: AppHandle) {
    app_handle.exit(0);
}
