import AppKit
import ImageIO
import CryptoKit

// File URLs let receiving apps import the original animation instead of
// decoding an image representation into a single frame. Never advertise PNG.
func copyGIF(_ bytes: Data, to pasteboard: NSPasteboard = .general,
             cacheDirectory: URL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
                .appendingPathComponent("Submeta GIF Clipboard", isDirectory: true)) throws {
    guard let source = CGImageSourceCreateWithData(bytes as CFData, nil),
          CGImageSourceGetCount(source) > 1,
          let frame = CGImageSourceCreateImageAtIndex(source, 0, nil),
          frame.width <= 480, frame.height <= 480 else { throw FolderFailure.integrity }
    let digest = SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined()
    try FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true,
                                          attributes: [.posixPermissions: 0o700])
    let file = cacheDirectory.appendingPathComponent("submeta-\(digest).gif")
    // Immutable content-addressed files keep earlier clipboard references valid.
    // Complete the file before changing the user's clipboard.
    try bytes.write(to: file, options: .atomic)
    try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: file.path)
    let item = NSPasteboardItem()
    guard item.setString(file.absoluteString, forType: .fileURL) else { throw FolderFailure.clipboard }
    pasteboard.clearContents()
    guard pasteboard.writeObjects([item]) else { throw FolderFailure.clipboard }
}
