const LanguageModel = (window as any).LanguageModel;

let llmAvailabilityStatus = 'unknown';

export const Chat = (): string => {
  loadLLM();
  initializeChat();
  return `
    <div>
      LLM Availability: <span id="llm-status">trying to load LanguageModel (chrome experimental local LLM)</span>
    </div>
    <textarea id="llm-response" style="display:none;" placeholder="AI will answer here"></textarea>
    <textarea id="llm-request"  style="display:none;" placeholder="Ask whatever"></textarea>
  `;
};

const loadLLM = async () => {
  llmAvailabilityStatus = 'checking';
  let intervalId = setInterval(async () => {
    llmAvailabilityStatus = await LanguageModel.availability({ languages: ["en", "fr"] });
    document.getElementById('llm-status')!.textContent = llmAvailabilityStatus;
    if (llmAvailabilityStatus === 'available') {
      clearInterval(intervalId);
      document.getElementById('llm-response')!.style.display = 'block';
      document.getElementById('llm-request')!.style.display = 'block';
    }
  }, 1000);
};

function initializeChat() {

}