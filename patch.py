import os

filename = 'index.html'

if not os.path.exists(filename):
    print(f"Error: Could not find {filename}")
    exit()

with open(filename, 'r', encoding='utf-8') as f:
    html = f.read()

old_open = """    const fileHandle = await savedFolderHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();"""

new_open = """    let fileHandle = null;
    const targetNormalized = filename.toLowerCase().replace('vol', 'v').replace(/[^a-z0-9.]/g, '');
    
    try {
      // 1. Try exact match first
      fileHandle = await savedFolderHandle.getFileHandle(filename);
    } catch (e) {
      // 2. If exact match fails, fuzzy match all files in the folder
      for await (const entry of savedFolderHandle.values()) {
        if (entry.kind === 'file') {
          const entryNormalized = entry.name.toLowerCase().replace('vol', 'v').replace(/[^a-z0-9.]/g, '');
          if (entryNormalized === targetNormalized) {
            fileHandle = entry;
            break;
          }
        }
      }
    }
    
    if (!fileHandle) throw new Error("File not found");
    
    const file = await fileHandle.getFile();"""

if old_open in html:
    html = html.replace(old_open, new_open)
    print("✅ File lookup is now robust and case-insensitive.")
else:
    print("Warning: Could not find the file opening logic. It may have already been patched.")

with open(filename, 'w', encoding='utf-8') as f:
    f.write(html)