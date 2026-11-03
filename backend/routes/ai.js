const express = require('express');
const router = express.Router();

// Store recent chat history in memory (simple context management)
const chatHistory = [];

/**
 * Helper to call Google Gemini REST API
 */
async function callGemini(prompt, apiKey) {
    const models = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = null;

    // Build contents array with history
    const contents = [];
    
    // Add past history (limit to last 10 messages to avoid token bloat)
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        });
    }

    // Add current prompt
    contents.push({
        role: 'user',
        parts: [{ text: prompt }]
    });

    const systemInstructionText = `You are an expert chemistry tutor and laboratory assistant. Answer only according to the user's actual question. Analyze the question before answering. Never use a fixed generic response.

IDENTIFY THE TYPE OF QUESTION automatically. Possible question types include:
- Chemistry definition, Chemical reaction, Chemical equation, Numerical calculation, Molecular weight calculation, Molarity, Normality, Dilution, pH / pOH, Acid-base chemistry, Titration, Standardization, Preparation of solutions, Stoichiometry, Organic chemistry, Inorganic chemistry, Physical chemistry, Analytical chemistry, Periodic table, Laboratory experiment, Qualitative analysis, Quantitative analysis, Safety-related chemistry, Conceptual/theoretical question.

GENERATE A DIFFERENT ANSWER FOR EACH QUESTION. NEVER return a predefined generic answer for every question.

ANSWER STRUCTURE: Dynamically choose the appropriate structure based on the question.
- For a simple theory question: Definition, Explanation, Example.
- For a numerical problem: Given, Formula, Calculation, Step-by-step, Final Answer.
- For a laboratory experiment: Aim, Principle, Requirements, Procedure, Reaction, Calculation, Observation, Result, Precautions.
- For a chemical reaction question: Reaction, Reactants, Products, Balanced Equation, Explanation.
- For a comparison question: Use a Markdown Table.

IMPORTANT RULES:
- NO HALLUCINATION. Do not invent experimental values, observations, chemical reactions, concentrations, temperatures, or results.
- If important information is missing, clearly say: "Some information is missing. Please provide ___."
- For calculations, verify the calculation before displaying the final answer.
- For laboratory procedures, provide scientifically valid procedures.
- CHEMISTRY ACCURACY: Use correct formulas, balance equations correctly, use correct units, correct molecular masses, correct sig figs. Distinguish molarity (M), molality (m), normality (N), mole fraction, and concentration. Use Avogadro's number correctly.
- RESPONSE LENGTH: Short answers for simple questions. Medium for normal concepts. Detailed for lab experiments and numericals. Prioritize clarity over unnecessary text.

RESPONSE FORMATTING:
- Start with '# Answer'
- Use clean Markdown formatting: headings, bullet points, numbered steps, tables, chemical equations, mathematical formulas, highlighted final answers.
- Do NOT use the same headings for every question.
- Do NOT display unrelated chemistry concepts.
- Do NOT include generic disclaimers or introductory/closing texts like "Thank you for your question" or "Here are key related chemistry principles". Show ONLY the relevant answer.`;

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const payload = {
                system_instruction: {
                    parts: [{ text: systemInstructionText }]
                },
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                const errDetail = data.error ? data.error.message : response.statusText;
                console.warn(`Gemini model ${model} attempt error:`, errDetail);
                lastError = new Error(errDetail || `HTTP error ${response.status}`);
                continue;
            }

            const candidate = data.candidates && data.candidates[0];
            if (candidate && candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                return candidate.content.parts.map(p => p.text || '').join('');
            } else if (candidate && candidate.finishReason) {
                return `Response completed with status: ${candidate.finishReason}`;
            } else {
                throw new Error('No content returned in response from Gemini API.');
            }
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError || new Error('Failed to communicate with Google Gemini API.');
}

function isPlaceholderOrInvalidKey(apiKey) {
    if (!apiKey) return true;
    const cleanKey = apiKey.trim().toLowerCase();
    return cleanKey === '' || 
           cleanKey === 'your_gemini_api_key_here' || 
           cleanKey.includes('your_gemini_api_key') ||
           cleanKey.startsWith('your_') ||
           cleanKey === 'your_actual_key';
}

/**
 * POST /api/ai/chat
 * Request:  { "message": "user question" }
 * Response: { "reply": "AI response" }
 */
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (isPlaceholderOrInvalidKey(apiKey)) {
            return res.json({ reply: 'Unable to generate the chemistry answer right now. Please check your AI connection and try again.' });
        }

        try {
            const prompt = message.trim();
            const reply = await callGemini(prompt, apiKey.trim());
            
            // Add to chat history to maintain context
            chatHistory.push({ role: 'user', text: prompt });
            chatHistory.push({ role: 'model', text: reply });
            
            // Keep history array from growing indefinitely
            if (chatHistory.length > 50) {
                chatHistory.splice(0, chatHistory.length - 50);
            }

            return res.json({ reply });
        } catch (geminiError) {
            console.warn('Gemini API request failed:', geminiError.message);
            return res.json({ reply: 'Unable to generate the chemistry answer right now. Please check your AI connection and try again.' });
        }
    } catch (error) {
        console.error('Gemini AI Chat Route Error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to generate AI response.',
            reply: 'Unable to generate the chemistry answer right now. Please check your AI connection and try again.'
        });
    }
});

module.exports = router;
