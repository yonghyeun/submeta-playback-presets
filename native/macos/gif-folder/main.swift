import AppKit
import Foundation

// Firefox supplies its manifest path and the permitted extension id. The
// browser allowlist is the trust boundary; this is an additional sanity check.
let allowedCallers = ["gif-export-poc@submeta.local", "playback-preset@submeta.local",
                      "chrome-extension://phmolfcajpjaalohghgmgpehedpeagan/"]
guard CommandLine.arguments.contains(where: { allowedCallers.contains($0) }) else { exit(64) }
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let config = FileManager.default.homeDirectoryForCurrentUser
    .appendingPathComponent("Library/Application Support/Submeta GIF Folder/folder.json")
let store = FolderStore(configURL: config) { previous in
    try DispatchQueue.main.sync {
        app.activate(ignoringOtherApps: true)
        let panel = NSOpenPanel()
        panel.title = "GIF 저장 폴더"
        panel.message = "이 폴더를 다음 저장에도 사용합니다. GIF 패널에서 언제든 변경할 수 있습니다."
        panel.prompt = "이 폴더 사용"
        panel.canChooseFiles = false; panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false; panel.canCreateDirectories = true
        panel.directoryURL = previous ?? FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first
        guard panel.runModal() == .OK, let url = panel.url else { throw FolderFailure.cancelled }
        return url
    }
}
store.copyToClipboard = { bytes in try DispatchQueue.main.sync { try copyGIF(bytes) } }
func readExactly(_ count: Int) throws -> Data? {
    var data = Data()
    while data.count < count {
        guard let next = try FileHandle.standardInput.read(upToCount: count - data.count), !next.isEmpty else { return nil }
        data.append(next)
    }
    return data
}
DispatchQueue.global(qos: .userInitiated).async {
    defer { DispatchQueue.main.async { app.terminate(nil) } }
    do {
        while let header = try readExactly(4) {
            let count = header.enumerated().reduce(UInt32(0)) { $0 | UInt32($1.element) << UInt32($1.offset * 8) }
            guard count > 0 && count <= 256 * 1024, let body = try readExactly(Int(count)),
                  let request = try JSONSerialization.jsonObject(with: body) as? [String: Any],
                  let sequence = request["requestId"] as? Int, sequence > 0 else { return }
            var response = store.handle(request)
            response["requestId"] = sequence
            let data = try JSONSerialization.data(withJSONObject: response, options: [.sortedKeys])
            var length = UInt32(data.count).littleEndian
            try withUnsafeBytes(of: &length) { try FileHandle.standardOutput.write(contentsOf: Data($0)) }
            try FileHandle.standardOutput.write(contentsOf: data)
        }
    } catch { /* Never write diagnostics to the native JSON stdout stream. */ }
}
app.run()
