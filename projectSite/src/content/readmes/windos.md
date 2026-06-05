# WinDoS - A Zero-Privilege Denial of Service via window handles


> **⚠️ DISCLAIMER:** This repository, including the Proof of Concept (PoC) source code and documentation, is provided for **educational and defensive research purposes only**. Do not use this software on systems you do not own or have explicit permission to test. 

## Overview

This repository details a Proof of Concept (PoC) Denial of Service (DoS) attack against modern Windows operating systems (tested on Windows 11 Build # 28020.1873, and 29570.1000). 

By exploiting the architectural limitations of how Windows manages graphical objects, an unprivileged user can completely freeze the operating system. This attack renders the keyboard, Task Manager, and even the Secure Attention Sequence (Ctrl+Alt+Del) completely useless. Because it does not rely on maxing out the CPU or endlessly duplicating itself (like a traditional fork-bomb), it flies completely under the radar of system monitors and modern antivirus solutions, including Windows Defender.

## The Technical Meat: How the Exploit Works

The core of this exploit lies in the abuse of the `USER32.dll` subsystem and the Desktop Window Manager (DWM). The PoC utilizes standard Win32 API calls to rapidly spawn tens of thousands of hidden windows.

### Process Architecture
Windows imposes a strict per-process limit on handles. To bypass this, the PoC uses a multi-process approach:
1. When launched, the program checks if it is running in `--child-mode`.
2. If not, it uses `ShellExecuteExW` to spawn four child instances of itself.
3. Each process launches multiple threads (based on hardware concurrency) to rapidly call `CreateWindowEx`.
4. Windows are created with the `WS_EX_TOOLWINDOW` style and **no** `WS_VISIBLE` flag, ensuring they never appear on the taskbar or screen.

By distributing the load across multiple processes, the PoC bypasses the per-process quota and attacks the **global session limit**.

### DWM Starvation
The PoC includes an `ExplorerWatcher` function that monitors `explorer.exe`. Once Explorer crashes or restarts, the PoC triggers a rapid spawn of windows. The sudden reallocation of thousands of handles during Explorer's fragile startup phase completely breaks the DWM's rendering pipeline. The UI thread deadlocks, preventing any input processing.

## Correcting the Handle Quota Misconception

A common piece of advice for mitigating handle exhaustion is to modify the registry to increase the handle quota at:
`HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Windows`

Many users attempt to modify `GDIProcessHandleQuota`. However, this PoC exhausts **USER handles** (interface elements like HWNDs), not GDI handles. The correct registry key governing this limit is `USERProcessHandleQuota`.

### The Real Limits
There is a strict, hardcoded ceiling enforced by the Windows kernel:
* **Default Value:** 10,000 handles per process.
* **Maximum Allowed Value:** 18,000 handles per process.
* **Global Session Limit:** 65,536 handles across the entire Windows session.

### Why the "Mitigation" Makes it Worse
If a user increases `USERProcessHandleQuota` to its maximum of 18,000, they are allowing a single process to consume a massive chunk of the 65,536 global session limit. 

When the PoC runs under these "mitigated" conditions, its 4 child processes can allocate up to 18,000 handles each (4 × 18,000 = 72,000). This instantly blows past the 65,536 hard session limit, leaving **zero** handles available for critical system processes like `dwm.exe`, `csrss.exe`, or `explorer.exe`. Instead of mitigating the attack, increasing the quota hands the attacker the keys to instantly brick the session.

## Weaponization and Persistence

The true danger of this PoC is how easily it can be weaponized. Because it does not rely on memory corruption, buffer overflows, or known malware signatures, it is completely ignored by Windows Defender and most EDR solutions.

If an attacker chains this executable with a simple persistence mechanism (e.g., placing a shortcut in the user's `Startup` folder or adding a string to the `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` registry key), the results are devastating. Upon login, the PoC executes immediately, starving the DWM of handles before the user can open Task Manager to intervene. This effectively bricks the operating system for that user profile, requiring Safe Mode or external recovery media to remediate.

## Call to Action: How Microsoft Can Fix This

This architectural flaw stems from the legacy design of the Win32 subsystem. Allowing unprivileged user-space applications to starve critical system processes of basic UI handles is an unacceptable risk. 

Proposed mitigations for Microsoft include:

1. **Handle Reservations:** The OS should reserve a guaranteed pool of USER and GDI handles exclusively for `dwm.exe`, `csrss.exe`, and `LogonUI.exe`. Even if a user application exhausts the session quota, system processes would still have the resources required to render the Secure Attention Sequence (Ctrl+Alt+Del) and Task Manager.
2. **Heuristic Rate Limiting:** Implement a rate limit on invisible window creation. If a process attempts to create 10,000 hidden windows in under a second, the OS should throttle the `CreateWindowEx` API call for that specific PID.

Until such mitigations are implemented at the kernel/subsystem level, system administrators must be aware that DoS attacks do not always look like CPU spikes or memory leaks. Sometimes, they are just invisible windows, quietly taking all the tickets.