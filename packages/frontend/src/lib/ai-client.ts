/**
 * AI Service Client
 * Type-safe client for communicating with the AI service via backend proxy
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

/**
 * Parsed CAD command from AI
 */
export interface ParsedCommand {
  operation: 'create' | 'modify' | 'delete' | 'measure' | 'analyze';
  geometry: 'box' | 'cylinder' | 'sphere' | 'hole' | 'fillet' | 'chamfer' | 'extrude' | 'cut';
  parameters: Record<string, any>;
  confidence: number;
  reasoning?: string;
  suggestions?: string[];
}

/**
 * AI command response
 */
export interface AICommandResponse {
  success: boolean;
  parsed_command: ParsedCommand;
  message?: string;
}

/**
 * AI command request
 */
export interface AICommandRequest {
  command: string;
  context?: {
    project_id?: string;
    selected_features?: string[];
    current_sketch?: string;
  };
}

/**
 * AI service error
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * Send a natural language command to the AI service
 */
export async function sendCommand(
  command: string,
  projectId?: string,
  context?: Record<string, any>
): Promise<AICommandResponse> {
  try {
    const requestBody: AICommandRequest = {
      command,
      context: {
        project_id: projectId,
        ...context,
      },
    };

    const response = await fetch(`${API_BASE_URL}/api/ai/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Auth will be handled by backend proxy
      },
      body: JSON.stringify(requestBody),
      credentials: 'include', // Include cookies for session
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AIServiceError(
        error.message || 'Failed to process command',
        response.status,
        error
      );
    }

    const data = await response.json();
    return data.data || data; // Handle wrapped responses
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    // Network or other errors
    throw new AIServiceError(
      error instanceof Error ? error.message : 'Failed to connect to AI service',
      0,
      error
    );
  }
}

/**
 * Get example commands from AI service
 */
export async function getExamples(): Promise<Array<{
  command: string;
  description: string;
  expected_operation: string;
  expected_geometry: string;
}>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/examples`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new AIServiceError('Failed to fetch examples', response.status);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Failed to fetch AI examples:', error);
    // Return default examples if API fails
    return [
      {
        command: 'Create a 50mm cube',
        description: 'Create a cubic box with all sides 50mm',
        expected_operation: 'create',
        expected_geometry: 'box',
      },
      {
        command: 'Make a box 10x20x30mm',
        description: 'Create a rectangular box',
        expected_operation: 'create',
        expected_geometry: 'box',
      },
      {
        command: 'Add a 5mm fillet to all edges',
        description: 'Round all edges with 5mm radius',
        expected_operation: 'modify',
        expected_geometry: 'fillet',
      },
    ];
  }
}

/**
 * Get AI service status
 */
export async function getAIStatus(): Promise<{
  status: string;
  claude_available: boolean;
  capabilities: any;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new AIServiceError('Failed to fetch AI status', response.status);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Failed to fetch AI status:', error);
    return {
      status: 'unknown',
      claude_available: false,
      capabilities: {},
    };
  }
}
