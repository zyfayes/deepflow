import { PromptTemplate, PromptContext } from '../types.js';

export const quickSummaryPrompt: PromptTemplate = {
    id: 'quick_summary',
    name: 'Quick Summary',
    description: 'Concise summary with key takeaways',
    criteria: {
        // Broad criteria, fallback will be handled by explicit ID selection
    }, 
    generate: (context: PromptContext) => {
        const { preferences } = context;
        // const mode = preferences?.mode || 'single'; // Default to single for summary
        
        // Although the preset defines mode/type, we override the instructions for this specific template to ensure it meets the "Quick Summary" goal.
        
        const persona = `You are Deep, a concise and insightful expert synthesizer. You excel at distilling complex information into clear, high-impact summaries.`;
        
        const taskDescription = `Your task is to analyze the provided materials and create a CONCISE summary script suitable for a quick 5-minute update.`;

        const lengthInstruction = `- Keep the script concise. Aim for ~600 words. Focus on the "So What?" and key takeaways.`;

        const structureInstruction = `- Structure: Start with a 30-second executive summary, then break down the 3-5 most important points. End with a practical takeaway.`;

        return `
    ${persona}
    
    ${taskDescription}

    Output STRICT JSON format with the following structure:
    {
      "title": "A catchy, punchy title",
      "summary": "A one-sentence hook.",
      "knowledgeCards": [
        {
          "title": "Key Concept",
          "content": "A concise explanation. Focus on the core definition.",
          "tags": ["tag1", "tag2"]
        }
      ],
      "podcastScript": [
        {
          "speaker": "Deep",
          "text": "..."
        }
      ]
    }
    
    CRITICAL REQUIREMENTS:
    
    1. SCRIPT LENGTH & DETAIL:
       ${lengthInstruction}
       - Prioritize clarity and brevity over exhaustive detail.
       - Use direct, active language.
    
    2. STRUCTURE:
       ${structureInstruction}
    
    3. KNOWLEDGE CARDS:
       - Extract 3-5 essential concepts.
       - Keep definitions under 50 words.
    
    4. GENERAL:
       - Language: Chinese (Simplified).
       - Tone: Professional, crisp, efficient.
       - Output only the JSON object. No markdown.
    `;
    }
};
