import Foundation
import CryptoKit
import ImageIO
import Darwin

enum FolderFailure: String, Error {
    case clipboard = "clipboard-write-failed"
    case invalid = "native-request-invalid", noFolder = "folder-not-selected"
    case unavailable = "folder-unavailable", cancelled = "folder-selection-cancelled"
    case busy = "save-busy", session = "save-session-invalid", chunk = "save-chunk-invalid"
    case incomplete = "save-incomplete", integrity = "save-integrity-invalid"
    case write = "file-write-failed", permission = "folder-access-denied", space = "file-no-space"
}

final class FolderStore {
    static let chunkBytes = 96 * 1024, maxBytes = 20 * 1024 * 1024
    struct SavedFolder: Codable { let bookmark: Data; let id: String }
    final class Job {
        let ticket = UUID().uuidString, filename: String, hash: String, size: Int, folder: URL
        var bytes = Data(), sequence = 0, clipboard = false
        init(filename: String, hash: String, size: Int, folder: URL) {
            self.filename = filename; self.hash = hash; self.size = size; self.folder = folder
            bytes.reserveCapacity(size)
        }
    }
    let configURL: URL
    let chooseDirectory: (URL?) throws -> URL
    var copyToClipboard: ((Data) throws -> Void)?
    var job: Job?
    var receipt: (ticket: String, result: [String: Any])?

    init(configURL: URL, chooseDirectory: @escaping (URL?) throws -> URL) {
        self.configURL = configURL; self.chooseDirectory = chooseDirectory
    }
    private func resolvedFolder() throws -> (URL, SavedFolder) {
        guard FileManager.default.fileExists(atPath: configURL.path) else { throw FolderFailure.noFolder }
        do {
            let saved = try JSONDecoder().decode(SavedFolder.self, from: Data(contentsOf: configURL))
            var stale = false
            let url = try URL(resolvingBookmarkData: saved.bookmark, options: [.withoutUI], relativeTo: nil, bookmarkDataIsStale: &stale)
            guard try url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory == true else { throw FolderFailure.unavailable }
            if stale { try remember(url, id: saved.id) }
            return (url, saved)
        } catch { throw FolderFailure.unavailable }
    }
    private func remember(_ url: URL, id: String = UUID().uuidString) throws {
        // This local development helper is not App Sandbox enabled. A standard
        // bookmark remembers identity/location; it does not grant OS permissions.
        let bookmark = try url.bookmarkData(options: .minimalBookmark, includingResourceValuesForKeys: nil, relativeTo: nil)
        let saved = SavedFolder(bookmark: bookmark, id: id)
        try FileManager.default.createDirectory(at: configURL.deletingLastPathComponent(), withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
        try JSONEncoder().encode(saved).write(to: configURL, options: .atomic)
        try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: configURL.path)
    }
    private func folderInfo(_ url: URL, id: String) -> [String: Any] {
        ["id": id, "name": url.lastPathComponent, "path": url.path]
    }
    private func selectFolder() throws -> (URL, SavedFolder) {
        let previous = try? resolvedFolder().0
        let selected = try chooseDirectory(previous)
        guard try selected.resourceValues(forKeys: [.isDirectoryKey]).isDirectory == true else { throw FolderFailure.unavailable }
        try remember(selected)
        return try resolvedFolder()
    }
    func handle(_ message: [String: Any]) -> [String: Any] {
        do { return try process(message) }
        catch let error as FolderFailure { return ["error": error.rawValue] }
        catch { return ["error": "native-operation-failed"] }
    }
    private func process(_ message: [String: Any]) throws -> [String: Any] {
        guard message["version"] as? Int == 1, let type = message["type"] as? String else { throw FolderFailure.invalid }
        switch type {
        case "folder.status":
            do {
                let (url, saved) = try resolvedFolder()
                return ["status": "ready", "folder": folderInfo(url, id: saved.id)]
            } catch FolderFailure.noFolder { return ["status": "unselected"] }
        case "folder.choose":
            guard job == nil else { throw FolderFailure.busy }
            let (url, saved) = try selectFolder()
            return ["status": "ready", "folder": folderInfo(url, id: saved.id)]
        case "save.begin", "clipboard.begin":
            guard job == nil else { throw FolderFailure.busy }
            guard let size = message["bytes"] as? Int, (14...Self.maxBytes).contains(size),
                  let filename = message["filename"] as? String, filename.count <= 140,
                  filename.range(of: "^submeta-[0-9]+-[0-9]+-[a-f0-9-]+\\.gif$", options: .regularExpression) != nil,
                  let hash = message["sha256"] as? String, hash.range(of: "^[a-f0-9]{64}$", options: .regularExpression) != nil else { throw FolderFailure.invalid }
            if type == "clipboard.begin" {
                guard copyToClipboard != nil else { throw FolderFailure.clipboard }
                let next = Job(filename: filename, hash: hash, size: size, folder: configURL.deletingLastPathComponent())
                next.clipboard = true; job = next; receipt = nil
                return ["ticket": next.ticket, "chunkBytes": Self.chunkBytes]
            }
            let destination: (URL, SavedFolder)
            do { destination = try resolvedFolder() }
            catch FolderFailure.noFolder { destination = try selectFolder() }
            // Snapshot the selected directory for this operation. Later preference
            // changes in another host process cannot redirect an in-flight save.
            let next = Job(filename: filename, hash: hash, size: size, folder: destination.0)
            job = next; receipt = nil
            return ["ticket": next.ticket, "chunkBytes": Self.chunkBytes, "folder": folderInfo(destination.0, id: destination.1.id)]
        case "save.chunk":
            let current = try activeJob(message)
            guard let sequence = message["seq"] as? Int, sequence == current.sequence,
                  let encoded = message["data"] as? String, encoded.utf8.count <= Self.chunkBytes * 4 / 3,
                  let data = Data(base64Encoded: encoded), !data.isEmpty,
                  data.count == min(Self.chunkBytes, current.size - current.bytes.count) else {
                job = nil; throw FolderFailure.chunk
            }
            current.bytes.append(data); current.sequence += 1
            return ["received": current.bytes.count]
        case "save.abort":
            _ = try activeJob(message); job = nil
            return ["status": "aborted"]
        case "save.finish":
            if let old = receipt, message["ticket"] as? String == old.ticket { return old.result }
            let current = try activeJob(message)
            defer { job = nil }
            guard current.bytes.count == current.size else { throw FolderFailure.incomplete }
            guard String(data: current.bytes.prefix(6), encoding: .ascii) == "GIF89a", current.bytes.last == 0x3b,
                  SHA256.hash(data: current.bytes).map({ String(format: "%02x", $0) }).joined() == current.hash,
                  let source = CGImageSourceCreateWithData(current.bytes as CFData, nil),
                  CGImageSourceGetType(source) as String? == "com.compuserve.gif",
                  (2...150).contains(CGImageSourceGetCount(source)) else { throw FolderFailure.integrity }
            if current.clipboard {
                guard let copy = copyToClipboard else { throw FolderFailure.clipboard }
                try copy(current.bytes)
                let result: [String: Any] = ["status": "copied", "bytes": current.size, "sha256": current.hash,
                                           "formats": ["image/gif", "text/html", "image/png"]]
                receipt = (current.ticket, result)
                return result
            }
            let filename = try writeExclusive(current)
            let result: [String: Any] = ["status": "complete", "filename": filename,
                                       "path": current.folder.appendingPathComponent(filename).path,
                                       "bytes": current.size, "sha256": current.hash,
                                       "folder": ["name": current.folder.lastPathComponent, "path": current.folder.path]]
            receipt = (current.ticket, result)
            return result
        default: throw FolderFailure.invalid
        }
    }
    private func activeJob(_ message: [String: Any]) throws -> Job {
        guard let current = job, message["ticket"] as? String == current.ticket else { throw FolderFailure.session }
        return current
    }
    private func ioFailure() -> FolderFailure {
        if errno == EACCES || errno == EPERM { return .permission }
        if errno == ENOSPC || errno == EDQUOT { return .space }
        return .write
    }
    private func writeExclusive(_ current: Job) throws -> String {
        let directory = open(current.folder.path, O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC)
        guard directory >= 0 else { throw FolderFailure.unavailable }
        defer { close(directory) }
        let temporary = ".submeta-\(UUID().uuidString).part"
        let descriptor = openat(directory, temporary, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, mode_t(0o600))
        guard descriptor >= 0 else { throw ioFailure() }
        defer { close(descriptor); unlinkat(directory, temporary, 0) }
        try current.bytes.withUnsafeBytes { buffer in
            var offset = 0
            while offset < buffer.count {
                let count = Darwin.write(descriptor, buffer.baseAddress!.advanced(by: offset), buffer.count - offset)
                if count < 0 && errno == EINTR { continue }
                guard count > 0 else { throw ioFailure() }
                offset += count
            }
        }
        guard fsync(descriptor) == 0 else { throw ioFailure() }
        // linkat publishes a complete file atomically and never replaces an
        // existing file or follows a destination symlink. Temp stays same-volume.
        for attempt in 0..<20 {
            let filename = attempt == 0 ? current.filename : String(current.filename.dropLast(4)) + "-\(UUID().uuidString.lowercased()).gif"
            if linkat(directory, temporary, directory, filename, 0) == 0 {
                _ = fsync(directory)
                return filename
            }
            if errno != EEXIST { throw ioFailure() }
        }
        throw FolderFailure.write
    }
}
