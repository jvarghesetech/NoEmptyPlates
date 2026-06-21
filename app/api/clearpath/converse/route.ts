import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are NoEmptyPlates's intake AI. You help people quickly find the nearest food bank.

Rules:
1. Ask ONE short question at a time. Max 1-2 sentences per response.
2. NO filler. No "I'm sorry to hear that", no "That sounds tough". Jump straight to the next question or action.
3. Gather: roughly how many people in their household need food.
4. You MUST finish within 1-2 user messages. After the user's 1st reply with a household size, you MUST finalize on your next response. Do NOT ask more than 2 questions total.
5. Your FINAL message before finalizing must give brief general guidance on what to bring (e.g. "Bring a photo ID and reusable bags if you have them — not always required.") and end with: "Finding the nearest food bank now."

CRITICAL RULES:
- NEVER output JSON, code blocks, or structured data in your spoken text.
- When you have the household size (or after 2 exchanges — whichever comes first), you MUST add a line at the very end starting with "INTAKE_RESULT:" followed by JSON:
INTAKE_RESULT:{"householdSize": 1, "reasoning": "brief explanation", "done": true, "freeText": "summary"}
- The INTAKE_RESULT line is stripped before display — the person never sees it.
- If household size is unclear, default to 1. NEVER keep chatting past 2 exchanges.

Be direct. Every word counts.`;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: Message[] };

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });
    const modelId = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';

    const userMessageCount = messages.filter(m => m.role === 'user').length;

    // Hard cutoff: if 4+ user messages, force completion from conversation history
    if (userMessageCount >= 4) {
      const conversationSummary = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('; ');
      return NextResponse.json({
        reply: "Got it. Bring a photo ID and reusable bags if you have them. Finding the nearest food bank now.",
        intake: {
          householdSize: 1,
          reasoning: `Auto-completed after extended conversation: ${conversationSummary.slice(0, 200)}`,
          freeText: conversationSummary.slice(0, 300),
        },
      });
    }

    const fullMessages: Array<{ role: 'user' | 'assistant'; content: string }> = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    // After 2 user messages, inject a hard nudge to force completion NOW
    if (userMessageCount >= 2) {
      fullMessages.push({
        role: 'user',
        content: '[SYSTEM] You have enough information. You MUST finalize NOW. Give brief what-to-bring guidance, end with "Finding the nearest food bank now." and include the INTAKE_RESULT line. Do NOT ask any more questions.',
      });
    }

    const result = await anthropic.messages.create({
      model: modelId,
      system: SYSTEM_PROMPT,
      temperature: 0.4,
      max_tokens: 300,
      messages: fullMessages,
    });

    const text = result.content[0]?.type === 'text' ? result.content[0].text : '';

    // Extract intake JSON from the response — greedy match to handle nested braces
    let intake = null;

    const intakeMatch = /INTAKE_RESULT:\s*(\{[\s\S]*\})\s*$/.exec(text);
    if (intakeMatch) {
      try {
        const parsed = JSON.parse(intakeMatch[1].trim());
        if (parsed.done && parsed.reasoning) {
          intake = {
            householdSize: parsed.householdSize ?? 1,
            reasoning: parsed.reasoning,
            freeText: parsed.freeText || null,
          };
        }
      } catch {
        // Not valid JSON, ignore
      }
    }

    // Clean the display text — strip all machine-readable data so only natural speech remains
    const displayText = text
      .replace(/INTAKE_RESULT:\s*\{[\s\S]*\}\s*$/g, '')
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/\{[^}]*"householdSize"\s*:[\s\S]*\}/g, '')
      .replace(/\{[^}]*"done"\s*:\s*true[\s\S]*\}/g, '')
      .trim();

    return NextResponse.json({
      reply: displayText,
      intake,
    });
  } catch (err) {
    console.error('Converse API error:', err);
    return NextResponse.json(
      { error: 'Conversation failed. Please try again.' },
      { status: 500 }
    );
  }
}
