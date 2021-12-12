# RetroPad Editor
Online tool to create and edit onscreen gamepads for RetroArch.

https://valent-in.github.io/retropad-editor/

Features:
- Create, move, resize buttons of virtual gamepad.
- Multiple layers; auto switch orientation for portrait overlays.
- Fix overlay aspect ratio.
- Import image resources in addition to 'flat' image set.
- Scale viewport for comfortable editing on small screens.
- Display sensitivity range for analog sticks.
- Old format support (auto normalize integer overlays).
- Non-fullscreen overlays support.

Config file and images must be stored in same folder.
On most Android devices RetroArch will open config only from internal memory even access to sdcard is granted.
- This editor can load but NOT save configs with image paths (img/A.png will be saved as A.png)
---
Libretro Docs: https://docs.libretro.com/development/retroarch/input/overlay/

Used media resources from https://github.com/libretro/common-overlays (button images) and https://github.com/libretro/RetroArch (icon).

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY.