import AppKit
import CryptoKit
import ImageIO

@main struct ClipboardTests {
    static func main() throws {
        let bytes = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
        let hash = SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined()
        let board = NSPasteboard.withUniqueName()
        defer { board.releaseGlobally() }
        let cache = URL(fileURLWithPath: "/private/tmp/submeta-clipboard-cache-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: cache) }
        let config = URL(fileURLWithPath: "/private/tmp/submeta-clipboard-\(UUID().uuidString)/folder.json")
        let store = FolderStore(configURL: config) { _ in fatalError("Clipboard must not open folder chooser") }
        var copies = 0
        store.copyToClipboard = { data in copies += 1; try copyGIF(data, to: board, cacheDirectory: cache) }
        func request(_ type: String, _ payload: [String: Any] = [:]) -> [String: Any] {
            var message = payload; message["version"] = 1; message["type"] = type
            return store.handle(message)
        }
        func transfer(_ digest: String) -> String {
            let begin = request("clipboard.begin", ["bytes": bytes.count, "filename": "submeta-30-35-abcd.gif", "sha256": digest])
            precondition(begin["folder"] == nil)
            let ticket = begin["ticket"] as! String
            for (seq, offset) in stride(from: 0, to: bytes.count, by: FolderStore.chunkBytes).enumerated() {
                let end = min(bytes.count, offset + FolderStore.chunkBytes)
                let response = request("save.chunk", ["ticket": ticket, "seq": seq, "data": bytes.subdata(in: offset..<end).base64EncodedString()])
                precondition(response["received"] as? Int == end)
            }
            return ticket
        }
        let badTicket = transfer(String(repeating: "0", count: 64))
        precondition(request("save.finish", ["ticket": badTicket])["error"] as? String == "save-integrity-invalid")
        precondition(copies == 0)
        let ticket = transfer(hash)
        precondition(request("save.finish", ["ticket": ticket])["status"] as? String == "copied")
        precondition(request("save.finish", ["ticket": ticket])["status"] as? String == "copied")
        precondition(copies == 1, "Repeating finish must not overwrite clipboard again")
        precondition(board.string(forType: .html) == nil)
        precondition(board.data(forType: .png) == nil)
        precondition(board.data(forType: .tiff) == nil)
        let file = URL(string: board.string(forType: .fileURL)!)!
        precondition(file.pathExtension == "gif")
        let fileBytes = try Data(contentsOf: file)
        precondition(fileBytes == bytes)
        let image = CGImageSourceCreateWithData(fileBytes as CFData, nil)!
        precondition(CGImageSourceGetCount(image) > 1)
        precondition(!FileManager.default.fileExists(atPath: config.deletingLastPathComponent().path))
        print("Real GIF clipboard protocol, byte preservation, animated GIF file URL, no PNG/TIFF, no selected-folder writes and retry guards passed")
    }
}
