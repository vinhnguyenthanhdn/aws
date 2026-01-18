import type { Question } from '../types';

export async function parseMarkdownFile(filePath: string): Promise<Question[]> {
    try {
        const response = await fetch(filePath);
        const content = await response.text();
        return parseMarkdownContent(content);
    } catch (error) {
        console.error('Error loading markdown file:', error);
        return [];
    }
}

export function parseMarkdownContent(content: string): Question[] {
    const questions: Question[] = [];

    // Split by the separator used in the file
    const blocks = content.split('----------------------------------------');

    for (const block of blocks) {
        if (!block.trim()) continue;

        try {
            const question = parseQuestionBlock(block);
            if (question) {
                questions.push(question);
            }
        } catch (error) {
            console.warn('Failed to parse question block:', error);
        }
    }

    return questions;
}

function parseQuestionBlock(block: string): Question | null {
    const lines = block.trim().split('\n');

    // Extract question ID
    const idMatch = block.match(/## Exam .* question (\d+) discussion/);
    if (!idMatch) return null;
    const id = idMatch[1];

    // Extract Topic (optional)
    // const topicMatch = block.match(/Topic #:\s+(\d+)/);

    // Extract correct answer
    const suggestedMatch = block.match(/Suggested Answer:\s+([A-Z]+)/);
    const officialMatch = block.match(/\*\*Answer:\s+([A-Z]+)\*\*/);

    let correctAnswer = '';
    if (suggestedMatch) {
        correctAnswer = suggestedMatch[1];
    } else if (officialMatch) {
        correctAnswer = officialMatch[1];
    }

    if (!correctAnswer) return null;

    // Extract discussion link
    const linkMatch = block.match(/\[View on ExamTopics\]\((.*?)\)/);
    const discussionLink = linkMatch ? linkMatch[1] : undefined;

    // Find start of options
    let optStart = lines.length;
    for (let i = 0; i < lines.length; i++) {
        if (/^[A-F]\.\s+/.test(lines[i])) {
            optStart = i;
            break;
        }
    }

    // Extract Options
    const options: string[] = [];
    for (let i = optStart; i < lines.length; i++) {
        if (/^[A-F]\.\s+/.test(lines[i])) {
            options.push(lines[i].trim());
        }
    }

    // Extract Question Body
    let metaEnd = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("[All AWS Certified Solutions Architect")) {
            metaEnd = i + 1;
            break;
        }
    }

    const cleanBody: string[] = [];
    for (let i = metaEnd; i < optStart; i++) {
        const s = lines[i].trim();
        if (!s ||
            s.startsWith("Question #") ||
            s.startsWith("Topic #") ||
            s.startsWith("Exam question from") ||
            s.startsWith("Amazon's") ||
            s.startsWith("AWS Certified") ||
            s.startsWith("Suggested Answer:")) {
            continue;
        }
        cleanBody.push(s);
    }

    const questionText = cleanBody.join('\n');
    const isMultiselect = questionText.includes("(Choose two") || questionText.includes("(Choose three");

    return {
        id,
        question: questionText,
        options,
        correct_answer: correctAnswer,
        is_multiselect: isMultiselect,
        discussion_link: discussionLink,
    };
}
