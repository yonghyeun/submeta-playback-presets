import Foundation
import CryptoKit

@main struct FolderStoreTests {
    static func main() throws {
        guard CommandLine.arguments.count == 2 else { fatalError("Pass an actual Submeta GIF saved by the browser") }
        let bytes = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
        let hash = SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined()
        let root = URL(fileURLWithPath: "/private/tmp/submeta-folder-tests-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        let folderA = root.appendingPathComponent("한국어 GIF A", isDirectory: true)
        let folderB = root.appendingPathComponent("GIF B", isDirectory: true)
        for folder in [folderA, folderB] { try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true) }
        let config = root.appendingPathComponent("config/folder.json")
        var selections = 0
        let first = FolderStore(configURL: config) { _ in selections += 1; return folderA }
        func call(_ store: FolderStore, _ type: String, _ fields: [String: Any] = [:]) -> [String: Any] {
            store.handle(fields.merging(["version": 1, "type": type]) { _, rhs in rhs })
        }
        let metadata: [String: Any] = ["bytes": bytes.count, "sha256": hash, "filename": "submeta-30000-35000-aabb.gif"]
        func begin(_ store: FolderStore) -> String {
            let response = call(store, "save.begin", metadata)
            guard let ticket = response["ticket"] as? String else { fatalError("\(response)") }
            return ticket
        }
        func upload(_ store: FolderStore, _ ticket: String) {
            for (sequence, offset) in stride(from: 0, to: bytes.count, by: FolderStore.chunkBytes).enumerated() {
                let end = min(bytes.count, offset + FolderStore.chunkBytes)
                let response = call(store, "save.chunk", ["ticket": ticket, "seq": sequence, "data": bytes.subdata(in: offset..<end).base64EncodedString()])
                precondition(response["received"] as? Int == end, "\(response)")
            }
        }
        func save(_ store: FolderStore) throws -> [String: Any] {
            let ticket = begin(store); upload(store, ticket)
            let response = call(store, "save.finish", ["ticket": ticket])
            precondition(response["status"] as? String == "complete", "\(response)")
            let path = response["path"] as! String
            let written = try Data(contentsOf: URL(fileURLWithPath: path))
            precondition(written == bytes)
            let replay = call(store, "save.finish", ["ticket": ticket])
            precondition(replay["path"] as? String == path, "Same finish must not create another file")
            return response
        }
        precondition(call(first, "folder.status")["status"] as? String == "unselected")
        let a = try save(first)
        precondition(selections == 1)
        let second = FolderStore(configURL: config) { _ in fatalError("Remembered folder must not prompt again") }
        let b = try save(second)
        precondition(a["path"] as? String != b["path"] as? String, "Never overwrite an existing file")
        precondition((b["path"] as! String).hasPrefix(folderA.path + "/"))
        let cancel = FolderStore(configURL: config) { _ in throw FolderFailure.cancelled }
        precondition(call(cancel, "folder.choose")["error"] as? String == "folder-selection-cancelled")
        precondition((call(cancel, "folder.status")["folder"] as! [String: Any])["path"] as? String == folderA.path)
        let change = FolderStore(configURL: config) { _ in folderB }
        precondition(call(change, "folder.choose")["status"] as? String == "ready")
        let third = FolderStore(configURL: config) { _ in fatalError("New folder must persist") }
        let c = try save(third)
        precondition((c["path"] as! String).hasPrefix(folderB.path + "/"))
        precondition(call(third, "save.begin", metadata.merging(["filename": "../escape.gif"]) { _, rhs in rhs })["error"] as? String == "native-request-invalid")
        precondition(call(third, "save.begin", metadata.merging(["bytes": FolderStore.maxBytes + 1]) { _, rhs in rhs })["error"] as? String == "native-request-invalid")
        let bad = begin(third)
        precondition(call(third, "save.chunk", ["ticket": bad, "seq": 1, "data": ""])["error"] as? String == "save-chunk-invalid")
        let incomplete = begin(third)
        precondition(call(third, "save.finish", ["ticket": incomplete])["error"] as? String == "save-incomplete")
        let damaged = call(third, "save.begin", metadata.merging(["sha256": String(repeating: "0", count: 64)]) { _, rhs in rhs })["ticket"] as! String
        upload(third, damaged)
        precondition(call(third, "save.finish", ["ticket": damaged])["error"] as? String == "save-integrity-invalid")
        for folder in [folderA, folderB] {
            let files = try FileManager.default.contentsOfDirectory(atPath: folder.path)
            precondition(files.allSatisfy { !$0.hasSuffix(".part") })
        }
        try FileManager.default.removeItem(at: folderB)
        precondition(call(third, "folder.status")["error"] as? String == "folder-unavailable")
        precondition(call(third, "save.begin", metadata)["error"] as? String == "folder-unavailable")
        print("Actual GIF bytes preserved; folder reuse/reopen/change/cancel, collision, bounds, integrity and removed-folder checks passed")
    }
}
