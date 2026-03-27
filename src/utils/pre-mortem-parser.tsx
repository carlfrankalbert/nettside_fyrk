/**
 * Parsing utilities for Pre-Mortem Brief result display
 * Extracted from PreMortemResultDisplay for testability
 */

/**
 * Parse markdown content into sections for better rendering
 */
export function parsePreMortemSections(content: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];

  // Split by section headers (numbered with **)
  const sectionRegex = /\*\*(\d+)\.\s+([^*]+)\*\*/g;
  let match;

  const matches: { index: number; fullMatch: string; number: string; title: string }[] = [];

  while ((match = sectionRegex.exec(content)) !== null) {
    matches.push({
      index: match.index,
      fullMatch: match[0],
      number: match[1],
      title: match[2].trim(),
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const startIndex = current.index + current.fullMatch.length;
    const endIndex = next ? next.index : content.length;

    const sectionContent = content.slice(startIndex, endIndex).trim();

    sections.push({
      title: `${current.number}. ${current.title}`,
      content: sectionContent,
    });
  }

  return sections;
}

/**
 * Parse text with inline bold markers (**text**) into React elements
 * Safely handles content without XSS risk
 */
export function parseInlineBold(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add the bold text as a React element
    parts.push(
      <strong key={match.index} className="font-semibold text-neutral-800">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
