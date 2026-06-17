// Set WEBLLM_CONFIG to select the WebLLM backend
(window as any).WEBLLM_CONFIG = {
  apiKey: 'dummy', // Required for now by the loader
  modelName: 'Llama-3.2-3B-Instruct-q4f32_1-MLC', // Optional: override default
};

if (!('LanguageModel' in window)) {
  // ts-ignore-next-line
  await import('prompt-api-polyfill' as any);
}

const LanguageModel = (window as any).LanguageModel; // fixme any

let llmAvailabilityStatus = 'unknown';
let session: any = null; // fixme any

// see https://developer.chrome.com/docs/ai/prompt-api?hl=fr#add_expected_input_and_output
const llmOptions = {
  expectedInputs: [{ type: 'text', languages: ['en' /* system prompt */, 'ja' /* user prompt */] }],
  expectedOutputs: [{ type: 'text', languages: ['ja'] }],
};

export const Chat = (): string => {
  if (!LanguageModel) {
    return `
      <div>
        <span id="llm-status">The experimental LanguageModel API is not available in your browser.</span>
      </div>
    `;
  }
  requestAnimationFrame(() => {
    loadLLM();
    initializeChat();
  });
  return `
    <div><span id="polyfill"></span>
      LLM Availability: <span id="llm-status">trying to load LanguageModel (chrome experimental local LLM)</span>
    </div>
    <div id="llm-response" style="display:none;" placeholder="AI will answer here" readonly></div>
    <textarea id="llm-request"  style="display:none;" placeholder="Ask whatever"></textarea>
  `;
};

const loadLLM = async () => {
  llmAvailabilityStatus = 'checking';
  let intervalId = setInterval(async () => {
    llmAvailabilityStatus = await LanguageModel.availability(llmOptions);
    document.getElementById('llm-status')!.textContent = llmAvailabilityStatus;
    if (llmAvailabilityStatus === 'available') {
      clearInterval(intervalId);
      session = await createSession();
      document.getElementById('llm-response')!.style.display = 'block';
      document.getElementById('llm-request')!.style.display = 'block';
    }
  }, 1000);
};

const createSession = async () => {
  document.getElementById('llm-status')!.textContent = 'creating session...';
  return await LanguageModel.create(llmOptions).catch((error: any) => {
    console.error('Error creating LanguageModel session:', error);
    document.getElementById('llm-status')!.textContent = 'create error: ' + error.message;
  });
};

function initializeChat() {
  const requestInput = document.getElementById('llm-request') as HTMLTextAreaElement;
  const responseOutput = document.getElementById('llm-response') as HTMLTextAreaElement;

  requestInput?.addEventListener('keypress', async (event) => {
    console.log('Key pressed:', event.key);
    if (event.key === 'Enter' && !event.shiftKey) {
      // TODO add send button for mobile
      console.log('Enter key pressed. User input:', requestInput.value);
      event.preventDefault();
      if (!session) {
        responseOutput.textContent = 'LanguageModel session not initialized yet.';
        return;
      }
      const userInput = requestInput.value.trim();
      if (userInput) {
        responseOutput.textContent = 'Thinking...';
        try {
          const response = await session.prompt(userInput);
          responseOutput.textContent = response;
        } catch (error: any) {
          responseOutput.textContent = 'Error fetching response: ' + error.message;
        }
      }
    }
  });
}
