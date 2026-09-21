# Mac GIF companion 0.4.0

Optional companion for Playback Presets for Submeta in Firefox and Chrome. GIF generation and ordinary file saving work without it. Remembering a folder and copying an original GIF file require this companion.

Download [submeta-gif-folder-0.4.0-macos.zip](https://github.com/yonghyeun/submeta-playback-presets/releases/download/v0.4.0/submeta-gif-folder-0.4.0-macos.zip) from the [0.4.0 release](https://github.com/yonghyeun/submeta-playback-presets/releases/tag/v0.4.0). Extract the archive, then run `python3 install.py` from the extracted directory. Python 3 is required. No administrator access is needed. It registers only the Firefox extension playback-preset@submeta.local (and its GIF development preview) and Chrome Web Store item phmolfcajpjaalohghgmgpehedpeagan.

This locally built companion is ad-hoc signed, not Apple notarized. macOS may prevent execution on another computer. Do not disable OS protections; use ordinary GIF file saving if the companion cannot run. Windows and Linux companion support is not included.

Files: ~/Library/Application Support/Submeta GIF Folder contains the app and folder bookmark. Browser registrations live in Library/Application Support/Mozilla/NativeMessagingHosts and Google/Chrome/NativeMessagingHosts. Clipboard GIFs remain in ~/Library/Caches/Submeta GIF Clipboard so pasted file references remain valid. Same GIF content reuses its cache file. Removing that cache can invalidate pending pastes; it does not delete GIFs saved to your chosen folder.

The companion only receives GIF bytes from the allowlisted extension, validates the format/size/hash, and writes to your selected folder or clipboard cache. It does not read the previous clipboard, Photos library, passwords or browser cookies and does not transmit data to a server.

To uninstall, remove Submeta GIF Folder.app and the two io.submeta_player.gif_folder.json registrations. Remove folder.json and the clipboard cache separately if you also want to erase preferences/cache. User-saved GIF files remain untouched.
