export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export enum RequestType {
  UNKNOWN = 'UNKNOWN',
  ISSUE = 'ISSUE',
  MESSAGE = 'MESSAGE'
}

export enum ConversationStage {
  INITIAL = 'INITIAL',
  GET_REQUEST_TYPE = 'GET_REQUEST_TYPE',
  GET_CONTACT_INFO = 'GET_CONTACT_INFO',
  GET_PHONE = 'GET_PHONE',
  GET_SITE_ADDRESS = 'GET_SITE_ADDRESS',
  GET_ISSUE_DESCRIPTION = 'GET_ISSUE_DESCRIPTION',
  CHECK_SYSTEM_STATUS = 'CHECK_SYSTEM_STATUS',
  GET_EMAIL = 'GET_EMAIL',
  GET_MESSAGE = 'GET_MESSAGE',
  COMPLETED = 'COMPLETED'
}

export interface EmailConfig {
  to: string;
  from: string;
  subject: string;
}

export interface ConversationState {
  stage: ConversationStage;
  requestType: RequestType;
  customerPhone?: string;
  customerId?: string;
  siteAddress?: string;
  issueDescription?: string;
  isSystemDisabled?: boolean;
  message?: string;
  emailConfig?: EmailConfig;
}

export interface ChatResponse {
  response: string;
  conversationState: ConversationState;
} 