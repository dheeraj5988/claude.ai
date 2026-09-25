/**
 * Smart Title Generation Utility
 * On the very first reply received, parses the assistant's output to auto-generate
 * a concise, catchy title for the conversation thread.
 */

export function generateSmartTitle(userPrompt: string, assistantReply?: string): string {
  // If assistant reply is available, extract keywords or first key concept
  if (assistantReply && assistantReply.trim().length > 0) {
    const cleanText = assistantReply
      // Strip markdown headers
      .replace(/#+\s+/g, '')
      // Strip code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Strip inline code, bold, italics
      .replace(/[`*_~]/g, '')
      // Strip XML/antArtifact tags
      .replace(/<antArtifact[\s\S]*?>/gi, '')
      .replace(/<\/antArtifact>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    // Look for first meaningful line
    const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '';

    // Remove common assistant greetings / conversational filler
    const strippedFirstLine = firstLine
      .replace(/^(sure|certainly|here is|here's|i can help|let's|to accomplish this|in this guide|an overview of|a breakdown of)\s+(:|-)?\s*/i, '')
      .replace(/^this is a\s+/i, '')
      .replace(/^i've created\s+/i, '')
      .trim();

    if (strippedFirstLine.length >= 4 && strippedFirstLine.length <= 48) {
      // Capitalize first letter
      return capitalizeTitle(strippedFirstLine);
    }

    // Try extracting key noun phrase or concept (first 4-6 words)
    const words = strippedFirstLine.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      const candidate = words.slice(0, 5).join(' ');
      if (candidate.length >= 6) {
        return capitalizeTitle(candidate);
      }
    }
  }

  // Fallback to user prompt
  if (userPrompt && userPrompt.trim().length > 0) {
    const cleanPrompt = userPrompt
      .replace(/[#*`_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const words = cleanPrompt.split(' ');
    if (words.length <= 6 && cleanPrompt.length <= 36) {
      return capitalizeTitle(cleanPrompt);
    }
    return capitalizeTitle(words.slice(0, 5).join(' '));
  }

  return 'New conversation';
}

function capitalizeTitle(str: string): string {
  if (!str) return 'New conversation';
  // Strip trailing punctuation like colons, periods, or commas
  const cleaned = str.replace(/[:.,;!?]+$/, '').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
