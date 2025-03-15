import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';
import { ConversationStage, ConversationState, RequestType, EmailConfig } from '../../types/chat';

// הגדרת הודעות לכל שלב
const STAGE_MESSAGES = {
  [ConversationStage.INITIAL]: 'שלום, אני מערכת הדיווח של חניה אורבנית - במה אוכל לעזור לכם?',
  [ConversationStage.GET_REQUEST_TYPE]: 'האם תרצו לדווח על תקלה או להשאיר הודעה?',
  [ConversationStage.GET_CONTACT_INFO]: 'אנא הזינו את מספר הטלפון או מספר הלקוח שלכם',
  [ConversationStage.GET_PHONE]: 'אנא הזינו את מספר הטלפון שלכם ליצירת קשר',
  [ConversationStage.GET_SITE_ADDRESS]: 'באיזה אתר נמצאת החניה?',
  [ConversationStage.GET_ISSUE_DESCRIPTION]: 'אנא תארו את התקלה',
  [ConversationStage.CHECK_SYSTEM_STATUS]: 'האם המתקן מושבת כתוצאה מהתקלה? (כן/לא)',
  [ConversationStage.GET_EMAIL]: 'לאיזו כתובת מייל לשלוח את סיכום התקלה?',
  [ConversationStage.GET_MESSAGE]: 'אנא כתוב את הודעתך.',
  [ConversationStage.COMPLETED]: 'תודה על פנייתכם. הפרטים נקלטו במערכת ויטופלו בהקדם.'
};

// בדיקת מפתח API
const apiKey = process.env.OPENAI_API_KEY;
console.log('API Key starts with:', apiKey?.substring(0, 7));

if (!apiKey) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: apiKey
});

// פונקציה לזיהוי סוג הפניה
function identifyRequestType(message: string): RequestType {
  const lowerMessage = message.toLowerCase().trim();
  
  // מילות מפתח לדיווח תקלה
  const issueKeywords = [
    'תקלה',
    'בעיה',
    'לא עובד',
    'דיווח',
    'מקולקל',
    'שבור',
    'תיקון',
    'מתקלקל',
    'תקול'
  ];

  // מילות מפתח להשארת הודעה
  const messageKeywords = [
    'הודעה',
    'למסור',
    'להשאיר',
    'לעדכן',
    'להודיע',
    'לדבר',
    'ליצור קשר'
  ];

  // בדיקה אם ההודעה מכילה מילות מפתח של תקלה
  if (issueKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return RequestType.ISSUE;
  }
  
  // בדיקה אם ההודעה מכילה מילות מפתח של הודעה
  if (messageKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return RequestType.MESSAGE;
  }

  return RequestType.UNKNOWN;
}

interface ValidationResult {
  isValid: boolean;
  error: string;
}

function validateInput(message: string, stage: ConversationStage): ValidationResult {
  switch (stage) {
    case ConversationStage.GET_CONTACT_INFO:
      const isValidContact = /^\d{7,10}$/.test(message) || message.length >= 3;
      return {
        isValid: isValidContact,
        error: 'מספר הטלפון או מספר הלקוח אינו תקין. אנא הזן מספר בן 7-10 ספרות או מזהה לקוח תקין.'
      };
    
    case ConversationStage.GET_PHONE:
      const isValidPhone = /^\d{7,10}$/.test(message);
      return {
        isValid: isValidPhone,
        error: 'מספר הטלפון אינו תקין. אנא הזן מספר בן 7-10 ספרות.'
      };
    
    case ConversationStage.GET_SITE_ADDRESS:
      const isValidAddress = message.length >= 5;
      return {
        isValid: isValidAddress,
        error: 'אנא הזן כתובת מפורטת יותר (לפחות 5 תווים).'
      };
    
    case ConversationStage.GET_ISSUE_DESCRIPTION:
      const isValidDescription = message.length >= 3;
      return {
        isValid: isValidDescription,
        error: 'אנא הזן תיאור מפורט יותר (לפחות 3 תווים).'
      };

    case ConversationStage.CHECK_SYSTEM_STATUS:
      const lowerMessage = message.toLowerCase().trim();
      const isValidStatus = ['כן', 'לא'].includes(lowerMessage);
      return {
        isValid: isValidStatus,
        error: 'אנא ענה "כן" או "לא" - האם המתקן מושבת?'
      };

    case ConversationStage.GET_EMAIL:
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(message);
      return {
        isValid: isValidEmail,
        error: 'כתובת המייל אינה תקינה. אנא הזן כתובת מייל חוקית.'
      };

    default:
      return {
        isValid: true,
        error: ''
      };
  }
}

// פונקציה ליצירת סיכום
function createSummary(state: ConversationState): string {
  if (state.requestType === RequestType.ISSUE) {
    const contactInfo = state.customerPhone ? 
      `מספר טלפון: ${state.customerPhone}` : 
      `מספר לקוח: ${state.customerId}`;

    const systemStatus = state.isSystemDisabled ? 
      'כן - המתקן מושבת' : 
      'לא - המתקן עדיין פעיל';

    return `
תודה על פנייתכם למערכת הדיווח של חניה אורבנית.
להלן סיכום הדיווח:
--------------------------------
סוג פנייה: דיווח על תקלה
${contactInfo}
כתובת האתר: ${state.siteAddress}
תיאור התקלה: ${state.issueDescription}
מצב המתקן: ${systemStatus}
--------------------------------
הפנייה נקלטה במערכת ותטופל בהקדם.
במידת הצורך ניצור איתכם קשר בהתאם לפרטים שמסרתם.
    `.trim();
  } else {
    return `
תודה על פנייתכם למערכת הדיווח של חניה אורבנית.
להלן סיכום ההודעה:
--------------------------------
סוג פנייה: הודעה כללית
${state.customerPhone ? `מספר טלפון: ${state.customerPhone}` : ''}
${state.customerId ? `מספר לקוח: ${state.customerId}` : ''}
תוכן ההודעה: ${state.issueDescription}
--------------------------------
הודעתכם נקלטה במערכת ותטופל בהקדם.
    `.trim();
  }
}

// פונקציה לקבלת הודעת המערכת בהתאם לשלב
function getStageMessage(stage: ConversationStage, requestType: RequestType): string {
  if (stage === ConversationStage.GET_ISSUE_DESCRIPTION && requestType === RequestType.MESSAGE) {
    return 'אנא השאירו את הודעתכם';
  }
  return STAGE_MESSAGES[stage];
}

// פונקציה לשליחת מייל
async function sendEmail(emailConfig: EmailConfig, summary: string) {
  try {
    // בדיקה שכל הפרטים הנדרשים קיימים
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // המרת הטקסט ל-HTML
    const htmlContent = summary
      .replace(/\n/g, '<br>')
      .replace(/--------------------------------/g, '<hr>')
      .replace(/^(.+?):/gm, '<strong>$1:</strong>');

    // שליחת המייל
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: emailConfig.to,
      subject: emailConfig.subject,
      text: summary,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          ${htmlContent}
        </div>
      `
    });

    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationState } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let currentState = conversationState || {
      stage: ConversationStage.INITIAL,
      requestType: RequestType.UNKNOWN,
      customerPhone: '',
      customerId: '',
      siteAddress: '',
      issueDescription: '',
      isSystemDisabled: false
    };

    // בשלב הראשוני, נזהה את סוג הפניה
    if (currentState.stage === ConversationStage.INITIAL) {
      const requestType = identifyRequestType(message);
      if (requestType !== RequestType.UNKNOWN) {
        currentState = {
          ...currentState,
          stage: ConversationStage.GET_CONTACT_INFO,
          requestType
        };
        return res.status(200).json({
          response: getStageMessage(ConversationStage.GET_CONTACT_INFO, requestType),
          conversationState: currentState
        });
      } else {
        return res.status(200).json({
          response: getStageMessage(ConversationStage.GET_REQUEST_TYPE, RequestType.UNKNOWN),
          conversationState: {
            ...currentState,
            stage: ConversationStage.GET_REQUEST_TYPE
          }
        });
      }
    }

    // בשלב זיהוי סוג הפניה
    if (currentState.stage === ConversationStage.GET_REQUEST_TYPE) {
      const requestType = identifyRequestType(message);
      if (requestType !== RequestType.UNKNOWN) {
        currentState = {
          ...currentState,
          stage: ConversationStage.GET_CONTACT_INFO,
          requestType
        };
        return res.status(200).json({
          response: getStageMessage(ConversationStage.GET_CONTACT_INFO, requestType),
          conversationState: currentState
        });
      } else {
        return res.status(200).json({
          response: 'לא הצלחתי להבין את בקשתך. האם תוכל לנסח מחדש?',
          conversationState: currentState
        });
      }
    }

    // בדיקת תקינות הקלט בשלבים הרלוונטיים
    if ([ConversationStage.GET_CONTACT_INFO, 
         ConversationStage.GET_PHONE,
         ConversationStage.GET_SITE_ADDRESS, 
         ConversationStage.GET_ISSUE_DESCRIPTION,
         ConversationStage.CHECK_SYSTEM_STATUS,
         ConversationStage.GET_EMAIL].includes(currentState.stage)) {
      const validationResult = validateInput(message, currentState.stage);
      if (!validationResult.isValid) {
        return res.status(200).json({
          response: validationResult.error,
          conversationState: currentState
        });
      }
    }

    // עדכון המצב בהתאם לשלב הנוכחי
    switch (currentState.stage) {
      case ConversationStage.GET_CONTACT_INFO:
        if (message.match(/^\d{7,10}$/)) {
          // אם זה מספר טלפון תקין
          currentState = {
            ...currentState,
            stage: ConversationStage.GET_SITE_ADDRESS,
            customerPhone: message
          };
        } else {
          // אם זה מספר לקוח, נשמור אותו ונבקש מספר טלפון
          currentState = {
            ...currentState,
            customerId: message,
            stage: ConversationStage.GET_PHONE
          };
          return res.status(200).json({
            response: 'אנא הזן את מספר הטלפון שלך ליצירת קשר',
            conversationState: currentState
          });
        }
        break;

      case ConversationStage.GET_PHONE:
        if (!message.match(/^\d{7,10}$/)) {
          return res.status(200).json({
            response: 'מספר הטלפון אינו תקין. אנא הזן מספר בן 7-10 ספרות.',
            conversationState: currentState
          });
        }
        currentState = {
          ...currentState,
          stage: ConversationStage.GET_SITE_ADDRESS,
          customerPhone: message
        };
        break;

      case ConversationStage.GET_SITE_ADDRESS:
        currentState = {
          ...currentState,
          stage: ConversationStage.GET_ISSUE_DESCRIPTION,
          siteAddress: message
        };
        break;

      case ConversationStage.GET_ISSUE_DESCRIPTION:
        currentState = {
          ...currentState,
          stage: currentState.requestType === RequestType.ISSUE ? 
            ConversationStage.CHECK_SYSTEM_STATUS : 
            ConversationStage.COMPLETED,
          issueDescription: message
        };
        break;

      case ConversationStage.CHECK_SYSTEM_STATUS:
        const lowerMessage = message.toLowerCase().trim();
        if (!['כן', 'לא'].includes(lowerMessage)) {
          return res.status(200).json({
            response: 'אנא ענה "כן" או "לא" - האם המתקן מושבת?',
            conversationState: currentState
          });
        }
        currentState = {
          ...currentState,
          stage: ConversationStage.GET_EMAIL,
          isSystemDisabled: lowerMessage === 'כן'
        };
        break;

      case ConversationStage.GET_EMAIL:
        const emailConfig: EmailConfig = {
          to: message,
          from: process.env.SMTP_FROM || 'no-reply@urbanparking.co.il',
          subject: 'סיכום דיווח תקלה - חניה אורבנית'
        };
        currentState = {
          ...currentState,
          stage: ConversationStage.COMPLETED,
          emailConfig
        };
        break;
    }

    // אם השלב הוא COMPLETED, נחזיר את הסיכום ונשלח מייל
    if (currentState.stage === ConversationStage.COMPLETED) {
      const summary = createSummary(currentState);
      
      if (currentState.emailConfig) {
        const emailSent = await sendEmail(currentState.emailConfig, summary);
        if (!emailSent) {
          return res.status(200).json({
            response: 'אירעה שגיאה בשליחת המייל. אנא נסה שנית או צור קשר עם התמיכה.',
            conversationState: {
              ...currentState,
              stage: ConversationStage.GET_EMAIL
            }
          });
        }
      }

      return res.status(200).json({
        response: summary,
        conversationState: currentState
      });
    }

    return res.status(200).json({
      response: getStageMessage(currentState.stage, currentState.requestType),
      conversationState: currentState
    });

  } catch (error) {
    console.error('Error processing chat message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 