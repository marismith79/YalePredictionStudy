import express from "express";
import { fileURLToPath } from "url";
import { Request, Response } from "express";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { fetchAccessToken } from "hume";
import cors from "cors";
import axios from "axios";
import { Client } from "@microsoft/microsoft-graph-client";
import * as msal from "@azure/msal-node";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url); 
const __dirname = dirname(__filename);

// Determine if we're in production (Azure) or development
const isProduction = process.env.NODE_ENV === "production";

// Adjust paths based on environment
const envPath = isProduction
  ? path.join(__dirname, "../../../.env") // Azure path
  : path.join(__dirname, "../../.env"); // Local path

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// Enable CORS middleware
app.use(cors({
  origin: 'http://localhost:5173',  // Allow requests from your frontend
  methods: ['GET', 'POST'],  // Allow only GET and POST methods
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allow specific headers
}));

// Adjust static file path based on environment
const clientPath = isProduction
  ? path.join(__dirname, "../../../client/dist") // Azure path
  : path.join(__dirname, "../../client/dist"); // Local path

console.log("Environment:", process.env.NODE_ENV);
console.log("Serving static files from:", clientPath);
app.use(express.static(clientPath));

app.get("/api/getHumeAccessToken", async (req: Request, res: Response) => {
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;
  
  if (!apiKey || !secretKey) {
    return res.status(500).json({
      error: "Hume API key or Secret key is missing on the server.",
    });
  }

  try {
    const accessToken = await fetchAccessToken({
      apiKey,
      secretKey,
    });

    if (!accessToken) {
      return res.status(500).json({
        error: "Failed to fetch Hume access token from Hume API.",
      });
    }

    // Return the token to the client
    res.json({ accessToken });
  } catch (error) {
    console.error("Error fetching Hume access token:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Adjust index.html path based on environment
app.get("*", (req, res) => {
  const indexPath = isProduction
    ? path.join(__dirname, "../../../client/dist/index.html") // Azure path
    : path.join(__dirname, "../../client/dist/index.html"); // Local path

  res.sendFile(indexPath);
});

// A simple array of allowed Prolific IDs (replace with your own logic or database)
const VALID_PROLIFIC_IDS = ["1234567890", "0987654321"]; // example IDs

// Middleware to verify JWT tokens on protected routes
const authenticate = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    // Attach the decoded token to req.user (if needed)
    (req as any).user = decoded;
    next();
  });
};

app.post("/api/login", (req: Request, res: Response) => {
  const { prolificId } = req.body;
  // Check that the input is exactly 10 digits
  if (!prolificId || !/^\d{10}$/.test(prolificId)) {
    return res.status(400).json({ error: "Invalid Prolific ID format" });
  }
  // Validate the ID against our allowed list
  if (!VALID_PROLIFIC_IDS.includes(prolificId)) {
    return res.status(401).json({ error: "Unauthorized Prolific ID" });
  }
  // Create a JWT token (set a secret in your .env as JWT_SECRET)
  const token = jwt.sign({ prolificId }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });
  res.json({ token });
});


const tenantId = process.env.TENANT_ID || ""; 
const clientId = process.env.CLIENT_ID || ""; 
const clientSecret = process.env.CLIENT_SECRET || ""; 

// Microsoft Graph API authentication
const cca = new msal.ConfidentialClientApplication({
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret: clientSecret,
  },
});

const getAccessToken = async (): Promise<string> => {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });
  if (!result) {
    throw new Error("Failed to acquire access token");
  }
  return result.accessToken!;
};

app.post("/api/upload-audio", async (req: Request, res: Response) => {
  try {
    const { audioData, fileName } = req.body; // Expecting base64 audio data and file name

    // 1. Authenticate and get the access token
    const accessToken = await getAccessToken();
    console.log("Access token:", accessToken);

    // 2. Prepare the Microsoft Graph client with the access token
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken); // Provide the access token to the client
      },
    });

    // 3. Create a buffer from the base64 audio data
    const buffer = Buffer.from(audioData, "base64");

    // 4. Upload the file to OneDrive
    const uploadPath = `/users/shomari.smith@yale.edu/drive/root:/Documents/yalepredictionsurvey/${fileName}:/content`;

    const response = await client.api(uploadPath).put(buffer);

    // 5. Respond to the frontend with the result
    res.json({
      success: true,
      message: "Audio uploaded successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error uploading audio to OneDrive:", error);
    res.status(500).json({ error: "Error uploading audio to OneDrive" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}, env port is ${process.env.PORT}`);
  console.log(`clientId is ${process.env.CLIENT_ID}`);
});