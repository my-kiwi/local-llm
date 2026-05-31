const LanguageModel = (window as any).LanguageModel;

let llmAvailabilityStatus = 'unknown';
let session: unknown = null;

export const Chat = (): string => {
  if (!LanguageModel) {
    return `
      <div>
        <span id="llm-status">The experimental LanguageModel API is not available in your browser.</span>
      </div>
    `;
  }
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
    llmAvailabilityStatus = await LanguageModel.availability({ languages: ['en', 'fr'] });
    document.getElementById('llm-status')!.textContent = llmAvailabilityStatus;
    if (llmAvailabilityStatus === 'available') {
      clearInterval(intervalId);
      document.getElementById('llm-response')!.style.display = 'block';
      document.getElementById('llm-request')!.style.display = 'block';
      session = await createSession();
    }
  }, 1000);
};

const createSession = async () => {
  await LanguageModel.create().catch((error: any) => {
    console.error('Error creating LanguageModel session:', error);
    document.getElementById('llm-status')!.textContent = 'error initializing LanguageModel';
  });
};

function initializeChat() {
  const requestInput = document.getElementById('llm-request') as HTMLTextAreaElement;
  const responseOutput = document.getElementById('llm-response') as HTMLTextAreaElement;

  requestInput?.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!session) {
        responseOutput.value = 'LanguageModel session not initialized yet.';
        return;
      }
      // const userInput = requestInput.value.trim();
      // if (userInput) {
      //   responseOutput.value = 'Thinking...';
      //   try {
      //     const response = await fetch('/api/chat', {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({ message: userInput }),
      //     });
      //     const data = await response.json();
      //     responseOutput.value = data.reply;
      //   } catch (error) {
      //     responseOutput.value = 'Error fetching response.';
      //   }
      // }
    }
  });
}
