import {
  Hume,
  HumeClient,
  convertBlobToBase64,
  convertBase64ToBlob,
  ensureSingleValidAudioTrack,
  getAudioStream,
  getBrowserSupportedMimeType,
  MimeType,
} from "hume";

const apiUrl = `https://yalepredictionsurvey.azurewebsites.net`;
// const apiUrl = `http://localhost:3000`;

// Define types for your store state
interface HumeState {
  connected: boolean;
  isRecording: boolean;
  audioStream: MediaStream | null;
  message: string | null; 
}

class HumeStore {
  private state: HumeState = {
    connected: false,
    isRecording: false,
    audioStream: null,
    message: null,
  };
  private listeners: Set<(state: HumeState) => void> = new Set();

  getState(): HumeState {
    return this.state;
  }

  setState(newState: Partial<HumeState>) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  subscribe(listener: (state: HumeState) => void) {
    this.listeners.add(listener);
    // Immediately call listener with current state
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

class HumeService {
  private static instance: HumeService;
  private store: HumeStore;
  private messageListeners: Set<(message: any) => void> = new Set();

  // New property to accumulate all recorded chunks
  private recordedChunks: Blob[] = [];

  // Method to add a listener for new messages
  public addMessageListener(listener: (message: any) => void): void {
    this.messageListeners.add(listener);
  }

  // Method to remove a listener
  public removeMessageListener(listener: (message: any) => void): void {
    this.messageListeners.delete(listener);
  }

  // Broadcast message to listeners
  private broadcastMessage(message: any): void {
    this.messageListeners.forEach((listener) => listener(message));
  }

  /**
   * the Hume Client, includes methods for connecting to EVI and managing the Web Socket connection
   */
  private client: HumeClient | null = null;

  /**
   * the WebSocket instance
   */
  private socket: Hume.empathicVoice.chat.ChatSocket | null = null;

  /**
   * the recorder responsible for recording the audio stream to be prepared as the audio input
   */
  private recorder: MediaRecorder | null = null;

  /**
   * the stream of audio captured from the user's microphone
   */
  private audioStream: MediaStream | null = null;

  /**
   * the current audio element to be played
   */
  private currentAudio: HTMLAudioElement | null = null;

  /**
   * flag which denotes whether audio is currently playing or not
   */
  private isPlaying = false;

  /**
   * flag which denotes whether to utilize chat resumability (preserve context from one chat to the next)
   */
  private resumeChats = true;

  /**
   * The ChatGroup ID used to resume the chat if disconnected unexpectedly
   */
  private chatGroupId: string | undefined;

  /**
   * audio playback queue
   */
  private audioQueue: Blob[] = [];

  /**
   * the config ID for our Hume configuration
   */
  private configID = "4b58faaa-2ad3-4b9e-b42e-73fb55a37c81";

  /**
   * mime type supported by the browser the application is running in
   */
  private mimeType: MimeType = (() => {
    const result = getBrowserSupportedMimeType();
    return result.success ? result.mimeType : MimeType.WEBM;
  })();

  private constructor() {
    this.store = new HumeStore();

    // Bind all event handlers in constructor
    this.handleWebSocketOpenEvent = this.handleWebSocketOpenEvent.bind(this);
    this.handleWebSocketCloseEvent = this.handleWebSocketCloseEvent.bind(this);
    this.handleWebSocketMessageEvent = this.handleWebSocketMessageEvent.bind(this);
    this.handleWebSocketErrorEvent = this.handleWebSocketErrorEvent.bind(this);
  }

  public static getInstance(): HumeService {
    if (!HumeService.instance) {
      HumeService.instance = new HumeService();
    }
    return HumeService.instance;
  }

  // Method to get store for components to subscribe to
  public getStore(): HumeStore {
    return this.store;
  }

  private async getHumeAccessToken() {
    try {
      const response = await fetch(
        `${apiUrl}/api/getHumeAccessToken`
      );
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      return data.accessToken;
    } catch (error) {
      console.error("Error fetching Hume access token from server:", error);
      throw error;
    }
  }

  public async connect(): Promise<void> {
    const accessToken = await this.getHumeAccessToken();

    // instantiate the HumeClient with credentials to make authenticated requests
    if (!this.client) {
      this.client = new HumeClient({
        accessToken: accessToken,
      });
    }

    // instantiates WebSocket and establishes an authenticated connection
    this.socket = await this.client.empathicVoice.chat.connect({
      configId: this.configID,
      resumedChatGroupId: this.chatGroupId,
    });

    this.socket.on("open", this.handleWebSocketOpenEvent);
    this.socket.on("message", this.handleWebSocketMessageEvent);
    this.socket.on("error", this.handleWebSocketErrorEvent);
    this.socket.on("close", this.handleWebSocketCloseEvent);
  }

  /**
   * stops audio capture and playback, and closes the Web Socket connection
   */
  public disconnect(): void {
    this.stopAudio();

    if (this.recorder) {
      this.recorder.stop();  // This will trigger onstop to upload the final recording
      this.recorder = null;
    }
  
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
  
    this.getStore().setState({ connected: false });
  
    if (!this.resumeChats) {
      this.chatGroupId = undefined;
    }
  
    this.socket?.close();
    this.socket = null;
  }

  /**
   * captures and records audio stream and sends audio stream through the socket in chunks.
   * Simultaneously, it accumulates all chunks into an array for concatenation upon stopping.
   *
   * API Reference:
   * - `audio_input`: https://dev.hume.ai/reference/empathic-voice-interface-evi/chat/chat#send.Audio%20Input.type
   */
  private async captureAudio(): Promise<void> {
    this.audioStream = await getAudioStream();
    ensureSingleValidAudioTrack(this.audioStream);
    const mimeType = this.mimeType;

    // Initialize the array to store chunks
    this.recordedChunks = [];

    // Instantiate the MediaRecorder with a timeslice (for real-time streaming)
    this.recorder = new MediaRecorder(this.audioStream, { mimeType });

    // ondataavailable fires repeatedly with each time slice
    this.recorder.ondataavailable = async ({ data }) => {
      if (data.size < 1) return;
      
      // Accumulate each chunk for final concatenation
      this.recordedChunks.push(data);
      
      // Also, send this chunk to the Hume socket for real-time processing
      const encodedChunk = await convertBlobToBase64(data);
      this.socket?.sendAudioInput({ data: encodedChunk });
    };

    // When the recording stops, concatenate all chunks and upload the final file.
    this.recorder.onstop = async () => {
      if (this.recordedChunks.length === 0) return;
      
      // Concatenate all chunks into one Blob
      const completeBlob = new Blob(this.recordedChunks, { type: mimeType });
      
      // Convert the complete Blob to base64
      const encodedCompleteAudio = await convertBlobToBase64(completeBlob);
      
      // Retrieve token and prolificId (if available)
      const token = localStorage.getItem("token");
      const prolificId = localStorage.getItem("prolificId") || "unknown";
      const fileName = `${prolificId}-${Date.now()}.wav`;
      
      // Send the concatenated recording to the backend for upload to Blob Storage
      const response = await fetch(`${apiUrl}/api/upload-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          audioData: encodedCompleteAudio,
          fileName: fileName,
        }),
      });
      
      if (response.ok) {
        console.log("Final concatenated recording uploaded to Blob Storage successfully!");
      } else {
        console.error("Failed to upload final concatenated recording to Blob Storage.");
      }
    };

    // Start recording with a timeslice (e.g., 100ms) for socket streaming
    const timeSlice = 100;
    this.recorder.start(timeSlice);
  }

  /**
   * Plays audio from the playback queue by converting each Blob into an HTMLAudioElement.
   */
  private playAudio(): void {
    if (!this.audioQueue.length || this.isPlaying) return;
    this.isPlaying = true;
    const audioBlob = this.audioQueue.shift();
    if (!audioBlob) return;
    const audioUrl = URL.createObjectURL(audioBlob);
    this.currentAudio = new Audio(audioUrl);
    this.currentAudio.play();
    this.currentAudio.onended = () => {
      this.isPlaying = false;
      if (this.audioQueue.length) this.playAudio();
    };
  }

  /**
   * Stops audio playback and clears the playback queue.
   */
  private stopAudio(): void {
    this.currentAudio?.pause();
    this.currentAudio = null;
    this.isPlaying = false;
    this.audioQueue.length = 0;
  }

  /**
   * Callback for handling WebSocket open event.
   */
  private async handleWebSocketOpenEvent(): Promise<void> {
    console.log("Web socket connection opened");
    this.getStore().setState({ connected: true });
    await this.captureAudio();
  }

  /**
   * Callback for handling WebSocket message event.
   *
   * API Reference:
   * - `chat_metadata`: https://dev.hume.ai/reference/empathic-voice-interface-evi/chat/chat#receive.Chat%20Metadata.type
   * - `user_message`: https://dev.hume.ai/reference/empathic-voice-interface-evi/chat/chat#receive.User%20Message.type
   * - `assistant_message`: https://dev.hume.ai/reference/empathic-voice-interface-evi/chat/chat#receive.Assistant%20Message.type
   * - `audio_output`: https://dev.hume.ai/reference/empathic-voice-interface-evi/chat/chat#receive.Audio%20Output.type
   * - `user_interruption`: https://dev.hume.ai/reference/empathic-voice-interface-evi/chat/chat#receive.User%20Interruption.type
   */
  private async handleWebSocketMessageEvent(message: Hume.empathicVoice.SubscribeEvent): Promise<void> {
    console.log(message);
    switch (message.type) {
      case "chat_metadata":
        this.chatGroupId = message.chatGroupId;
        break;
      case "user_message":
      case "assistant_message":
        const { role, content } = message.message;
        const topThreeEmotions = this.extractTopThreeEmotions(message);
        this.appendMessage(role, content ?? "", topThreeEmotions);
        break;
      case "audio_output":
        const audioOutput = message.data;
        const blob = convertBase64ToBlob(audioOutput, this.mimeType);
        this.audioQueue.push(blob);
        if (this.audioQueue.length >= 1) this.playAudio();
        break;
      case "user_interruption":
        this.stopAudio();
        break;
    }
    this.broadcastMessage(message);
  }

  /**
   * Callback for handling WebSocket error event.
   */
  private handleWebSocketErrorEvent(error: Error): void {
    console.error(error);
  }

  /**
   * Callback for handling WebSocket closed event.
   */
  private async handleWebSocketCloseEvent(): Promise<void> {
    if (this.getStore().getState().connected) await this.connect();
    console.log("Web socket connection closed");
  }

  /**
   * Appends a chat message to the UI.
   */
  private appendMessage(
    role: Hume.empathicVoice.Role,
    content: string,
    topThreeEmotions: { emotion: string; score: any }[]
  ): void {
    const chatCard = new ChatCard({
      role,
      timestamp: new Date().toLocaleTimeString(),
      content,
      scores: topThreeEmotions,
    });
    const chat = document.querySelector<HTMLDivElement>("div#chat");
    chat?.appendChild(chatCard.render());
    if (chat) chat.scrollTop = chat.scrollHeight;
  }

  /**
   * Extracts the top three emotion scores from a message.
   */
  private extractTopThreeEmotions(
    message: Hume.empathicVoice.UserMessage | Hume.empathicVoice.AssistantMessage
  ): { emotion: string; score: string }[] {
    const scores = message.models.prosody?.scores;
    const scoresArray = Object.entries(scores || {});
    scoresArray.sort((a, b) => b[1] - a[1]);
    return scoresArray.slice(0, 3).map(([emotion, score]) => ({
      emotion,
      score: (Math.round(Number(score) * 100) / 100).toFixed(2),
    }));
  }
}

interface Score {
  emotion: string;
  score: string;
}

interface ChatMessage {
  role: Hume.empathicVoice.Role;
  timestamp: string;
  content: string;
  scores: Score[];
}

class ChatCard {
  public message: ChatMessage;

  constructor(message: ChatMessage) {
    this.message = message;
  }

  private createScoreItem(score: Score): HTMLElement {
    const scoreItem = document.createElement("div");
    scoreItem.className = "score-item";
    scoreItem.innerHTML = `${score.emotion}: <strong>${score.score}</strong>`;
    return scoreItem;
  }

  public render(): HTMLElement {
    const card = document.createElement("div");
    card.className = `chat-card ${this.message.role}`;

    const role = document.createElement("div");
    role.className = "role";
    role.textContent =
      this.message.role.charAt(0).toUpperCase() + this.message.role.slice(1);

    const timestamp = document.createElement("div");
    timestamp.className = "timestamp";
    timestamp.innerHTML = `<strong>${this.message.timestamp}</strong>`;

    const content = document.createElement("div");
    content.className = "content";
    content.textContent = this.message.content;

    const scores = document.createElement("div");
    scores.className = "scores";
    this.message.scores.forEach((score) => {
      scores.appendChild(this.createScoreItem(score));
    });

    card.appendChild(role);
    card.appendChild(timestamp);
    card.appendChild(content);
    card.appendChild(scores);
    return card;
  }
}

export const humeService = HumeService.getInstance();
