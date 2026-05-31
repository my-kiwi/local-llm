export const Chat = (): string => {
  return `
    <textarea id="llm-response" placeholder="AI will answer here"></textarea>
    <textarea id="llm-request" placeholder="Ask whatever"></textarea>
  `;
};
