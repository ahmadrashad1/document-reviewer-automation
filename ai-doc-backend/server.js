require("dotenv").config();
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

app.get("/health", (req, res) => {
  res.json({
    status: "Backend running",
    timestamp: new Date().toISOString(),
  });
});

app.post("/analyze", upload.single("document"), async (req, res) => {
  try {
    // basic validation
    if (!req.file) {
      return res.status(400).json({ error: "No document uploaded" });
    }

    if (!req.body.query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const query = req.body.query;
    const filePath = path.resolve(req.file.path);

    // Read and parse PDF
    let pdfData;
    try {
      const buffer = fs.readFileSync(filePath);
      pdfData = await pdfParse(buffer);
    } catch (parseErr) {
      console.error("PDF parsing failed:", parseErr);
      return res.status(422).json({ error: "Unable to parse PDF document" });
    }

    const documentText = pdfData.text;

    if (!documentText || documentText.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }

    // Send extracted text + query to n8n using the field names expected by the workflow
    // the webhook node expects `text` (not documentText) so we provide both for compatibility.
    // Path must match the Webhook node path in n8n (e.g. "document-review")
    const webhookUrl = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook-test/document-review";
    console.log("Sending to n8n webhook", webhookUrl, { query, textLength: documentText.length });
    let n8nResponse;
    try {
      n8nResponse = await axios.post(
        webhookUrl,
        {
          text: documentText,
          documentText: documentText, // legacy support in case workflow uses it
          query: query,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 300000, // 5 min timeout for large documents
        }
      );
      console.log("n8n responded", { status: n8nResponse.status, data: n8nResponse.data });
    } catch (axErr) {
      console.error("Error calling n8n webhook:", axErr.message);
      if (axErr.response) {
        const status = axErr.response.status;
        const data = axErr.response.data;
        console.error("n8n error response", status, data);
        return res.status(502).json({
          error: "n8n webhook returned an error",
          status,
          details: data,
        });
      }
      return res.status(502).json({
        error: "Could not reach n8n webhook",
        details: axErr.message,
      });
    }


    // Delete uploaded file after processing
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn("Failed to remove temp file:", cleanupError.message);
    }

    // n8nResponse.data may be a string (plain text answer) or an object.
    // If it's empty or falsy, treat as an error to surface upstream.
    let responseData = n8nResponse.data;
    if (!responseData && responseData !== 0) {
      console.warn("n8n returned empty response");
      return res.status(502).json({
        success: false,
        error: "Workflow returned no data",
        details: n8nResponse.data,
      });
    }
    return res.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("Error in /analyze:", error.message);

    // Clean up file if it exists and error occurred
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
            console.error("Error cleaning up file:", cleanupError);
        }
    }

    return res.status(500).json({
      success: false,
      error: "Document processing failed",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
