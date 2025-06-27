## v1.1.1
*April 13, 2025 (Hotfix)*

- Changed asset URLs to be hosted only on the glitch.me domain

## v1.1.0
*April 13, 2025 - The Interpolation Update*

- New property: Scale (using the in-game `minecraft:scale` attribute)
- The Rotation property has been expanded to allow support for the rotation Y-axis (despite it not showing any changes when rendering the physical entity in-game)
- Adjusted title styling for easier readability
- Properties, Events and Project Settings are now tabs and can be chosen manually rather than the program inferring which one to show
- Markers have now been split into their specific properties.
  - One marker per axis, per bone instead of one marker per frame allows for more creative freedom and better customizability
- The cursor is now detached from the scrollbar
  - Hovering over the cursor now shows the relevant timestamp, in seconds and ticks
  - You can drag the cursor left and right to move it, and it will snap to the ticks grid
  - All relevant editing is now attached to the cursor's position
- The Properties screen has been reworked to better resemble popular animation software
  - For each property text box, an adjacent diamond button will show whether a marker is present at the current cursor position
    - Clicking this button when deactivated will create a marker at the cursor position
    - If the button is activated, it will remove the associated marker instead
  - Left and right buttons on either side of the diamond will allow you to quick-scroll to the previous or next markers
  - If a marker exists at the current position, an interpolation mode will also show. 
- New marker interpolation modes: "ease-in" and "ease-out"
  - The math of these options is available [here](https://www.desmos.com/calculator/w4tqkpwg6z) thanks to [easings.net](https://easings.net/)
  - Interpolation modes are now represented with a graph icon
- Removed Half Time and Double Time options due to glitches
- Replaced YMCA example file with Sigh Cry
- Added a new "Preview Audio" feature where you can view a waveform along with your animation
  - Audio is not synced to the project and will disappear upon page reload
- Changed the background color of the 3D Model Renderer to better match the app's colour palette
- Add Forward Direction and Rotation Direction indicator arrows
  - These can both be toggled in View settings.
- Removed "Highlight Marker Changes" settings as the new Properties screen does a good enough job of demonstrating values
- The project filename is now shown at the top of the editor
- Added this page!

## v1.0.2
- Fixed a bug where moving multiple markers would sometimes unexpectedly merge them with previously existsing ones
- Fixed a bug where manually moving markers to a specific position would fail to merge them

## v1.0.1
- Added exporting as a reduced function file.
  - This removes all repeating frames and speeds up animation times but may decrease accuracy in some cases.
  - It can also help reduce file sizes
