import 'server-only';

import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { mayUse, toolError, type AssistantTool, type ToolContext, type ToolResult } from '@/server/assistant/context';
import { READ_TOOLS } from '@/server/assistant/tools-read';
import { WRITE_TOOLS } from '@/server/assistant/tools-write';

/**
 * Everything the assistant can do, and the gate in front of it.
 *
 * The permission check here is the real one. Which tools the model is offered
 * is narrowed to what this person holds, and every call is checked again on the
 * way in — because the list of tools is a hint to a language model, and a hint
 * is not access control.
 */

export const ALL_TOOLS: AssistantTool[] = [...READ_TOOLS, ...WRITE_TOOLS];

const BY_NAME = new Map(ALL_TOOLS.map((tool) => [tool.name, tool]));

/**
 * The tool list as the API wants it, narrowed to this person.
 *
 * Sorted by name, because the tool block is the first thing in the cached
 * prefix and a set that reshuffles between requests would invalidate the cache
 * on every turn.
 *
 * `eager_input_streaming` is deliberately off. It exists so a large tool input
 * streams as it is generated, and the largest thing here is an invoice with a
 * few lines — no latency to win, and the tolerant parser it turns on can hand
 * back a silently truncated input.
 */
export function toolsFor(permissions: readonly string[]): Anthropic.Tool[] {
  return ALL_TOOLS.filter((tool) => mayUse(tool, permissions))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((tool) => {
      const schema = z.toJSONSchema(tool.schema, { target: 'draft-7', io: 'input' }) as Record<
        string,
        unknown
      >;
      delete schema.$schema;

      return {
        name: tool.name,
        description: tool.description,
        input_schema: schema as Anthropic.Tool.InputSchema,
      };
    });
}

export function findTool(name: string): AssistantTool | undefined {
  return BY_NAME.get(name);
}

/**
 * Runs one call.
 *
 * Three ways this refuses, and all of them come back as an ordinary tool result
 * the model can read and work around rather than as an exception: a tool that
 * does not exist, one this person may not use, and an input that does not fit
 * the schema. The third is the one that matters in practice — a model will
 * occasionally send a string where a number belongs, and the right answer is to
 * tell it so.
 */
export async function runTool(
  name: string,
  rawInput: unknown,
  context: ToolContext,
  permissions: readonly string[],
): Promise<ToolResult> {
  const tool = findTool(name);
  if (!tool) return toolError(`There is no tool called ${name}.`);

  if (!mayUse(tool, permissions)) {
    return toolError(
      `You do not have permission to do that in this workspace. Say so plainly; do not try another way round it.`,
    );
  }

  const parsed = tool.schema.safeParse(rawInput);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return toolError(
      `Those arguments are not valid${issue?.path.length ? ` (${issue.path.join('.')})` : ''}: ${
        issue?.message ?? 'check them'
      }.`,
    );
  }

  try {
    return await tool.run(parsed.data, context);
  } catch (error) {
    console.error('Assistant tool failed', { tool: name, error });
    return toolError('That could not be looked up just now. Try again, or say so.');
  }
}
