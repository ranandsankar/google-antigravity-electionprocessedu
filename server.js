import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Safety disclaimer required for all responses
const SAFETY_DISCLAIMER = "Election rules, dates, voter lists, polling stations, and ID requirements can change. Always verify through the Election Commission of India, Voters’ Services Portal, or your official State Chief Electoral Officer website.";

// System prompt enforcing nonpartisan, educational constraints
const SYSTEM_PROMPT = `You are CivicPath India AI, a nonpartisan, educational assistant helping users understand the election process in India.

CRITICAL RULES:
1. DO NOT support, recommend, or oppose any specific candidates, parties, or policies.
2. DO NOT provide partisan messaging, misinformation, or attempt to persuade users how to vote.
3. Provide simple, factual, and neutral explanations of Indian election processes (e.g., ECI role, EVM, VVPAT, Model Code of Conduct, Form 6).
4. Do not claim live/current deadlines unless you have official source data. Explain the general process instead.
5. Always direct users to the Election Commission of India, Voters' Services Portal, or State CEO websites for current rules and verification.
6. If a user tries to prompt you for partisan opinions, politely decline and offer to explain an election process instead.

OUTPUT FORMAT:
You MUST return your response as a valid JSON object with the following structure:
{
  "topic": "Short title of the topic being explained (e.g., Voter Registration)",
  "answer": "The main educational response explaining the Indian election process.",
  "steps": ["Optional array of strings representing step-by-step instructions or key points. Provide at least one step if applicable, otherwise an empty array."],
  "indiaContext": "Specific context about how this works in India (e.g., mentioning ECI, EVMs, or specific Forms).",
  "officialReminder": "Election rules, dates, voter lists, polling stations, and ID requirements can change. Always verify through the Election Commission of India, Voters’ Services Portal, or your official State Chief Electoral Officer website.",
  "neutralityNote": "This information is provided for nonpartisan educational purposes only. CivicPath India AI does not endorse any candidates or parties."
}`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // Fallback mock response if no API key is provided
        if (!apiKey) {
            return res.json({
                isFallback: true,
                aiData: {
                    topic: "Election Process Overview",
                    answer: `Thank you for asking about "${message}". The election process in India involves several key steps including voter registration (Form 6), verifying details on the electoral roll, checking your polling station, casting your vote using an EVM and verifying via VVPAT, and finally, the counting and declaration of results by the Election Commission of India.`,
                    steps: ["Check Electoral Roll", "Get Voter Information Slip", "Cast vote using EVM", "Verify with VVPAT"],
                    indiaContext: "The Election Commission of India (ECI) oversees the entire process, ensuring free and fair elections.",
                    officialReminder: SAFETY_DISCLAIMER,
                    neutralityNote: "This information is provided for nonpartisan educational purposes only. CivicPath India AI does not endorse any candidates or parties."
                }
            });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                  parts: { text: SYSTEM_PROMPT }
                },
                contents: [{
                    parts: [{ text: message }]
                }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            return res.status(response.status).json({ error: 'Failed to communicate with AI' });
        }

        const data = await response.json();
        
        // Extract the text response
        let aiData = {
            topic: "Error Processing Request",
            answer: "I'm sorry, I couldn't process that request.",
            steps: [],
            indiaContext: "",
            officialReminder: SAFETY_DISCLAIMER,
            neutralityNote: "Nonpartisan Education Only"
        };
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
            try {
                aiData = JSON.parse(data.candidates[0].content.parts[0].text);
            } catch (e) {
                console.error("Failed to parse AI JSON:", e);
                // Fallback to raw text if not JSON
                aiData.answer = data.candidates[0].content.parts[0].text;
            }
        }

        res.json({ isFallback: false, aiData });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/timeline', (req, res) => {
    const type = req.query.type || 'general';
    
    // Generalized timelines
    const timelines = {
        loksabha: [
            { title: "Election Schedule Announcement", description: "The ECI announces the dates, bringing the Model Code of Conduct into immediate effect." },
            { title: "Filing of Nominations", description: "Candidates file their nomination papers before the Returning Officer." },
            { title: "Scrutiny and Withdrawal", description: "Nominations are checked, and candidates can withdraw by a set date." },
            { title: "Campaigning", description: "Candidates campaign; it ends 48 hours before polling begins." },
            { title: "Polling Day", description: "Voters cast their votes using EVMs at their designated polling stations." },
            { title: "Counting and Results", description: "EVMs are opened and counted under ECI supervision, and results are officially declared." }
        ],
        assembly: [
             { title: "Schedule Announcement", description: "ECI announces state-specific election dates." },
             { title: "Nominations & Campaigning", description: "Similar to Lok Sabha, but focused on State Legislative Assembly constituencies." },
             { title: "Polling & Results", description: "Conducted in phases depending on the state's size, followed by result declaration." }
        ],
        localbody: [
             { title: "State Election Commission Notification", description: "The SEC (not ECI) announces dates for Panchayats or Municipalities." },
             { title: "Ward-level Nominations", description: "Candidates file for local wards." },
             { title: "Voting & Counting", description: "Often conducted with ballot papers or EVMs depending on the state." }
        ],
        byelection: [
             { title: "Vacancy Notification", description: "ECI is notified of a vacant seat due to resignation or death." },
             { title: "Schedule", description: "By-elections must typically be held within six months of the vacancy." },
             { title: "Polling & Results", description: "Conducted for the specific vacant constituency only." }
        ]
    };

    res.json({ timeline: timelines[type] || timelines.loksabha });
});

app.get('/api/quiz', (req, res) => {
    const questions = [
        {
            question: "What is Form 6 used for in India?",
            options: ["To file a nomination to run for office", "To withdraw a nomination", "To register as a new voter on the electoral roll", "To report a violation of the Model Code of Conduct"],
            answer: 2,
            explanation: "Form 6 is the application form used by eligible Indian citizens to register their name in the electoral roll for the first time."
        },
        {
            question: "What does VVPAT help voters verify?",
            options: ["Their polling station location", "That their vote was correctly recorded for the intended candidate", "Their voter ID number", "The election results"],
            answer: 1,
            explanation: "VVPAT stands for Voter Verified Paper Audit Trail. It prints a paper slip allowing the voter to verify that their vote was cast correctly."
        },
        {
            question: "What does NOTA stand for?",
            options: ["National Organization for Tax Administration", "None of the Above", "Notice of Temporary Absence", "New Official Tally Act"],
            answer: 1,
            explanation: "NOTA stands for 'None of the Above'. It allows a voter to officially register a vote of rejection for all candidates contesting in the election."
        },
        {
            question: "Who conducts elections to Parliament and State Legislatures in India?",
            options: ["The Supreme Court of India", "The Prime Minister's Office", "The State Election Commissions", "The Election Commission of India (ECI)"],
            answer: 3,
            explanation: "The Election Commission of India (ECI) is the autonomous constitutional authority responsible for administering Union and State election processes."
        },
        {
            question: "What is the Model Code of Conduct?",
            options: ["A set of guidelines for election campaigning and behavior", "A dress code for voters", "A manual for operating EVMs", "A law mandating compulsory voting"],
            answer: 0,
            explanation: "The Model Code of Conduct is a set of guidelines issued by the ECI to regulate political parties and candidates prior to elections, ensuring free and fair polling."
        },
        {
            question: "What is an electoral roll?",
            options: ["A list of all political parties", "The official list of registered and eligible voters in a constituency", "A document for tracking election expenses", "The schedule of election dates"],
            answer: 1,
            explanation: "The electoral roll, also known as the voter list, is the official register containing the names of all eligible voters for a given constituency."
        },
        {
            question: "What happens at a polling booth before a voter casts a vote?",
            options: ["The voter pays a fee", "The voter's identity is verified and indelible ink is applied to their finger", "The voter registers for an ID", "The voter is interviewed by officials"],
            answer: 1,
            explanation: "Before voting, polling officials check the voter's identity against the electoral roll and apply a mark of indelible ink to their left index finger."
        },
        {
            question: "What should users do to verify current voter information or polling station details?",
            options: ["Check social media", "Ask a political candidate", "Verify through the Election Commission of India or Voters' Services Portal", "Wait for a letter in the mail"],
            answer: 2,
            explanation: "Voters should always rely on official sources like the ECI, Voters' Services Portal, or their State CEO website for accurate and current election details."
        }
    ];
    res.json({ questions });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`CivicPath AI server running on port ${PORT}`);
    });
}

export default app;
