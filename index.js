const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// 👉 AES KEY (HEX - 64 ký tự = 32 bytes)
const AES_KEY_HEX = process.env.AES_KEY || "616c1b1a28401f20692f27c34f1eb2609d6993c90a440e37744202e6bfaefce4";

// 👉 idempotent
const processed = new Set();

// 👉 decrypt function (match CryptoJS)
function decryptAES(encryptedHex, keyHex) {
    try {
        const key = Buffer.from(keyHex, "hex");

        // 👉 tách IV (16 bytes = 32 hex)
        const ivHex = encryptedHex.substring(0, 32);
        const dataHex = encryptedHex.substring(32);

        const iv = Buffer.from(ivHex, "hex");
        const encrypted = Buffer.from(dataHex, "hex");

        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return JSON.parse(decrypted.toString("utf8"));
    } catch (err) {
        throw new Error("Decrypt failed: " + err.message);
    }
}

app.post("/zonkhanh", async (req, res) => {
    const body = req.body;

    // ✅ log raw
    console.log("📥 RAW IPN:", JSON.stringify(body));

    // ✅ trả 200 ngay
    res.status(200).json({ status: "received" });

    setImmediate(() => {
        const log = {
            time: new Date().toISOString(),
            // raw: body,
            decrypted: null,
            status: "pending",
            // error: null
        };

        try {
            const encryptedHex = body.data;

            if (!encryptedHex) {
                throw new Error("Missing data field");
            }

            // 👉 decrypt
            const decrypted = decryptAES(encryptedHex, AES_KEY_HEX);
            log.decrypted = decrypted;

            // 👉 idempotent key
            const id =
                decrypted.txnId ||
                decrypted.orderId ||
                JSON.stringify(decrypted);

            if (processed.has(id)) {
                log.status = "duplicate";
                console.log("⚠️ Duplicate IPN:", id);
                console.log("📊 LOG:", JSON.stringify(log, null, 2));
                return;
            }

            processed.add(id);

            log.status = "success";

            console.log("✅ Decrypted IPN:", JSON.stringify(decrypted, null, 2));
            console.log("📊 LOG:", JSON.stringify(log, null, 2));

            // 👉 TODO: business logic
        } catch (err) {
            log.status = "error";
            log.error = err.message;

            console.error("❌ Decrypt/Error:", err.message);
            console.log("📊 LOG:", JSON.stringify(log, null, 2));
        }
    });
});

app.get("/", (req, res) => {
    res.send("IPN Server Running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
