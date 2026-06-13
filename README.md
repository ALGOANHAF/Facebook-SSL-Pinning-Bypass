# Facebook SSL Pinning Bypass — Educational Lab

> **Disclaimer:** This repository is for **educational and authorized security research only**.  
> You must only test on devices and accounts you own. Bypassing SSL pinning on someone else's
> app or account without written permission is illegal and violates Facebook's Terms of Service.

---

## Learning Objectives

By completing this lab you will be able to:

- Explain what SSL/TLS certificate pinning is and why apps use it.
- Set up a complete Android security-research environment.
- Use Frida and Objection to bypass pinning in a controlled lab.
- Intercept and inspect traffic with mitmproxy / Burp Suite.
- Write your own Frida hooks for different pinning implementations.
- Understand the legal and ethical boundaries of mobile security research.

---

## Lesson Map

| # | Topic | File |
|---|-------|------|
| 1 | Environment Setup | [lessons/01_setup.md](lessons/01_setup.md) |
| 2 | Core SSL Concepts | [lessons/02_concepts.md](lessons/02_concepts.md) |
| 3 | Tool Walkthrough | [lessons/03_walkthrough.md](lessons/03_walkthrough.md) |
| 4 | Advanced Techniques | [lessons/04_advanced.md](lessons/04_advanced.md) |
| 5 | Ethics & Legal Boundaries | [lessons/05_ethics.md](lessons/05_ethics.md) |

## Example Scripts

| Script | Purpose |
|--------|---------|
| [scripts/ssl_bypass_basic.js](scripts/ssl_bypass_basic.js) | Hook Android TrustManager |
| [scripts/ssl_bypass_okhttp.js](scripts/ssl_bypass_okhttp.js) | Hook OkHttp CertificatePinner |
| [scripts/ssl_bypass_all.js](scripts/ssl_bypass_all.js) | Combined comprehensive bypass |

---

## Quick Reference

```
Lesson 1  →  Install ADB, Python, Frida, Objection, mitmproxy
Lesson 2  →  Understand pinning theory and how Facebook uses it
Lesson 3  →  Run bypass against a test account, capture traffic
Lesson 4  →  Write custom hooks, understand obfuscation
Lesson 5  →  Responsible disclosure and ethical rules
```

---

## License

MIT — see [LICENSE](LICENSE). Educational use only.
