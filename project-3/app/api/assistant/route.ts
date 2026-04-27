import { NextRequest, NextResponse } from 'next/server';
import {
  createAssistantCartItems,
  createWeatherRecommendedCartItem,
  getAssistantMenu,
  getAssistantToppings,
  searchAssistantMenu,
  type AssistantCartItem,
} from '@/lib/assistant-tools';
import { AVAILABLE_TOPPINGS, formatToppings } from '@/lib/toppings';

export const dynamic = 'force-dynamic';

type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type FunctionCall = {
  name: string;
  args?: Record<string, unknown>;
};

type AssistantAction = 'popular' | 'toppings' | 'weather-recommendation';

const configuredModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
const model = configuredModel.replace(/^models\//, '');
const fallbackModels = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
const failedModelCooldowns = new Map<string, number>();

function getNextPacificMidnightTime() {
  const now = new Date();
  const pacificDateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const getPart = (type: string) =>
    Number(pacificDateParts.find((part) => part.type === type)?.value);
  const pacificYear = getPart('year');
  const pacificMonth = getPart('month');
  const pacificDay = getPart('day');
  const nextPacificMidnightGuess = Date.UTC(pacificYear, pacificMonth - 1, pacificDay + 1, 8);
  const pacificOffsetHours =
    new Date(nextPacificMidnightGuess).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'shortOffset',
    }).includes('GMT-7')
      ? 7
      : 8;

  return Date.UTC(pacificYear, pacificMonth - 1, pacificDay + 1, pacificOffsetHours);
}

function getCooldownUntil(status: number) {
  if (status === 404) return Date.now() + 24 * 60 * 60 * 1000;
  if (status === 429) return getNextPacificMidnightTime();
  if (status === 503) return Date.now() + 30 * 60 * 1000;

  return Date.now() + 5 * 60 * 1000;
}

function isModelCoolingDown(candidateModel: string) {
  const cooldownUntil = failedModelCooldowns.get(candidateModel);

  if (!cooldownUntil) return false;

  if (Date.now() >= cooldownUntil) {
    failedModelCooldowns.delete(candidateModel);
    return false;
  }

  return true;
}

function getModelCandidates() {
  return [model, ...fallbackModels].filter(
    (candidate, index, candidates) =>
      candidates.indexOf(candidate) === index && !isModelCoolingDown(candidate)
  );
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
          description:
            'Requested toppings as a comma-separated string, such as "Boba, Red Bean", or None if no topping was requested.',
        },
      },
      required: ['itemName'],
    },
  },
  {
    name: 'add_weather_recommended_drink',
    description:
      'Add the recommended drink of the day based on current local weather. This creates a cart addition only and does not place an order.',
    parameters: {
      type: 'object',
      properties: {},
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

  const errors: string[] = [];

  const modelCandidates = getModelCandidates();

  if (modelCandidates.length === 0) {
    failedModelCooldowns.clear();
  }

  for (const candidateModel of modelCandidates.length > 0 ? modelCandidates : getModelCandidates()) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${apiKey}`,
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
                  'You are Team Matcha Assistant for a bubble tea POS. Help customers and cashiers with menu information, recommendations, toppings, sweetness, ice levels, and cart additions. Never claim you placed an order. You may add validated items to the cart, but checkout/order submission must be done by the user in the POS UI. When a user asks for multiple toppings, pass them to add_to_cart as one comma-separated topping string, for example "Boba, Red Bean". Be concise and friendly.',
              },
            ],
          },
          contents,
          tools: [{ functionDeclarations }],
          generationConfig: {
            temperature: 0.4,
          },
        }),
      }
    );

    if (response.ok) {
      return response.json();
    }

    const errorText = await response.text();
    errors.push(`${candidateModel}: ${errorText}`);
    failedModelCooldowns.set(candidateModel, getCooldownUntil(response.status));
  }

  throw new Error(`Gemini request failed for all configured models: ${errors.join(' | ')}`);
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

function formatToolReply(toolResults: { name: string; response: unknown }[]) {
  const weatherCartResult = toolResults.find((result) => result.name === 'add_weather_recommended_drink')
    ?.response as
    | { message?: string; reason?: string; cartItems?: AssistantCartItem[] }
    | undefined;
  const cartResult = toolResults.find((result) => result.name === 'add_to_cart')?.response as
    | { message?: string; cartItems?: AssistantCartItem[] }
    | undefined;

  if (weatherCartResult?.cartItems?.length) {
    return `${weatherCartResult.message ?? 'Added the weather recommendation to your cart.'} ${
      weatherCartResult.reason ?? ''
    } You can review it before placing the order.`;
  }

  if (cartResult?.cartItems?.length) {
    return `${cartResult.message ?? 'Added the item to your cart.'} You can review it before placing the order.`;
  }

  const searchResult = toolResults.find((result) => result.name === 'search_menu')?.response as
    | { results?: { name: string; cost: number; description?: string }[] }
    | undefined;

  if (searchResult?.results?.length) {
    return `I found ${searchResult.results
      .slice(0, 3)
      .map((item) => `${item.name} ($${item.cost.toFixed(2)})`)
      .join(', ')}. Tell me which one you want to add.`;
  }

  const menuResult = toolResults.find((result) => result.name === 'get_menu')?.response as
    | { menu?: { name: string; cost: number }[] }
    | undefined;

  if (menuResult?.menu?.length) {
    return `The menu has options like ${menuResult.menu
      .slice(0, 5)
      .map((item) => `${item.name} ($${item.cost.toFixed(2)})`)
      .join(', ')}.`;
  }

  const toppingsResult = toolResults.find((result) => result.name === 'get_toppings')?.response as
    | { toppings?: { name: string; cost: number }[] }
    | undefined;

  if (toppingsResult?.toppings?.length) {
    return `Available toppings include ${toppingsResult.toppings
      .map((item) => item.name)
      .join(', ')}.`;
  }

  return 'I can help with menu info and adding drinks to your cart.';
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
    case 'add_weather_recommended_drink':
      return {
        name: call.name,
        response: await createWeatherRecommendedCartItem(),
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
  const requestedToppings = formatToppings(
    AVAILABLE_TOPPINGS.filter((topping) => normalized.includes(topping.toLowerCase()))
  );

  if (
    normalized.includes('recommended drink of the day') ||
    (normalized.includes('weather') && normalized.includes('add'))
  ) {
    const result = await createWeatherRecommendedCartItem();
    cartItems.push(...result.cartItems);

    return {
      reply: `${result.message} ${result.reason} You can review it before placing the order.`,
      cartItems,
    };
  }

  if (normalized.includes('add')) {
    const menu = await getAssistantMenu();
    const requestedItem = menu.find((item) => normalized.includes(item.name.toLowerCase()));

    if (requestedItem) {
      const result = await createAssistantCartItems({
        itemName: requestedItem.name,
        topping: requestedToppings,
      });
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

async function handleDirectAction(action: AssistantAction) {
  if (action === 'weather-recommendation') {
    const result = await createWeatherRecommendedCartItem();

    return {
      reply: `${result.message} ${result.reason} You can review it before placing the order.`,
      cartItems: result.cartItems,
    };
  }

  if (action === 'toppings') {
    const toppings = await getAssistantToppings();

    return {
      reply: `Available toppings include ${toppings.map((item) => item.name).join(', ')}.`,
      cartItems: [],
    };
  }

  const menu = await getAssistantMenu();
  const popularItems = menu.filter((item) => item.tag === 'Popular').slice(0, 4);
  const fallbackItems = popularItems.length > 0 ? popularItems : menu.slice(0, 4);

  return {
    reply: `Popular picks include ${fallbackItems
      .map((item) => `${item.name} ($${item.cost.toFixed(2)})`)
      .join(', ')}. Tell me which one you want to add.`,
    cartItems: [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action?: AssistantAction; messages?: AssistantMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');

    if (!latestUserMessage?.content.trim()) {
      return NextResponse.json({ reply: 'Ask me about the menu or tell me what to add to the cart.', cartItems: [] });
    }

    if (
      body.action === 'popular' ||
      body.action === 'toppings' ||
      body.action === 'weather-recommendation'
    ) {
      return NextResponse.json(await handleDirectAction(body.action));
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
      reply: getText(secondResponse) || formatToolReply(toolResults),
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
