import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { BuildingConfig } from '@/lib/buildingConfig';
import { defaultBuildingConfig } from '@/lib/buildingConfig';

const SYSTEM_PROMPT = `You are a building design assistant. Given a user's natural-language description, produce a JSON building configuration.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "config": { ... BuildingConfig fields ... },
  "confirmation": "short sentence confirming what you designed"
}

BuildingConfig fields and allowed values:
- floors: integer 1-200 (number of floors)
- width: number 5-500 (meters)
- length: number 5-500 (meters)
- heightPerFloor: number 2.5-6 (meters per floor)
- wallColor: color name (e.g. "white", "gray", "red", "blue", "beige", "brown") or hex like "#cc3333"
- windowStyle: "none" | "basic" | "glass" | "arched" | "circular" | "triangular"
- texture: "smooth" | "concrete" | "brick" | "wood" | "glass"
- roofStyle: "flat" | "gable" | "hip"
- style: "modern" | "classic" | "industrial"
- notes: optional string with extra notes

Food bank parameters (include ONLY if the user mentions a food bank, pantry, or distribution center):
- foodBankPalletCapacity: integer (total pallet storage positions, e.g. 50-500)
- foodBankCoordinators: integer (number of coordinators)
- foodBankVolunteers: integer (number of volunteers)
- foodBankStorageRooms: integer (total storage rooms)
- foodBankColdStorageUnits: integer (walk-in fridges/freezers)
- foodBankDistributionCounters: integer (client distribution counters)
- foodBankDeliveryVans: integer (delivery van count)
- foodBankIntakeRooms: integer (dedicated intake/registration rooms)
- foodBankFloors: integer (floors dedicated to food bank use)

Guidelines:
- If the user mentions a food bank/pantry, set reasonable parameters based on the size.
- Small pantry: ~20-50 pallet positions, 2-5 coordinators, 10-25 volunteers, 1-2 cold storage units, 2-4 distribution counters
- Medium food bank: ~100-200 pallet positions, 5-10 coordinators, 40-80 volunteers, 3-6 cold storage units, 6-12 distribution counters
- Large distribution center: ~300-500 pallet positions, 15-25 coordinators, 100-200 volunteers, 8-12 cold storage units, 15-25 distribution counters
- Always include ALL non-food-bank fields (floors, width, length, etc.) in every response.
- For food bank buildings, default to flat roof, modern style, concrete/glass texture unless specified.
- The confirmation should be a brief, friendly sentence (under 40 words).
- For food banks/pantries, mention key stats in the confirmation (e.g. pallet capacity, volunteers, floors) so the user hears them back.`;

function extractJSON(text: string): string {
  let out = text.trim();
  const codeBlock = /```(?:json)?\s*([\s\S]*?)```/.exec(out);
  if (codeBlock) out = codeBlock[1].trim();
  const braceMatch = out.match(/\{[\s\S]*\}/);
  if (braceMatch) out = braceMatch[0];
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, previousConfig } = body as {
      text: string;
      previousConfig?: Partial<BuildingConfig>;
    };

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text input is required.' },
        { status: 400 }
      );
    }

    const mergedPrevious = { ...defaultBuildingConfig, ...previousConfig };

    const userMessage = previousConfig
      ? `Current building configuration:\n${JSON.stringify(mergedPrevious, null, 2)}\n\nUser request: "${text.trim()}"\n\nUpdate ONLY the fields the user mentioned. Keep all other fields at their current values.`
      : `User request: "${text.trim()}"\n\nCreate a new building configuration based on this description. Use sensible defaults for any unspecified fields.`;

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: 'No response from AI model.' },
        { status: 500 }
      );
    }

    const jsonStr = extractJSON(raw);
    let parsed: { config: BuildingConfig; confirmation: string };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON.', raw },
        { status: 500 }
      );
    }

    if (!parsed.config || !parsed.confirmation) {
      return NextResponse.json(
        { error: 'AI response missing config or confirmation.', raw },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Design API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      },
      { status: 500 }
    );
  }
}
