document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const clearBtn = document.getElementById('clear-btn');
  const typingIndicator = document.getElementById('typing-indicator');

  // Maintain local context history
  let conversationHistory = [];

  // Auto-grow textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = `${Math.min(userInput.scrollHeight, 120)}px`;
  });

  // Handle Enter key submit (Shift+Enter for newline)
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // Form Submit Handler
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageText = userInput.value.trim();
    if (!messageText) return;

    appendMessage(messageText, 'user');
    conversationHistory.push({ role: 'user', content: messageText });

    userInput.value = '';
    userInput.style.height = 'auto';

    setLoadingState(true);

    try {
      const response = await fetch('https://raymond-aichatbot-backend-1.onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to communicate with server.');
      }

      appendMessage(data.reply, 'ai');
      conversationHistory.push({ role: 'assistant', content: data.reply });
    } catch (error) {
      console.error('Chat Error:', error);
      appendMessage(error.message || 'An error occurred.', 'error');
    } finally {
      setLoadingState(false);
    }
  });

  // Clear Session Handler
  clearBtn.addEventListener('click', () => {
    conversationHistory = [];
    chatMessages.innerHTML = `
      <div class="message system-welcome">
        <div class="message-content">
          Conversation reset. How can I help you next?
        </div>
      </div>
    `;
    userInput.focus();
  });

  function appendMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    if (sender === 'ai') {
      const rawHtml = typeof marked !== 'undefined' ? marked.parse(content) : content;
      contentDiv.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;
    } else {
      contentDiv.textContent = content;
    }

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      typingIndicator.classList.remove('hidden');
      sendBtn.disabled = true;
      userInput.disabled = true;
      scrollToBottom();
    } else {
      typingIndicator.classList.add('hidden');
      sendBtn.disabled = false;
      userInput.disabled = false;
      userInput.focus();
    }
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
