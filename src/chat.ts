/// <reference types="dom-chromium-ai" />

// Set WEBLLM_CONFIG to select the WebLLM backend
// (window as any).WEBLLM_CONFIG = {
//   apiKey: 'dummy', // Required for now by the loader
//   modelName: 'Phi-2-q4f32_1-M', // Optional: override default
// };

(window as any).TRANSFORMERS_CONFIG = {
  apiKey: 'dummy', // Required for now by the loader
  device: 'webgpu', // 'webgpu' or 'cpu'
  // dtype: 'q2f16', // Quantization level
  // modelName: 'onnx-community/gemma-4-E2B-it-qat-mobile-ONNX',
  modelName: 'onnx-community/Qwen2.5-0.5B-Instruct',
  env: {
    allowRemoteModels: true, // Allow loading models from remote URLs
    backends: {
      onnx: {
        wasm: {
          wasmPaths: 'https://cdn.example.com/wasm-assets/',
        },
      },
    },
  },
};

if (!('LanguageModel' in window)) {
  // ts-ignore-next-line
  await import('prompt-api-polyfill' as any);
}

let llmAvailabilityStatus = 'unknown';
let session: any = null; // fixme any

// see https://developer.chrome.com/docs/ai/prompt-api?hl=fr#add_expected_input_and_output

const expectedInputs: LanguageModelExpected[] = [{ type: 'text', languages: ['en', 'fr'] }];

const expectedOutputs: LanguageModelExpected[] = [{ type: 'text', languages: ['fr', 'en'] }];

const getResponseOutput = () => {
  return document.getElementById('llm-response') as HTMLTextAreaElement;
};

const getRequestInput = () => {
  return document.getElementById('llm-request') as HTMLTextAreaElement;
};

const getStatusElement = () => {
  return document.getElementById('llm-status') as HTMLSpanElement;
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
  getStatusElement().textContent = llmAvailabilityStatus;
  llmAvailabilityStatus = await LanguageModel.availability({
    expectedInputs,
    expectedOutputs,
  });
  getStatusElement().textContent = llmAvailabilityStatus;
  if (llmAvailabilityStatus === 'available') {
    session = await createSession();
    console.log('LanguageModel session created:', session);
    sendMessage(`Welcome me and present yourself in ${navigator.language} language.
        Then ask me what I want to do. 
        Do not start with "allright" or "ok" or "sure" or "of course" or "certainly" or "absolutely" or "definitely" or "without a doubt".
        Keep it short but relaxed and friendly, add a smiley face at the end of your message.`);
    getStatusElement().textContent = 'LanguageModel session created successfully.';
    getResponseOutput().style.display = 'block';
    getRequestInput().style.display = 'block';
  } else {
    setTimeout(() => {
      loadLLM();
    }, 3000);
  }
};

const createSession = async () => {
  getStatusElement().textContent = 'creating session...';

  try {
    const session = await LanguageModel.create({
      expectedInputs,
      expectedOutputs,
      monitor(monitor) {
        monitor.addEventListener('downloadprogress', (e) => {
          console.log(`Downloaded ${e.loaded * 100}%`);
          getStatusElement().textContent = `Downloading model: ${Math.round(e.loaded * 100)}%`;
        });
      },
      // initialPrompts:
    });
    console.log('LanguageModel session created:', session);
    if (!session) {
      throw new Error('no session created');
    }
    return session;
  } catch (error: any) {
    console.error('Error creating LanguageModel session:', error);
    getStatusElement().textContent = `create error: ${error.message} ${error.stack}`;
    throw error;
  }
};

function initializeChat() {
  const requestInput = getRequestInput();
  requestInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      // TODO add send button for mobile
      console.log('Enter key pressed. User input:', requestInput.value);
      event.preventDefault();
      await sendMessage(requestInput.value.trim());
    }
  });
}

async function sendMessage(userInput: string) {
  const responseOutput = getResponseOutput();
  if (!session) {
    responseOutput.textContent = 'LanguageModel session not initialized yet.';
    return;
  }
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
