import express from "express";
import { fileURLToPath } from "url";
import { Request, Response } from "express";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { fetchAccessToken } from "hume";
import cors from "cors";
import jwt from "jsonwebtoken";
import { BlobServiceClient } from "@azure/storage-blob";

const __filename = fileURLToPath(import.meta.url); 
const __dirname = dirname(__filename);

// Determine if we're in production (Azure) or development
const isProduction = process.env.NODE_ENV === "production";

// Adjust paths based on environment
const envPath = isProduction
  ? path.join(__dirname, "../../../.env") // Azure path
  : path.join(__dirname, "../../.env"); // Local path

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const app = express();

app.use(express.json({ limit: "50mb" }));

// Enable CORS middleware
app.use(cors({
  origin: 'https://yalepredictionsurvey.azurewebsites.net',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

app.post("/api/upload-audio", authenticate, async (req: Request, res: Response) => {
  try {
    const { audioData } = req.body;
    const user = (req as any).user;
    const prolificId = user.prolificId;
    const fileName = `${prolificId}-1.wav`;

    const buffer = Buffer.from(audioData, "base64");

    // Get connection string and container name from environment variables
    const blobConnectionString = process.env.BLOB_CONNECTION_STRING || "UseDevelopmentStorage=true";
    const containerName = process.env.BLOB_CONTAINER || "interviews + questionnaires";

    // Create a BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    // Create a BlockBlobClient using the provided file name
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    // Upload the audio data as a block blob
    const uploadBlobResponse = await blockBlobClient.upload(buffer, buffer.length);
    console.log("Upload block blob successfully, request ID:", uploadBlobResponse.requestId);

    res.json({
      success: true,
      message: "Audio uploaded to Blob Storage successfully",
      data: uploadBlobResponse,
    });
  } catch (error) {
    console.error("Error uploading audio to Blob Storage:", error);
    res.status(500).json({ error: "Error uploading audio to Blob Storage" });
  }
});

app.post("/api/upload-questionnaire", authenticate, async (req: Request, res: Response) => {
  try {
    const { responses } = req.body; 
    const user = (req as any).user;
    const prolificId = user.prolificId;
    const finalFileName = `${prolificId}-questionnaire.csv`;
    const buffer = Buffer.from(responses, "utf-8");
    const blobConnectionString = process.env.BLOB_CONNECTION_STRING || "UseDevelopmentStorage=true";
    const containerName = process.env.BLOB_CONTAINER || "recordings"; 

    const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const blockBlobClient = containerClient.getBlockBlobClient(finalFileName);

    // Upload the CSV data as a block blob
    const uploadBlobResponse = await blockBlobClient.upload(buffer, buffer.length);
    console.log("Questionnaire uploaded successfully, request ID:", uploadBlobResponse.requestId);
    res.json({
      success: true,
      message: "Questionnaire uploaded successfully",
      data: uploadBlobResponse,
    });
  } catch (error) {
    console.error("Error uploading questionnaire:", error);
    res.status(500).json({ error: "Error uploading questionnaire" });
  }
});

// Serve the static files
app.get("*", (req, res) => {
  const indexPath = isProduction
    ? path.join(__dirname, "../../../client/dist/index.html") // Azure path
    : path.join(__dirname, "../../client/dist/index.html"); // Local path
  res.sendFile(indexPath);
});

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}, env port is ${process.env.PORT}`);
});