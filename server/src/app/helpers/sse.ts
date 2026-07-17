import { Response } from "express";

interface Client {
  id: string;
  response: Response;
}

let clients: Client[] = [];

/**
 * Handle new SSE connections
 */
export const registerSseClient = (id: string, response: Response) => {
  clients.push({ id, response });
};

/**
 * Clean up closed SSE connections
 */
export const unregisterSseClient = (id: string) => {
  clients = clients.filter(c => c.id !== id);
};

/**
 * Broadcast progress event to all connected clients
 */
export const broadcastSseEvent = (data: {
  type: string;
  submissionId: string;
  progress?: { completedChecks: number; totalChecks: number };
  status?: string;
  totalScore?: number;
  maxScore?: number;
}) => {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.response.write(message);
    } catch (err) {
      console.error(`Failed to send SSE to client ${client.id}:`, err);
    }
  });
};
