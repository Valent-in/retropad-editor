# RetroPad Editor
Online tool to create and edit onscreen gamepads for RetroArch.

https://valent-in.github.io/retropad-editor/

Features:
- Create, move, resize buttons of virtual gamepad.
- Multiple layers; auto switch orientation for portrait overlays.
- Fix overlay aspect ratio.
- Can use external image resources.

Config file and images must be stored in same folder.
On most Android devices RetroArch will open config only from internal memory even access to sdcard is granted.
- This editor can load but NOT save configs with image paths (img/A.png will be saved as A.png)
- Does not support old (integer) format.
---
Used media resources from https://github.com/libretro/common-overlays (button images) and https://github.com/libretro/RetroArch (icon).
