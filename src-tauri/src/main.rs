// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;

#[cfg(not(target_os = "linux"))]
use tauri::WindowEvent;

#[cfg(desktop)]
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let quit = MenuItemBuilder::new("Quit").id("quit").build(app).unwrap();
            let hide = MenuItemBuilder::new("Hide").id("hide").build(app).unwrap();
            let show = MenuItemBuilder::new("Show").id("show").build(app).unwrap();
            // we could opt handle an error case better than calling unwrap
            let menu = MenuBuilder::new(app)
                .items(&[&quit, &hide, &show])
                .build()
                .unwrap();

            #[cfg(not(target_os = "linux"))]
            {
                let window = app.get_webview_window("main").unwrap();
                let w = window.clone();
                window.on_window_event(move |event| match event {
                    WindowEvent::Focused(false) => {
                        w.hide().unwrap();
                    }
                    _ => {}
                });
            }

            let _ = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => app.exit(0),
                    "hide" => {
                        dbg!("menu item hide clicked");
                        let window = app.get_webview_window("main").unwrap();
                        window.hide().unwrap();
                    }
                    "show" => {
                        dbg!("menu item show clicked");
                        let window = app.get_webview_window("main").unwrap();
                        window.show().unwrap();
                        window.set_focus().unwrap();
                        window.set_always_on_top(true).unwrap();
                    }
                    _ => {}
                })
                .build(app);

            let ctrl_o_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyO);
            let escape = Shortcut::new(None, Code::Escape);
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, shortcut, event| {
                        #[cfg(debug_assertions)]
                        println!("{:?} {} {:?}", shortcut.mods, shortcut.key, event.state);
                        let window = app.get_webview_window("main").unwrap();
                        let ctrl_o_pressed =
                            shortcut == &ctrl_o_shortcut && event.state == ShortcutState::Released;
                        let escape_pressed =
                            shortcut == &escape && event.state == ShortcutState::Released;
                        let window_visible = window.is_visible().unwrap();
                        if (ctrl_o_pressed || escape_pressed) && window_visible {
                            window.hide().unwrap();
                        } else if ctrl_o_pressed && !window_visible {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                            window.set_always_on_top(true).unwrap();
                        }
                    })
                    .build(),
            )?;
            app.global_shortcut().register(ctrl_o_shortcut)?;
            app.global_shortcut().register(escape)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
