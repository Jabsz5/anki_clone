const express = require('express');
const translate = require('@vitalets/google-translate-api');

const router = express.Router();

// Language detection
router.post("/translate", async (req, res) => {
  const data = req.body;
  if (!data || !data.text) return res.status(400).json({ error: "Missing 'text' field in JSON" });

  try {
    const result = await translate(data.text, { to: "en" });
    res.json({ detected_language: result.from.language.iso });
  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ error: "Failed to detect language" });
  }
});

module.exports = router;
