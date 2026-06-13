# Lesson 5 — Ethics & Legal Boundaries

## 5.1 What Is Legal vs. Illegal

The techniques in this lab are powerful. Whether they are legal depends entirely on **what you do with them** and **whose systems you target**.

| Scenario | Legal? | Why |
|----------|--------|-----|
| Bypass pinning on your own app, your own device | **Yes** | You own both the app and the device. |
| Bypass pinning on a dummy account, emulator, air-gapped lab | **Yes** | You own all components of the test. |
| Intercept someone else's Facebook traffic | **No** | Wiretapping laws (CFAA, ECPA in the US; similar in most countries). |
| Intercept your own traffic via your own proxy | **Yes** | You are both sender and receiver. |
| Modify Facebook's APK and distribute it | **No** | Copyright infringement, ToS violation, potentially malware distribution. |
| Use these techniques to scrape user data at scale | **No** | CFAA, GDPR, Facebook ToS, possibly computer fraud statutes. |
| Report a vulnerability you found in your own test | **Yes** | This is responsible disclosure — encouraged. |

---

## 5.2 Lab Rules You Must Follow

Before running any bypass technique, confirm all three of these:

1. **The device is yours.** — You purchased or fully control the Android device or emulator.
2. **The account is yours.** — You created the Facebook account specifically for testing (dummy account). Never test on someone else's account, even with their verbal permission — get written authorization.
3. **The network is yours.** — You are testing on a private lab network, not on public Wi-Fi where other users' traffic could be affected.

If you can't check all three boxes, **stop and reconfigure your lab**.

---

## 5.3 Facebook's Bug Bounty Program

If during your authorized research you discover a genuine security vulnerability in Facebook's platform, you should report it responsibly — not exploit it.

**Meta Bug Bounty Program:**  
`https://www.facebook.com/whitehat`  
`https://hackerone.com/facebook`

### What qualifies for a report?
- Authentication bypass affecting real accounts.
- Exposed API endpoints returning other users' private data.
- Remote code execution vulnerabilities.
- Significant information disclosure (e.g., private messages accessible without authorization).

### What does NOT qualify?
- SSL pinning itself (it is an intentional security control, not a vulnerability).
- Self-XSS, rate limiting issues, or bugs requiring physical access to the device.
- Anything you found by targeting accounts other than your own.

### Responsible Disclosure Process

1. Document the vulnerability clearly: steps to reproduce, impact, proof-of-concept.
2. **Do not** share details publicly until Meta has patched it and acknowledged the report.
3. Submit via the HackerOne portal.
4. Wait for Meta's response (typically 7–90 days depending on severity).
5. Meta may award a monetary bounty for valid, original reports.

---

## 5.4 Legal References (Brief Overview)

| Law / Regulation | Relevance |
|------------------|-----------|
| **Computer Fraud and Abuse Act (CFAA) — USA** | Criminalizes unauthorized access to computer systems. "Unauthorized" means without permission from the owner. |
| **Electronic Communications Privacy Act (ECPA) — USA** | Prohibits wiretapping and interception of communications. |
| **GDPR — EU** | Governs processing of personal data; intercepting another person's traffic violates this. |
| **Computer Misuse Act — UK** | Criminalizes unauthorized access to computer material. |
| **Personal Data Protection Act (PDPA) — Malaysia** | Governs collection and use of personal data. |

The key principle: **you must have authorization**. In a lab with your own device and account, you are the authorizing party. Outside that lab, get explicit written permission.

---

## 5.5 Keeping Your Lab Isolated

Best practices to ensure your research stays contained:

- **Air-gap your test network.** Use a dedicated Wi-Fi router for the emulator — never test on your company or university network.
- **Use a throwaway Facebook account.** Never log into your real account in the lab environment.
- **Snapshot your emulator** before each test session. This lets you revert cleanly.
- **Delete captures when done.** Don't store traffic captures containing any real personal data.
- **Don't publish bypass scripts** that are trivial to weaponize against real users without careful disclaimers and scope limitations.

---

## 5.6 If You Find Something Unexpected

If, during authorized testing of your own account, you accidentally receive data that belongs to another user (an API bug, for example), stop immediately:

1. Do not read or copy the data further.
2. Document exactly what happened (timestamp, endpoint, that you stopped).
3. Report to Meta's bug bounty program immediately.
4. Do not attempt to reproduce it by targeting other accounts.

Acting responsibly in this situation is what separates a security researcher from an attacker in the eyes of the law.

---

## Summary

Security research is valuable and legitimate. The techniques in this lab exist because the security community needs to test and harden mobile applications. The difference between a researcher and an attacker is:

- **Authorization** — you only test systems you own or have written permission to test.
- **Disclosure** — you report what you find to the vendor, not exploit it.
- **Scope** — you stay within the boundaries you agreed to.

These are not just ethical guidelines — they are legal requirements.

---

## Final Quiz (Test Your Understanding)

**Question 1 — Conceptual**  
Facebook's Android app receives a certificate from a proxy during a test. The certificate is signed by a trusted CA installed on the device, but the public key hash does not match the stored pin. What happens, and which component enforces this check?

<details>
<summary>Answer</summary>

The connection is rejected. OkHttp's `CertificatePinner.check()` compares the SHA-256 hash of the server's public key against the hardcoded pin list. Even though the standard CA validation passes (because the CA is trusted), the pin check fails because the public key hash doesn't match. The app throws `SSLPeerUnverifiedException` and aborts the connection.

</details>

---

**Question 2 — Technical**  
You run `frida -U -n com.facebook.katana -l bypass.js` and the bypass does not work — Facebook still shows a network error. What is the most likely cause and how do you fix it?

<details>
<summary>Answer</summary>

You are using **attach mode** (`-n`), which attaches to an already-running process. Facebook performs SSL pinning during the very first network request, often before any UI appears. By the time you attach, the pinning check has already run and the connection has already failed. Fix: use **spawn mode** with `-f com.facebook.katana` to inject the hook before the app starts.

</details>

---

**Question 3 — Ethical**  
A friend asks you to bypass SSL pinning on their Facebook account to help them recover some messages. They give you their device and credentials voluntarily. Is this legal and ethical? What should you do?

<details>
<summary>Answer</summary>

This is a legally grey area at best and likely illegal in most jurisdictions. Verbal permission from a friend does not constitute "authorization" under laws like the CFAA for accessing a platform (Facebook) that has its own Terms of Service. Facebook does not authorize SSL pinning bypass by third parties. Additionally, any data recovered could expose private conversations of third parties (people the friend chatted with) who have not consented.

The right answer: decline, and direct your friend to Facebook's official account recovery process (`facebook.com/hacked`) or to a licensed data recovery professional.

</details>

---

Congratulations — you've completed the SSL Pinning Bypass Educational Lab.
