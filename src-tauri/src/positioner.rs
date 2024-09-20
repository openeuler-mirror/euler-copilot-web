// Copyright 2021 Jonas Kruckenberg
// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

use tauri::{PhysicalPosition, PhysicalSize, Result, Runtime, Window};

/// A [`Window`] extension that provides extra methods related to positioning.
pub trait WindowExt {
    /// Moves the [`Window`] to the given [`Position`]
    ///
    /// All positions are relative to the **current** screen.
    fn setup_window_pos(&self) -> Result<()>;
}

impl<R: Runtime> WindowExt for Window<R> {
    fn setup_window_pos(&self) -> Result<()> {
        let window_padding = 24;
        let window_vertical_offset = 192;

        let screen = self.current_monitor()?.unwrap();
        let screen_position = screen.position();
        let screen_size = PhysicalSize::<i32> {
            width: screen.size().width as i32,
            height: screen.size().height as i32,
        };
        let window_size = PhysicalSize::<i32> {
            width: self.outer_size()?.width as i32,
            height: self.outer_size()?.height as i32,
        };

        let physical_pos = PhysicalPosition {
            x: screen_position.x + (screen_size.width - window_size.width - window_padding),
            y: screen_position.y + window_vertical_offset,
        };

        let physical_size = PhysicalSize::<u32> {
            width: window_size.width as u32,
            height: (screen_size.height - 2 * window_vertical_offset) as u32,
        };

        self.set_position(tauri::Position::Physical(physical_pos))?;
        self.set_size(tauri::Size::Physical(physical_size))?;

        Ok(())
    }
}
