var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/data/admin.js
var adminUsers, adminSubmissions, auditLogs;
var init_admin = __esm({
  "src/data/admin.js"() {
    adminUsers = [
      { id: 1, username: "ShadowRoot", email: "shadowroot@proton.me", role: "admin", points: 8920, solved: 67, status: "active", joinDate: "2025-01-12", lastActive: "2026-09-21" },
      { id: 2, username: "NullByte", email: "nullbyte@tutanota.com", role: "moderator", points: 8450, solved: 63, status: "active", joinDate: "2025-02-03", lastActive: "2026-09-21" },
      { id: 3, username: "CyberFox", email: "cyberfox@mail.ru", role: "user", points: 8120, solved: 61, status: "active", joinDate: "2025-02-18", lastActive: "2026-09-20" },
      { id: 4, username: "PacketHunter", email: "packethunter@qq.com", role: "user", points: 7850, solved: 58, status: "active", joinDate: "2025-03-01", lastActive: "2026-09-19" },
      { id: 5, username: "r3v3rs3r", email: "reverser@gmx.net", role: "user", points: 7420, solved: 55, status: "active", joinDate: "2025-03-22", lastActive: "2026-09-21" },
      { id: 6, username: "ByteWitch", email: "bytewitch@outlook.com", role: "moderator", points: 7100, solved: 52, status: "active", joinDate: "2025-04-05", lastActive: "2026-09-20" },
      { id: 7, username: "cr4ckm3", email: "crackme@laposte.net", role: "user", points: 6800, solved: 49, status: "active", joinDate: "2025-04-27", lastActive: "2026-09-18" },
      { id: 8, username: "TerminalGhost", email: "ghost@ymail.com", role: "user", points: 6550, solved: 47, status: "suspended", joinDate: "2025-05-11", lastActive: "2026-08-30" },
      { id: 9, username: "PhishFinder", email: "phishfinder@zoho.com", role: "user", points: 6230, solved: 45, status: "active", joinDate: "2025-05-30", lastActive: "2026-09-21" },
      { id: 10, username: "xpl01ter", email: "xploiter@fastmail.com", role: "user", points: 5980, solved: 43, status: "active", joinDate: "2025-06-14", lastActive: "2026-09-17" },
      { id: 11, username: "CipherSage", email: "cipsage@mail.com", role: "user", points: 5710, solved: 41, status: "active", joinDate: "2025-06-29", lastActive: "2026-09-21" },
      { id: 12, username: "n3tw0rk3r", email: "networker@protonmail.com", role: "user", points: 5460, solved: 39, status: "banned", joinDate: "2025-07-10", lastActive: "2026-07-02" },
      { id: 13, username: "MalwareMike", email: "mikemal@outlook.com", role: "user", points: 5200, solved: 37, status: "active", joinDate: "2025-07-26", lastActive: "2026-09-19" },
      { id: 14, username: "FlagCatcher", email: "flagcatcher@gmx.com", role: "user", points: 4980, solved: 35, status: "active", joinDate: "2025-08-08", lastActive: "2026-09-16" },
      { id: 15, username: "InfiniteLoop", email: "loop@tuta.io", role: "user", points: 4750, solved: 33, status: "active", joinDate: "2025-08-21", lastActive: "2026-09-15" },
      { id: 16, username: "h4ck3r_x", email: "hacker@cyberforge.io", role: "user", points: 1450, solved: 24, status: "active", joinDate: "2025-08-15", lastActive: "2026-09-21" }
    ];
    adminSubmissions = [
      { id: 501, user: "ShadowRoot", challenge: "SQL Injection Primer", flag: "CTF{sql1_1nj3ct10n_101}", status: "correct", points: 100, submittedAt: "2026-09-21 09:14:02" },
      { id: 502, user: "NullByte", challenge: "JWT Jailbreak", flag: "CTF{jwt_n0ne_alg}", status: "correct", points: 200, submittedAt: "2026-09-21 09:12:44" },
      { id: 503, user: "CyberFox", challenge: "SQL Injection Primer", flag: "CTF{wrong_flag_guess}", status: "wrong", points: 0, submittedAt: "2026-09-21 09:05:18" },
      { id: 504, user: "PacketHunter", challenge: "Packet Phantom", flag: "CTF{p4ck3t_c4ptur3}", status: "correct", points: 150, submittedAt: "2026-09-21 08:58:31" },
      { id: 505, user: "r3v3rs3r", challenge: "Memory Dump Mayhem", flag: "CTF{m3t4d4t4_f0r3ns1cs}", status: "correct", points: 230, submittedAt: "2026-09-21 08:47:09" },
      { id: 506, user: "ByteWitch", challenge: "Base64 Labyrinth", flag: "CTF{base64_1s_n0t_3ncrypt10n}", status: "correct", points: 75, submittedAt: "2026-09-21 08:31:55" },
      { id: 507, user: "cr4ckm3", challenge: "XSS Playground", flag: "CTF{pr0ph3t_0f_4l3rts}", status: "correct", points: 125, submittedAt: "2026-09-21 08:20:47" },
      { id: 508, user: "TerminalGhost", challenge: "JWT Jailbreak", flag: "CTF{n0pe_n0t_th3_fl4g}", status: "wrong", points: 0, submittedAt: "2026-09-21 07:58:12" },
      { id: 509, user: "PhishFinder", challenge: "OSINT Framework", flag: "CTF{0s1nt_f33ds_th3_hunt}", status: "correct", points: 160, submittedAt: "2026-09-21 07:44:33" },
      { id: 510, user: "xpl01ter", challenge: "SQL Injection Primer", flag: "CTF{' OR 1=1 --'}", status: "correct", points: 100, submittedAt: "2026-09-21 07:30:20" },
      { id: 511, user: "CipherSage", challenge: "RSA Oracle", flag: "CTF{sm4ll_pr1m3s_4re_d4ng3r}", status: "correct", points: 180, submittedAt: "2026-09-21 07:12:05" },
      { id: 512, user: "n3tw0rk3r", challenge: "WiFi Deauth", flag: "CTF{d3auth_4tt4ck}", status: "correct", points: 110, submittedAt: "2026-09-21 06:54:41" },
      { id: 513, user: "MalwareMike", challenge: "XSS Playground", flag: "CTF{xss_but_wr0ng_pl4ygr0und}", status: "wrong", points: 0, submittedAt: "2026-09-21 06:40:19" },
      { id: 514, user: "FlagCatcher", challenge: "Stego Myth", flag: "CTF{b1ts_0f_h1dd3n_data}", status: "correct", points: 90, submittedAt: "2026-09-21 06:22:58" },
      { id: 515, user: "InfiniteLoop", challenge: "Socket Interface", flag: "CTF{s0cket_pr0t0c0l}", status: "correct", points: 130, submittedAt: "2026-09-21 05:50:36" }
    ];
    auditLogs = [
      { id: 1, actor: "ShadowRoot", action: "challenge.update", target: "JWT Jailbreak", ip: "192.168.1.104", timestamp: "2026-09-21 09:02:15" },
      { id: 2, actor: "NullByte", action: "user.suspend", target: "TerminalGhost", ip: "10.0.0.42", timestamp: "2026-09-21 08:55:37" },
      { id: 3, actor: "ShadowRoot", action: "challenge.publish", target: "Packet Phantom", ip: "192.168.1.104", timestamp: "2026-09-21 08:41:20" },
      { id: 4, actor: "ByteWitch", action: "category.create", target: "Mobile Security", ip: "172.16.0.7", timestamp: "2026-09-21 08:12:48" },
      { id: 5, actor: "ShadowRoot", action: "settings.update", target: "Platform Settings", ip: "192.168.1.104", timestamp: "2026-09-21 07:48:03" },
      { id: 6, actor: "NullByte", action: "submission.review", target: "512", ip: "10.0.0.42", timestamp: "2026-09-21 07:30:59" },
      { id: 7, actor: "ShadowRoot", action: "challenge.delete", target: "Vulnerable Vault", ip: "192.168.1.104", timestamp: "2026-09-21 07:05:11" },
      { id: 8, actor: "ByteWitch", action: "user.promote", target: "PacketHunter", ip: "172.16.0.7", timestamp: "2026-09-21 06:44:27" },
      { id: 9, actor: "NullByte", action: "challenge.update", target: "Base64 Labyrinth", ip: "10.0.0.42", timestamp: "2026-09-21 06:19:50" },
      { id: 10, actor: "ShadowRoot", action: "submission.review", target: "508", ip: "192.168.1.104", timestamp: "2026-09-21 05:58:32" },
      { id: 11, actor: "ByteWitch", action: "settings.update", target: "Platform Settings", ip: "172.16.0.7", timestamp: "2026-09-21 05:40:16" },
      { id: 12, actor: "NullByte", action: "user.ban", target: "n3tw0rk3r", ip: "10.0.0.42", timestamp: "2026-09-21 05:21:44" },
      { id: 13, actor: "ShadowRoot", action: "challenge.create", target: "Stego Myth", ip: "192.168.1.104", timestamp: "2026-09-21 04:59:08" },
      { id: 14, actor: "ByteWitch", action: "challenge.publish", target: "WiFi Deauth", ip: "172.16.0.7", timestamp: "2026-09-21 04:33:26" },
      { id: 15, actor: "NullByte", action: "submission.review", target: "507", ip: "10.0.0.42", timestamp: "2026-09-21 04:02:57" }
    ];
  }
});

// src/data/solves.js
var solveEvents;
var init_solves = __esm({
  "src/data/solves.js"() {
    solveEvents = [
      { id: 1, challengeId: 1, user: "ShadowRoot", correct: true, submittedAt: "2026-09-18 14:22:01" },
      { id: 2, challengeId: 1, user: "NullByte", correct: true, submittedAt: "2026-09-18 14:40:12" },
      { id: 3, challengeId: 3, user: "CyberFox", correct: true, submittedAt: "2026-09-18 15:03:44" },
      { id: 4, challengeId: 5, user: "PacketHunter", correct: true, submittedAt: "2026-09-18 16:11:09" },
      { id: 5, challengeId: 2, user: "ShadowRoot", correct: false, submittedAt: "2026-09-18 16:33:27" },
      { id: 6, challengeId: 2, user: "ShadowRoot", correct: true, submittedAt: "2026-09-18 16:38:52" },
      { id: 7, challengeId: 1, user: "r3v3rs3r", correct: true, submittedAt: "2026-09-19 09:12:18" },
      { id: 8, challengeId: 7, user: "ByteWitch", correct: true, submittedAt: "2026-09-19 09:55:31" },
      { id: 9, challengeId: 13, user: "cr4ckm3", correct: true, submittedAt: "2026-09-19 10:20:47" },
      { id: 10, challengeId: 15, user: "TerminalGhost", correct: true, submittedAt: "2026-09-19 11:02:24" },
      { id: 11, challengeId: 9, user: "PhishFinder", correct: true, submittedAt: "2026-09-19 11:48:15" },
      { id: 12, challengeId: 11, user: "xpl01ter", correct: false, submittedAt: "2026-09-19 12:11:53" },
      { id: 13, challengeId: 11, user: "xpl01ter", correct: true, submittedAt: "2026-09-19 12:17:38" },
      { id: 14, challengeId: 16, user: "CipherSage", correct: true, submittedAt: "2026-09-20 08:30:05" },
      { id: 15, challengeId: 12, user: "n3tw0rk3r", correct: true, submittedAt: "2026-09-20 08:44:19" },
      { id: 16, challengeId: 4, user: "MalwareMike", correct: false, submittedAt: "2026-09-20 09:02:51" },
      { id: 17, challengeId: 14, user: "FlagCatcher", correct: false, submittedAt: "2026-09-20 09:15:27" },
      { id: 18, challengeId: 14, user: "FlagCatcher", correct: true, submittedAt: "2026-09-20 09:21:44" },
      { id: 19, challengeId: 17, user: "InfiniteLoop", correct: true, submittedAt: "2026-09-20 09:40:02" },
      { id: 20, challengeId: 11, user: "ShadowRoot", correct: true, submittedAt: "2026-09-20 10:12:33" },
      { id: 21, challengeId: 2, user: "NullByte", correct: true, submittedAt: "2026-09-20 10:34:58" },
      { id: 22, challengeId: 7, user: "CyberFox", correct: true, submittedAt: "2026-09-20 11:07:12" },
      { id: 23, challengeId: 15, user: "PacketHunter", correct: true, submittedAt: "2026-09-20 11:25:46" },
      { id: 24, challengeId: 12, user: "r3v3rs3r", correct: false, submittedAt: "2026-09-20 11:48:30" },
      { id: 25, challengeId: 12, user: "r3v3rs3r", correct: true, submittedAt: "2026-09-20 11:52:17" },
      { id: 26, challengeId: 5, user: "ByteWitch", correct: true, submittedAt: "2026-09-21 08:12:44" },
      { id: 27, challengeId: 9, user: "cr4ckm3", correct: true, submittedAt: "2026-09-21 08:26:19" },
      { id: 28, challengeId: 13, user: "TerminalGhost", correct: true, submittedAt: "2026-09-21 08:41:05" },
      { id: 29, challengeId: 3, user: "PhishFinder", correct: true, submittedAt: "2026-09-21 08:57:38" },
      { id: 30, challengeId: 16, user: "xpl01ter", correct: true, submittedAt: "2026-09-21 09:13:22" },
      { id: 31, challengeId: 17, user: "CipherSage", correct: false, submittedAt: "2026-09-21 09:26:51" },
      { id: 32, challengeId: 17, user: "CipherSage", correct: true, submittedAt: "2026-09-21 09:31:44" },
      { id: 33, challengeId: 4, user: "n3tw0rk3r", correct: true, submittedAt: "2026-09-21 09:45:08" },
      { id: 34, challengeId: 14, user: "MalwareMike", correct: true, submittedAt: "2026-09-21 09:54:37" },
      { id: 35, challengeId: 12, user: "FlagCatcher", correct: true, submittedAt: "2026-09-21 19:14:02" },
      { id: 36, challengeId: 2, user: "InfiniteLoop", correct: true, submittedAt: "2026-09-21 19:28:19" },
      { id: 37, challengeId: 15, user: "ShadowRoot", correct: true, submittedAt: "2026-09-21 19:37:55" },
      { id: 38, challengeId: 11, user: "NullByte", correct: true, submittedAt: "2026-09-21 19:50:21" },
      { id: 39, challengeId: 7, user: "CyberFox", correct: true, submittedAt: "2026-09-21 20:05:13" },
      { id: 40, challengeId: 13, user: "PacketHunter", correct: true, submittedAt: "2026-09-21 20:18:47" },
      { id: 41, challengeId: 16, user: "r3v3rs3r", correct: true, submittedAt: "2026-09-21 20:30:09" },
      { id: 42, challengeId: 5, user: "ByteWitch", correct: true, submittedAt: "2026-09-21 20:44:23" },
      { id: 43, challengeId: 1, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 20:50:48" },
      { id: 44, challengeId: 3, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 21:02:36" },
      { id: 45, challengeId: 5, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 21:14:54" },
      { id: 46, challengeId: 7, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 21:26:11" },
      { id: 47, challengeId: 9, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 21:33:40" },
      { id: 48, challengeId: 11, user: "h4ck3r_x", correct: false, submittedAt: "2026-09-21 21:41:02" },
      { id: 49, challengeId: 11, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 21:47:19" },
      { id: 50, challengeId: 13, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 22:01:28" },
      { id: 51, challengeId: 15, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 22:12:05" },
      { id: 52, challengeId: 17, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 22:20:44" },
      { id: 53, challengeId: 12, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 22:31:17" },
      { id: 54, challengeId: 16, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 22:40:53" },
      { id: 55, challengeId: 2, user: "h4ck3r_x", correct: true, submittedAt: "2026-09-21 22:51:39" },
      { id: 56, challengeId: 4, user: "h4ck3r_x", correct: false, submittedAt: "2026-09-21 22:59:02" },
      { id: 57, challengeId: 8, user: "h4ck3r_x", correct: false, submittedAt: "2026-09-21 23:04:11" },
      { id: 58, challengeId: 14, user: "h4ck3r_x", correct: false, submittedAt: "2026-09-21 23:12:26" },
      { id: 59, challengeId: 1, user: "TerminalGhost", correct: true, submittedAt: "2026-09-22 08:10:33" },
      { id: 60, challengeId: 9, user: "FlagCatcher", correct: true, submittedAt: "2026-09-22 08:24:08" },
      { id: 61, challengeId: 15, user: "CipherSage", correct: true, submittedAt: "2026-09-22 08:38:41" },
      { id: 62, challengeId: 11, user: "PhishFinder", correct: true, submittedAt: "2026-09-22 08:52:19" },
      { id: 63, challengeId: 13, user: "n3tw0rk3r", correct: true, submittedAt: "2026-09-22 09:05:47" },
      { id: 64, challengeId: 17, user: "MalwareMike", correct: false, submittedAt: "2026-09-22 09:16:02" },
      { id: 65, challengeId: 17, user: "MalwareMike", correct: true, submittedAt: "2026-09-22 09:21:15" },
      { id: 66, challengeId: 2, user: "ShadowRoot", correct: false, submittedAt: "2026-09-22 09:28:41" },
      { id: 67, challengeId: 2, user: "ShadowRoot", correct: true, submittedAt: "2026-09-22 09:34:09" },
      { id: 68, challengeId: 16, user: "ByteWitch", correct: true, submittedAt: "2026-09-22 09:47:32" },
      { id: 69, challengeId: 5, user: "cr4ckm3", correct: true, submittedAt: "2026-09-22 10:00:14" },
      { id: 70, challengeId: 12, user: "xpl01ter", correct: true, submittedAt: "2026-09-22 10:12:53" },
      { id: 71, challengeId: 7, user: "InfiniteLoop", correct: true, submittedAt: "2026-09-22 10:25:31" },
      { id: 72, challengeId: 4, user: "CyberFox", correct: true, submittedAt: "2026-09-22 10:38:40" },
      { id: 73, challengeId: 14, user: "PacketHunter", correct: true, submittedAt: "2026-09-22 10:51:22" },
      { id: 74, challengeId: 8, user: "r3v3rs3r", correct: true, submittedAt: "2026-09-22 11:04:56" },
      { id: 75, challengeId: 3, user: "NullByte", correct: false, submittedAt: "2026-09-22 11:16:03" },
      { id: 76, challengeId: 3, user: "NullByte", correct: true, submittedAt: "2026-09-22 11:22:38" },
      { id: 77, challengeId: 17, user: "TerminalGhost", correct: true, submittedAt: "2026-09-22 11:35:49" },
      { id: 78, challengeId: 1, user: "PhishFinder", correct: true, submittedAt: "2026-09-22 11:49:12" },
      { id: 79, challengeId: 5, user: "MalwareMike", correct: true, submittedAt: "2026-09-22 12:02:27" },
      { id: 80, challengeId: 9, user: "FlagCatcher", correct: true, submittedAt: "2026-09-22 12:15:03" }
    ];
  }
});

// src/services/api.js
var api_exports = {};
__export(api_exports, {
  ApiError: () => ApiError,
  api: () => api,
  default: () => api_default,
  humanizeError: () => humanizeError,
  refreshAccessToken: () => refreshAccessToken,
  request: () => request,
  tokenStore: () => tokenStore
});
function humanizeError(data, fallback = "Something went wrong. Please try again.") {
  if (data == null) return fallback;
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed || trimmed.startsWith("<")) return fallback;
    return trimmed.length > 300 ? fallback : trimmed;
  }
  if (Array.isArray(data)) {
    return data.filter(Boolean).join(" ") || fallback;
  }
  if (typeof data === "object") {
    if (data.detail != null) {
      const detail = Array.isArray(data.detail) ? data.detail.filter(Boolean).join(" ") : data.detail;
      if (typeof detail === "string" && detail) return detail;
    }
    const parts = [];
    const internalKeys = /* @__PURE__ */ new Set([
      "trace",
      "traceback",
      "stack",
      "stacktrace",
      "debug",
      "exception",
      "exc",
      "internal",
      "django",
      "request",
      "settings"
    ]);
    for (const [field, value] of Object.entries(data)) {
      if (internalKeys.has(field.toLowerCase())) continue;
      const messages = Array.isArray(value) ? value : [value];
      const text = messages.filter((m) => typeof m === "string").join(" ");
      if (!text) continue;
      const label = {
        username: "Username",
        email: "Email",
        password: "Password",
        password2: "Password confirmation",
        refresh: "Session",
        non_field_errors: ""
      }[field];
      if (label === "") parts.push(text);
      else if (label) parts.push(`${label}: ${text}`);
      else parts.push(text);
    }
    if (parts.length) return parts.join(" ");
  }
  return fallback;
}
async function readBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = true,
    retry = true,
    signal
  } = options;
  const headers = { Accept: "application/json" };
  if (body !== void 0) headers["Content-Type"] = "application/json";
  if (auth && tokenStore.getAccess()) {
    headers.Authorization = `Bearer ${tokenStore.getAccess()}`;
  }
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      signal,
      body: body === void 0 ? void 0 : JSON.stringify(body)
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", { status: 0 });
  }
  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, { ...options, retry: false });
    }
    tokenStore.clear();
    window.dispatchEvent(new CustomEvent("auth:expired"));
    throw new ApiError("Your session has expired. Please log in again.", { status: 401 });
  }
  const data = await readBody(response);
  if (!response.ok) {
    const message = humanizeError(
      data,
      response.status === 403 ? "You do not have permission to do that." : response.status === 404 ? "That resource was not found." : response.status >= 500 ? "The server had a problem. Please try again later." : "Request failed. Please try again."
    );
    throw new ApiError(message, { status: response.status, data });
  }
  return data;
}
async function performRefresh() {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh })
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (!data || !data.access) return false;
    tokenStore.setAccess(data.access);
    if (data.refresh) tokenStore.setRefresh(data.refresh);
    return true;
  } catch {
    return false;
  }
}
function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
var BASE_URL, ACCESS_KEY, REFRESH_KEY, tokenStore, ApiError, api, api_default, refreshInFlight;
var init_api = __esm({
  "src/services/api.js"() {
    BASE_URL = "https://api.example.test/api/v1".replace(/\/+$/, "");
    ACCESS_KEY = "cyberforge_access";
    REFRESH_KEY = "cyberforge_refresh";
    tokenStore = {
      getAccess: () => localStorage.getItem(ACCESS_KEY),
      getRefresh: () => localStorage.getItem(REFRESH_KEY),
      setTokens({ access, refresh }) {
        if (access) localStorage.setItem(ACCESS_KEY, access);
        if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
      },
      setAccess(access) {
        if (access) localStorage.setItem(ACCESS_KEY, access);
      },
      clear() {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
      }
    };
    ApiError = class extends Error {
      constructor(message, { status = 0, data = null } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
      }
    };
    api = {
      get: (path, options) => request(path, { ...options, method: "GET" }),
      post: (path, body, options) => request(path, { ...options, method: "POST", body }),
      patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
      put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
      delete: (path, options) => request(path, { ...options, method: "DELETE" })
    };
    api_default = api;
    refreshInFlight = null;
  }
});

// src/services/adminService.js
var adminService_exports = {};
__export(adminService_exports, {
  adminService: () => adminService
});
var USERS_KEY, SUBMISSIONS_KEY, AUDIT_KEY, SOLVES_KEY, delay, read, write, adminService;
var init_adminService = __esm({
  "src/services/adminService.js"() {
    init_admin();
    init_solves();
    init_api();
    USERS_KEY = "cyberforge_admin_users";
    SUBMISSIONS_KEY = "cyberforge_admin_submissions";
    AUDIT_KEY = "cyberforge_audit_logs";
    SOLVES_KEY = "cyberforge_solves";
    delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));
    read = (key, fallback) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
        }
      }
      return fallback;
    };
    write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
    adminService = {
      async getUsers() {
        await delay(250);
        return read(USERS_KEY, adminUsers);
      },
      async getSubmissions() {
        await delay(250);
        return read(SUBMISSIONS_KEY, adminSubmissions);
      },
      async getAuditLogs() {
        await delay(250);
        return read(AUDIT_KEY, auditLogs);
      },
      async getSolvesHistory() {
        await delay(250);
        return read(SOLVES_KEY, solveEvents);
      },
      async logAction(actor, action, target, ip = "192.168.1.104") {
        const logs = read(AUDIT_KEY, auditLogs);
        const next = [{
          id: Date.now(),
          actor: actor || "System",
          action,
          target,
          ip,
          timestamp: (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ")
        }, ...logs].slice(0, 250);
        write(AUDIT_KEY, next);
        return next;
      },
      /* ---------------------------------------------------------------- */
      /* Real admin user-management API (Admin -> Users page).            */
      /*                                                                    */
      /* These call the Django REST backend at /api/v1/admin/. Errors are   */
      /* thrown as ApiError with a humanised `.message` by api.js.          */
      /* ---------------------------------------------------------------- */
      async listUsers({ page = 1, pageSize = 20, search = "", deleted = false } = {}) {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(pageSize));
        const term = (search || "").trim();
        if (term) params.set("search", term);
        if (deleted) params.set("deleted", "true");
        return api.get(`/admin/users/?${params.toString()}`);
      },
      async getUser(id, { deleted = false } = {}) {
        const suffix = deleted ? "?deleted=true" : "";
        return api.get(`/admin/users/${id}/${suffix}`);
      },
      async createUser(payload) {
        return api.post("/admin/users/", payload);
      },
      async updateUser(id, payload) {
        return api.patch(`/admin/users/${id}/`, payload);
      },
      async removeUser(id) {
        return api.delete(`/admin/users/${id}/`);
      },
      async restoreUser(id) {
        return api.post(`/admin/users/${id}/restore/`, {});
      },
      async setUserStatus(id, status, statusNote = "") {
        return api.patch(`/admin/users/${id}/status/`, {
          status,
          status_note: statusNote || ""
        });
      },
      async setUserGroups(id, groupIds) {
        return api.patch(`/admin/users/${id}/groups/`, { groups: groupIds });
      },
      async listGroups() {
        return api.get("/admin/groups/");
      }
    };
  }
});

// scripts/admin-users-harness/entry.mjs
var store = /* @__PURE__ */ new Map();
var localStorage2 = {
  getItem: (k) => store.has(k) ? store.get(k) : null,
  setItem: (k, v) => {
    store.set(k, String(v));
  },
  removeItem: (k) => {
    store.delete(k);
  },
  clear: () => {
    store.clear();
  }
};
var dispatchedEvents = [];
var listeners = {};
var window2 = {
  localStorage: localStorage2,
  dispatchEvent: (evt) => {
    dispatchedEvents.push(evt);
    return true;
  },
  addEventListener: (name, cb) => {
    (listeners[name] ||= []).push(cb);
  },
  removeEventListener: () => {
  }
};
var calls = [];
var queue = [];
var jsonResponse = (res) => ({
  ok: res.status >= 200 && res.status < 300,
  status: res.status,
  text: async () => res.body == null ? "" : JSON.stringify(res.body),
  json: async () => res.body
});
var fetchStub = async (url, options = {}) => {
  calls.push({
    url,
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body === void 0 ? void 0 : JSON.parse(options.body)
  });
  const res = queue.shift() || { status: 200, body: {} };
  return jsonResponse(res);
};
globalThis.localStorage = localStorage2;
globalThis.window = window2;
globalThis.fetch = fetchStub;
var { adminService: adminService2 } = await Promise.resolve().then(() => (init_adminService(), adminService_exports));
var { api: api2, tokenStore: tokenStore2, ApiError: ApiError2 } = await Promise.resolve().then(() => (init_api(), api_exports));
var BASE = "https://api.example.test/api/v1";
var tests = [];
var test = (name, fn) => tests.push([name, fn]);
var assert = (cond, msg) => {
  if (!cond) throw new Error(msg || "assertion failed");
};
var assertEqual = (actual, expected, msg) => {
  if (actual !== expected) {
    throw new Error(`${msg || "expected equal"}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  }
};
var lastCall = () => calls[calls.length - 1];
var queueResponses = (...responses) => {
  queue = responses;
};
var withToken = (t = "tok123") => tokenStore2.setTokens({ access: t });
function resetEnv() {
  calls = [];
  queue = [];
  store.clear();
  dispatchedEvents.length = 0;
}
test("listUsers builds the paginated URL from the configured base", async () => {
  queueResponses({ status: 200, body: { count: 0, next: null, previous: null, summary: {}, results: [] } });
  const data = await adminService2.listUsers();
  assertEqual(calls.length, 1);
  assertEqual(lastCall().method, "GET");
  assertEqual(lastCall().url, `${BASE}/admin/users/?page=1&page_size=20`);
  assertEqual(data.count, 0);
});
test("listUsers forwards page, page_size and search", async () => {
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService2.listUsers({ page: 3, pageSize: 5, search: "ada" });
  assertEqual(lastCall().url, `${BASE}/admin/users/?page=3&page_size=5&search=ada`);
});
test("listUsers drops a blank search term", async () => {
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService2.listUsers({ search: "   " });
  assert(!lastCall().url.includes("search="), "blank search must not be sent");
});
test("the Bearer token is attached when present", async () => {
  withToken("abc.def.ghi");
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService2.listUsers();
  assertEqual(lastCall().headers.Authorization, "Bearer abc.def.ghi");
});
test("no Authorization header is sent when logged out", async () => {
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService2.listUsers();
  assert(lastCall().headers.Authorization === void 0, "expected no auth header");
});
test("getUser GETs the detail URL", async () => {
  queueResponses({ status: 200, body: { id: 7 } });
  const data = await adminService2.getUser(7);
  assertEqual(lastCall().method, "GET");
  assertEqual(lastCall().url, `${BASE}/admin/users/7/`);
  assertEqual(data.id, 7);
});
test("createUser POSTs a JSON body", async () => {
  withToken();
  queueResponses({ status: 201, body: { id: 1, username: "neo" } });
  const data = await adminService2.createUser({ username: "neo", password: "Str0ng-Pass!42" });
  assertEqual(lastCall().method, "POST");
  assertEqual(lastCall().url, `${BASE}/admin/users/`);
  assertEqual(lastCall().headers["Content-Type"], "application/json");
  assertEqual(lastCall().body.username, "neo");
  assertEqual(data.id, 1);
});
test("updateUser PATCHes profile fields to the detail URL", async () => {
  queueResponses({ status: 200, body: { id: 5 } });
  await adminService2.updateUser(5, { first_name: "Ada", email: "ada@example.com" });
  assertEqual(lastCall().method, "PATCH");
  assertEqual(lastCall().url, `${BASE}/admin/users/5/`);
  assertEqual(lastCall().body.first_name, "Ada");
});
test("removeUser sends DELETE and tolerates an empty 204", async () => {
  queueResponses({ status: 204, body: null });
  const data = await adminService2.removeUser(7);
  assertEqual(lastCall().method, "DELETE");
  assertEqual(lastCall().url, `${BASE}/admin/users/7/`);
  assertEqual(data, null);
});
test("listUsers adds deleted=true only when asked", async () => {
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService2.listUsers({ deleted: true });
  assertEqual(lastCall().url, `${BASE}/admin/users/?page=1&page_size=20&deleted=true`);
});
test("listUsers omits deleted for the active view", async () => {
  queueResponses({ status: 200, body: { count: 0, results: [] } });
  await adminService2.listUsers({ deleted: false });
  assert(!lastCall().url.includes("deleted="), "active view must not send deleted");
});
test("getUser forwards the deleted flag for a deleted account", async () => {
  queueResponses({ status: 200, body: { id: 7, deleted_at: "2026-01-01T00:00:00Z" } });
  await adminService2.getUser(7, { deleted: true });
  assertEqual(lastCall().url, `${BASE}/admin/users/7/?deleted=true`);
});
test("restoreUser POSTs to the restore endpoint", async () => {
  queueResponses({ status: 200, body: { id: 7, status: "active", deleted_at: null } });
  const data = await adminService2.restoreUser(7);
  assertEqual(lastCall().method, "POST");
  assertEqual(lastCall().url, `${BASE}/admin/users/7/restore/`);
  assertEqual(data.deleted_at, null);
});
test("setUserStatus PATCHes status and note", async () => {
  queueResponses({ status: 200, body: { id: 7, status: "suspended" } });
  await adminService2.setUserStatus(7, "suspended", "spam");
  assertEqual(lastCall().method, "PATCH");
  assertEqual(lastCall().url, `${BASE}/admin/users/7/status/`);
  assertEqual(lastCall().body.status, "suspended");
  assertEqual(lastCall().body.status_note, "spam");
});
test("setUserStatus defaults the note to an empty string", async () => {
  queueResponses({ status: 200, body: {} });
  await adminService2.setUserStatus(7, "active");
  assertEqual(lastCall().body.status_note, "");
});
test("setUserGroups PATCHes the group id list", async () => {
  queueResponses({ status: 200, body: { id: 7, groups: [] } });
  await adminService2.setUserGroups(7, [2, 3]);
  assertEqual(lastCall().url, `${BASE}/admin/users/7/groups/`);
  assertEqual(JSON.stringify(lastCall().body.groups), "[2,3]");
});
test("listGroups GETs the assignable groups", async () => {
  queueResponses({ status: 200, body: [{ id: 1, name: "Admin" }] });
  const data = await adminService2.listGroups();
  assertEqual(lastCall().method, "GET");
  assertEqual(lastCall().url, `${BASE}/admin/groups/`);
  assertEqual(data[0].name, "Admin");
});
test("403 becomes an ApiError with a permission message", async () => {
  withToken();
  queueResponses({ status: 403, body: null });
  let err;
  try {
    await adminService2.listUsers();
  } catch (e) {
    err = e;
  }
  assert(err instanceof ApiError2, "expected an ApiError");
  assertEqual(err.status, 403);
  assert(/permission/i.test(err.message), `unexpected message: ${err.message}`);
});
test("400 surfaces the field-level validation message", async () => {
  withToken();
  queueResponses({ status: 400, body: { username: ["A user with that username already exists."] } });
  let err;
  try {
    await adminService2.createUser({ username: "neo", password: "x" });
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 400);
  assert(/username/i.test(err.message), `unexpected message: ${err.message}`);
});
test("404 becomes an ApiError without leaking internals", async () => {
  withToken();
  queueResponses({ status: 404, body: null });
  let err;
  try {
    await adminService2.getUser(999);
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 404);
  assert(/not found/i.test(err.message), `unexpected message: ${err.message}`);
});
test("401 with no refresh token clears the session and emits auth:expired", async () => {
  withToken();
  queueResponses({ status: 401, body: null });
  let err;
  try {
    await adminService2.listUsers();
  } catch (e) {
    err = e;
  }
  assertEqual(err.status, 401);
  assertEqual(calls.length, 1, "should not retry without a refresh token");
  assertEqual(localStorage2.getItem("cyberforge_access"), null);
  assertEqual(dispatchedEvents.length, 1);
  assertEqual(dispatchedEvents[0].type, "auth:expired");
});
test("401 with a valid refresh token retries once using the new access token", async () => {
  tokenStore2.setTokens({ access: "old", refresh: "refresh-1" });
  queueResponses(
    { status: 401, body: null },
    { status: 200, body: { access: "new-access" } },
    { status: 200, body: { count: 1, results: [{ id: 1 }] } }
  );
  const data = await adminService2.listUsers();
  assertEqual(calls.length, 3, "list, refresh, retried list");
  assertEqual(calls[1].url, `${BASE}/auth/refresh/`);
  assertEqual(calls[1].body.refresh, "refresh-1");
  assertEqual(calls[2].headers.Authorization, "Bearer new-access");
  assertEqual(tokenStore2.getAccess(), "new-access");
  assertEqual(data.count, 1);
});
var passed = 0;
var failures = [];
for (const [name, fn] of tests) {
  resetEnv();
  try {
    await fn();
    passed += 1;
    console.log(`  ok    ${name}`);
  } catch (e) {
    failures.push({ name, e });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${e.message}`);
  }
}
console.log(`
${passed}/${tests.length} passed`);
if (failures.length) {
  console.error(`
${failures.length} failing test(s).`);
  process.exitCode = 1;
}
