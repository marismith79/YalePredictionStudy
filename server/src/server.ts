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

// In-memory allowed list of valid 10-digit IDs.
const VALID_PROLIFIC_IDS = ["1234567890", "0987654321"]; // Replace with your own list

// Middleware to verify JWT on protected endpoints
const authenticate = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    (req as any).user = decoded;
    next();
  });
};

app.post("/api/login", (req: Request, res: Response) => {
  const { prolificId } = req.body;
  if (!prolificId || !/^\d{10}$/.test(prolificId)) {
    return res.status(400).json({ error: "Invalid Prolific ID format" });
  }
  if (!VALID_PROLIFIC_IDS.includes(prolificId)) {
    return res.status(401).json({ error: "Unauthorized Prolific ID" });
  }
  // Issue a JWT for our app (JWT_SECRET should be set in .env)
  const token = jwt.sign({ prolificId }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });
  res.json({ token });
});

const serviceAccountUsername = process.env.SERVICE_ACCOUNT_USERNAME || "";
const serviceAccountPassword = process.env.SERVICE_ACCOUNT_PASSWORD || "";
const tenantId = process.env.TENANT_ID || ""; 
const clientId = process.env.CLIENT_ID || ""; 
const clientSecret = process.env.CLIENT_SECRET || ""; 

const getDelegatedAccessToken = async (): Promise<string> => {
  const ropcRequest = {
    scopes: ["https://graph.microsoft.com/.default"],
    username: serviceAccountUsername,
    password: serviceAccountPassword,
  };

  try {
    const tokenResponse = await cca.acquireTokenByUsernamePassword(ropcRequest);
    if (!tokenResponse || !tokenResponse.accessToken) {
      throw new Error("Failed to acquire delegated token");
    }
    return tokenResponse.accessToken;
  } catch (error) {
    console.error("Error acquiring delegated token:", error);
    throw error;
  }
};

// Create an MSAL ConfidentialClientApplication instance (used also for ROPC)
const cca = new msal.ConfidentialClientApplication({
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret: clientSecret,
  },
});

app.post("/api/upload-audio", authenticate, async (req: Request, res: Response) => {
  try {
    const { audioData, fileName } = req.body; // base64 audio data and file name
    // Obtain a delegated token using the service account (ROPC flow)
    const accessToken = await getDelegatedAccessToken();
    console.log("Delegated access token:", accessToken);

    // Initialize the Graph client with the delegated token
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    // Create a buffer from the base64 audio data
    const buffer = Buffer.from(audioData, "base64");

    // Use the /me endpoint since the token is for the service account
    const uploadPath = `/me/drive/root:/Documents/yalepredictionsurvey/${fileName}:/content`;

    const response = await client.api(uploadPath).put(buffer);

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

// Serve the static files
app.get("*", (req, res) => {
  const indexPath = isProduction
    ? path.join(__dirname, "../../../client/dist/index.html") // Azure path
    : path.join(__dirname, "../../client/dist/index.html"); // Local path
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}, env port is ${process.env.PORT}`);
  console.log(`clientId is ${process.env.CLIENT_ID}`);
});

/**
 * Use a Service Account That Supports ROPC:
Create (or designate) a service account that is exempt from MFA/conditional access challenges.
This account should be configured in your Azure AD such that ROPC can successfully acquire a token.
*/