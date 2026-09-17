import * as React from 'react';

/**
 * The little bit of Markdown a reply actually uses.
 *
 * Paragraphs, bullets, numbered lists, tables, bold and inline code. Not a
 * Markdown library: a reply here is a few sentences and a small table, and a
 * dependency that renders footnotes and nested blockquotes would be several
 * hundred kilobytes to solve a problem nobody has.
 *
 * It builds React elements. Nothing reaches `dangerouslySetInnerHTML`, so the
 * worst a model can write — or a customer's own notes quoted back through it —
 * is text that looks odd, never markup that runs.
 */

export function RichText({ text }: { text: string }) {
  const blocks = React.useMemo(() => parse(text), [text]);

  return (
    <div className="space-y-2.5 text-[13.5px] leading-relaxed">
      {blocks.map((block, index) => {
        if (block.kind === 'table') {
          return (
            <div key={index} className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle">
                    {block.header.map((cell, i) => (
                      <th
                        key={i}
                        className="whitespace-nowrap px-2.5 py-1.5 text-left font-medium text-muted-foreground"
                      >
                        <Inline text={cell} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r} className="border-b border-border/60 last:border-0">
                      {row.map((cell, c) => (
                        <td key={c} className="px-2.5 py-1.5 align-top">
                          <Inline text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.kind === 'list') {
          const List = block.ordered ? 'ol' : 'ul';
          return (
            <List
              key={index}
              className={
                block.ordered
                  ? 'ml-4 list-decimal space-y-1 marker:text-muted-foreground'
                  : 'ml-4 list-disc space-y-1 marker:text-muted-foreground'
              }
            >
              {block.items.map((item, i) => (
                <li key={i} className="pl-0.5">
                  <Inline text={item} />
                </li>
              ))}
            </List>
          );
        }

        if (block.kind === 'heading') {
          return (
            <p key={index} className="text-[13.5px] font-semibold">
              <Inline text={block.text} />
            </p>
          );
        }

        return (
          <p key={index}>
            <Inline text={block.text} />
          </p>
        );
      })}
    </div>
  );
}

/** Bold and inline code, which is all the emphasis a reply of this kind needs. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={index} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={index}
              className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'table'; header: string[]; rows: string[][] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;
/** A row of pipes; the separator under a header is all dashes and colons. */
const TABLE_ROW = /^\s*\|(.+)\|\s*$/;
const TABLE_RULE = /^\s*\|[\s:|-]+\|\s*$/;

function cells(line: string): string[] {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parse(text: string): Block[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];

  let paragraph: string[] = [];

  const flush = () => {
    const joined = paragraph.join(' ').trim();
    if (joined) blocks.push({ kind: 'paragraph', text: joined });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.trim() === '') {
      flush();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({ kind: 'heading', text: heading[1] });
      continue;
    }

    // A table is a header row, a rule, and then rows until the pipes stop.
    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1])) {
      flush();
      const header = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i])) {
        rows.push(cells(lines[i]));
        i += 1;
      }
      i -= 1;
      blocks.push({ kind: 'table', header, rows });
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);
    if (bullet || numbered) {
      flush();
      const ordered = Boolean(numbered);
      const items: string[] = [(bullet ?? numbered)![1]];

      while (i + 1 < lines.length) {
        const next = ordered ? NUMBERED.exec(lines[i + 1]) : BULLET.exec(lines[i + 1]);
        if (!next) break;
        items.push(next[1]);
        i += 1;
      }

      blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    paragraph.push(line.trim());
  }

  flush();
  return blocks;
}
