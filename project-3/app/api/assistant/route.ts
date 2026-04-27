import { NextRequest, NextResponse } from 'next/server';
import {
  createAssistantCartItems,
  getAssistantMenu,
  getAssistantToppings,
  searchAssistantMenu,
  type AssistantCartItem,
} from '@/lib/assistant-tools';

export const dynamic = 'force-dynamic';

type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type FunctionCall = {
  name: string;
  args?: Record<string, unknown>;
};

const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const thinkingLevel = process.env.GEMINI_THINKING_LEVEL || 'minimal';
const thinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? 0);

function getThinkingConfig() {
  if (model.startsWith('gemini-3')) {
    return {
      thinkingLevel,
    };
  }

  return {
    thinkingBudget,
  };
}

const functionDeclarations = [
  {
    name: 'search_menu',
    description:
      'Search Team Matcha menu items by drink name, flavor, category, or description. Use this for menu questions and recommendations.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The user menu search query, such as "mango", "fruit tea", or "something creamy".',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_menu',
    description: 'Get the current Team Matcha menu with prices and descriptions.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_toppings',
    description: 'Get available toppings that can be added to drinks.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'add_to_cart',
    description:
      'Create a cart addition for a menu item. Use only when the user clearly asks to add an item to their cart. This does not place or submit an order.',
    parameters: {
      type: 'object',
      properties: {
        itemName: {
          type: 'string',
          description: 'The closest menu item name requested by the user.',
        },
        quantity: {
          type: 'integer',
          description: 'How many of the item to add. Defaults to 1.',
        },
        iceLevel: {
          type: 'string',
          enum: ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'],
          description: 'Requested ice level. Defaults to Regular Ice.',
        },
        sugarLevel: {
          type: 'string',
          enum: ['0%', '25%', '50%', '75%', '100%', '125%'],
          description: 'Requested sweetness level. Defaults to 100%.',
        },
        topping: {
          type: 'string',
          description: 'Requested topping, or None if no topping was requested.',
        },
      },
      required: ['itemName'],
    },
  },
];

function toGeminiContents(messages: AssistantMessage[]) {
  return messages.slice(-12).map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

async function callGemini(contents: unknown[]) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                'You are Team Matcha Assistant for a bubble tea POS. Help customers and cashiers with menu information, recommendations, toppings, sweetness, ice levels, and cart additions. Never claim you placed an order. You may add validated items to the cart, but checkout/order submission must be done by the user in the POS UI. Be concise and friendly.',
            },
          ],
        },
        contents,
        tools: [{ functionDeclarations }],
        generationConfig: {
          temperature: 0.4,
          thinkingConfig: getThinkingConfig(),
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${errorText}`);
  }

  return response.json();
}

function getText(response: { candidates?: { content?: { parts?: { text?: string }[] } }[] }) {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join('\n') || ''
  );
}

function getFunctionCalls(response: {
  candidates?: { content?: { parts?: { functionCall?: FunctionCall }[] } }[];
}) {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.functionCall)
      .filter((call): call is FunctionCall => Boolean(call?.name)) || []
  );
}

async function runTool(call: FunctionCall) {
  const args = call.args ?? {};

  switch (call.name) {
    case 'search_menu':
      return {
        name: call.name,
        response: {
          results: await searchAssistantMenu(String(args.query ?? '')),
        },
      };
    case 'get_menu':
      return {
        name: call.name,
        response: {
          menu: await getAssistantMenu(),
        },
      };
    case 'get_toppings':
      return {
        name: call.name,
        response: {
          toppings: await getAssistantToppings(),
        },
      };
    case 'add_to_cart':
      return {
        name: call.name,
        response: await createAssistantCartItems({
          itemName: String(args.itemName ?? ''),
          quantity: Number(args.quantity ?? 1),
          iceLevel: typeof args.iceLevel === 'string' ? args.iceLevel : undefined,
          sugarLevel: typeof args.sugarLevel === 'string' ? args.sugarLevel : undefined,
          topping: typeof args.topping === 'string' ? args.topping : undefined,
        }),
      };
    default:
      return {
        name: call.name,
        response: {
          error: `Unknown function ${call.name}`,
        },
      };
  }
}

async function fallbackAssistant(message: string) {
  const cartItems: AssistantCartItem[] = [];
  const normalized = message.toLowerCase();

  if (normalized.includes('add')) {
    const menu = await getAssistantMenu();
    const requestedItem = menu.find((item) => normalized.includes(item.name.toLowerCase()));

    if (requestedItem) {
      const result = await createAssistantCartItems({ itemName: requestedItem.name });
      cartItems.push(...result.cartItems);

      return {
        reply: `${requestedItem.name} is ready in your cart. You can review it before placing the order.`,
        cartItems,
      };
    }
  }

  const results = await searchAssistantMenu(message);

  if (results.length > 0) {
    return {
      reply: `I found ${results
        .slice(0, 3)
        .map((item) => `${item.name} ($${item.cost.toFixed(2)})`)
        .join(', ')}. Tell me which one you want to add.`,
      cartItems,
    };
  }

  return {
    reply:
      'I can help with menu questions and cart additions. Try asking for a flavor like mango, matcha, taro, or brown sugar.',
    cartItems,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { messages?: AssistantMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');

    if (!latestUserMessage?.content.trim()) {
      return NextResponse.json({ reply: 'Ask me about the menu or tell me what to add to the cart.', cartItems: [] });
    }

    if (!process.env.GEMINI_API_KEY) {
      const fallback = await fallbackAssistant(latestUserMessage.content);
      return NextResponse.json({
        ...fallback,
        warning: 'GEMINI_API_KEY is not configured, so the assistant used local menu matching.',
      });
    }

    const contents = toGeminiContents(messages);
    const firstResponse = await callGemini(contents);
    const calls = getFunctionCalls(firstResponse);

    if (calls.length === 0) {
      return NextResponse.json({
        reply: getText(firstResponse) || 'I can help with menu info and adding drinks to your cart.',
        cartItems: [],
      });
    }

    const toolResults = await Promise.all(calls.map(runTool));
    const cartItems = toolResults.flatMap((result) => {
      const response = result.response as { cartItems?: AssistantCartItem[] };
      return response.cartItems ?? [];
    });

    const modelContent = firstResponse.candidates?.[0]?.content;
    const secondResponse = await callGemini([
      ...contents,
      modelContent,
      {
        role: 'tool',
        parts: toolResults.map((result) => ({
          functionResponse: {
            name: result.name,
            response: result.response,
          },
        })),
      },
    ]);

    return NextResponse.json({
      reply: getText(secondResponse) || toolResults.map((result) => result.response).join('\n'),
      cartItems,
    });
  } catch (error) {
    console.error('Assistant error:', error);
    return NextResponse.json(
      {
        reply: 'I had trouble reaching the assistant service. The POS cart is still safe to use manually.',
        cartItems: [],
      },
      { status: 500 }
    );
  }
}
