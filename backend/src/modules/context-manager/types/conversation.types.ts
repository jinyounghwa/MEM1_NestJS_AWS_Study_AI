export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationState {
  currentIS: string;
  currentTopic: string;
  allTopics: string[];
  currentTopicIndex: number;
  topicISHistory: Map<string, string>;
  conversationHistory: Message[];
  lastAIResponse: string;
  stepCount: number;
  rolePlayMode: boolean;
  networkVisualizationMode: boolean;
  currentScenario?: RolePlayScenario;
  currentNetworkDiagram?: NetworkDiagram;
}

export interface ChatResponse {
  response: string;
  hasIS: boolean;
  tip: string;
  currentStep: number;
  scenario?: RolePlayScenario;
  networkDiagram?: NetworkDiagram;
  progress?: {
    currentTopic: string;
    currentIndex: number;
    totalTopics: number;
    completedTopics: string[];
  };
}

export interface RolePlayScenario {
  situation: string;
  characters: {
    name: string;
    role: string;
    description: string;
  }[];
  dialogue: {
    speaker: string;
    message: string;
    codeExample?: string;
    awsCost?: string;
  }[];
  problem: string;
  solution: string;
  businessImpact?: string;
}

export interface NetworkDiagram {
  type: 'vpc' | 'subnet' | 'security-group' | 'routing';
  components: NetworkComponent[];
  connections: NetworkConnection[];
  explanation: string;
}

export interface NetworkComponent {
  id: string;
  type: string;
  label: string;
  cidr?: string;
  properties?: Record<string, any>;
}

export interface NetworkConnection {
  from: string;
  to: string;
  type: 'route' | 'peering' | 'gateway' | 'traffic';
  label?: string;
}
