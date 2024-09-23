// Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.

use anyhow::{Context, Ok, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    framework_url: String,
    framework_api_key: String,
}

#[tauri::command]
pub fn get_base_url() -> String {
    Config::load()
        .map(|config| config.framework_url)
        .unwrap_or_default()
}

#[tauri::command]
pub fn get_api_key() -> String {
    Config::load()
        .map(|config| config.framework_api_key)
        .unwrap_or_default()
    // "7a779fee04d8486c8bb0f7131b5852b9".to_string()
    // "402ab78d2b5042ec913a6c9b7e3801c7".to_string()
}

#[tauri::command]
pub fn update_config(url: &str, api_key: &str) -> Result<(), String> {
    let mut config = Config::load().unwrap_or_else(|_| Config::default());
    config.framework_url = url.to_string();
    config.framework_api_key = api_key.to_string();
    config.save().map_err(|e| e.to_string())
}

impl Config {
    fn config_dir() -> PathBuf {
        let mut path = dirs::home_dir().expect("Unable to find home directory");
        path.push(".config");
        path.push("eulercopilot");
        path
    }

    fn config_file() -> PathBuf {
        Self::config_dir().join("desktop.json")
    }

    fn default() -> Self {
        Config {
            framework_url: "https://eulercopilot.gitee.com".to_string(),
            framework_api_key: String::new(),
        }
    }

    pub fn load() -> Result<Self> {
        let config_file = Self::config_file();
        if !config_file.exists() {
            return Ok(Self::default());
        }
        let config_str = fs::read_to_string(&config_file)
            .with_context(|| format!("Failed to read config file: {:?}", config_file))?;
        let config: Config = serde_json::from_str(&config_str)
            .with_context(|| format!("Failed to parse config file: {:?}", config_file))?;
        Ok(config)
    }

    pub fn save(&self) -> Result<()> {
        let config_dir = Self::config_dir();
        fs::create_dir_all(&config_dir)
            .with_context(|| format!("Failed to create config directory: {:?}", config_dir))?;

        let config_file = Self::config_file();
        let config_str =
            serde_json::to_string_pretty(&self).with_context(|| "Failed to serialize config")?;
        fs::write(&config_file, config_str)
            .with_context(|| format!("Failed to write config file: {:?}", config_file))?;
        Ok(())
    }
}
