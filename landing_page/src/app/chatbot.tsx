import React, { useState, useEffect, useRef } from 'react';

// Define the shape of a chat message for in-memory use
interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Define the shape of a chat history entry fetched from the backend (Bigtable)
interface HistoryEntry {
  rowKey: string;
  timestamp: string; // As string from Bigtable for display
  sender: string;
  text: string;
}

function App(): React.ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  // User ID is a simple randomly generated ID for the session, as Firebase Auth is not used.
  const [userId] = useState<string>(`user-${crypto.randomUUID().substring(0, 8)}`); // Generate an 8-char random ID
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);


  const BACKEND_BASE_URL = 'https://go-chat-backend-153549923770.europe-west1.run.app';

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (): Promise<void> => {
    if (input.trim() === '' || loading) return;

    const userMessage: ChatMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {

      const response = await fetch(`${BACKEND_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.text, userId: userId })
      });

      const result: { response?: string } = await response.json();

      let botResponseText: string = "Sorry, I couldn't get a response from the backend.";

      if (response.ok && result.response) {
        botResponseText = result.response;
      } else {
        console.error("Unexpected backend API response or API error:", result);
        botResponseText = `Backend error: ${response.status} ${response.statusText || ''}. Details: ${JSON.stringify(result)}`;
      }

      const botMessage: ChatMessage = {
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);

    } catch (error: unknown) {
      console.error("Error sending message to backend or getting response:", error);
      setMessages(prevMessages => prevMessages.filter(msg => msg !== userMessage)); // Remove user message if sending failed
      let errorMessage = "Sorry, I couldn't connect to the backend. Please check your network and the backend URL.";
      if (error instanceof Error) {
        errorMessage += ` (Error: ${error.message})`;
      } else {
        errorMessage += ` (Unknown Error: ${JSON.stringify(error)})`;
      }
      setMessages(prevMessages => [...prevMessages, {
        text: errorMessage,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (): Promise<void> => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {

      const response = await fetch(`${BACKEND_BASE_URL}/history/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch history: ${response.status} ${response.statusText || ''} - ${errorData.error || 'Unknown error'}`);
      }

      const data: HistoryEntry[] = await response.json();
      setHistoryData(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setHistoryError(error.message);
      } else {
        setHistoryError("An unknown error occurred while fetching history.");
      }
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleHistory = () => {
    const newState = !showHistory;
    setShowHistory(newState);
    if (newState) {
      fetchHistory(); // Fetch history only when opening the tab
    }
  };

  // --- React.createElement() for UI ---
  return React.createElement(
    'div',
    { className: 'min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans antialiased text-gray-800' },
    React.createElement(
      'div',
      { className: 'w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[80vh]' },
      // Header
      React.createElement(
        'div',
        { className: 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-t-xl shadow-md' },
        React.createElement(
          'h1',
          { className: 'text-2xl font-bold text-center' },
          'Gemini Chatbot'
        ),
        React.createElement(
          'p',
          { className: 'text-sm text-center mt-1 opacity-90' },
          'Session User ID: ',
          React.createElement(
            'span',
            { className: 'font-mono bg-blue-700 px-2 py-0.5 rounded-md text-xs' },
            userId
          )
        )
      ),
      // Main Content Area (Chat or History)
      showHistory
        ? React.createElement( // History Display
            'div',
            { className: 'flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50' },
            React.createElement(
              'h2',
              { className: 'text-xl font-bold text-center mb-4' },
              'Chat History (from Bigtable)'
            ),
            historyLoading && React.createElement(
              'div',
              { className: 'text-center text-gray-500' },
              'Loading history...'
            ),
            historyError && React.createElement(
              'div',
              { className: 'text-center text-red-500' },
              'Error: ', historyError
            ),
            !historyLoading && !historyError && historyData === null && React.createElement(
              'div',
              {className: 'text-center text-gray-500'},
              'No chat history found for this session.',
            ),
            !historyLoading && !historyError && historyData != null  && historyData.length > 0 &&
              React.createElement(
                'div',
                { className: 'overflow-x-auto' },
                React.createElement(
                  'table',
                  { className: 'min-w-full bg-white rounded-lg shadow-md' },
                  React.createElement(
                    'thead',
                    null,
                    React.createElement(
                      'tr',
                      { className: 'bg-gray-200 text-left text-sm font-semibold text-gray-700' },
                      React.createElement('th', { className: 'px-4 py-2' }, 'Timestamp'),
                      React.createElement('th', { className: 'px-4 py-2' }, 'Sender'),
                      React.createElement('th', { className: 'px-4 py-2 rounded-tr-lg' }, 'Message')
                    )
                  ),
                  React.createElement(
                    'tbody',
                    { className: 'divide-y divide-gray-200' },
                    historyData.map((entry, idx) =>
                      React.createElement(
                        'tr',
                        { key: idx, className: 'hover:bg-gray-50 text-sm text-gray-800' },
                       
                        React.createElement('td', { className: 'px-4 py-2 align-top whitespace-nowrap' }, entry.timestamp),
                        React.createElement('td', { className: 'px-4 py-2 align-top capitalize' }, entry.sender),
                        React.createElement('td', { className: 'px-4 py-2 align-top break-words' }, entry.text)
                      )
                    )
                  )
                )
              )
          )
        : React.createElement( // Chat Display
            'div',
            { className: 'flex-1 p-6 overflow-y-auto space-y-4' },
            messages.length === 0 && !loading && React.createElement(
              'div',
              { className: 'text-center text-gray-500 mt-10' },
              'Type a message to start chatting with Gemini!'
            ),
            messages.map((msg, index) =>
              React.createElement(
                'div',
                {
                  key: index,
                  className: `flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`
                },
                React.createElement(
                  'div',
                  {
                    className: `max-w-[70%] p-3 rounded-lg shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`
                  },
                  React.createElement(
                    'p',
                    { className: 'break-words whitespace-pre-wrap' },
                    msg.text
                  ),
                  React.createElement(
                    'span',
                    { className: 'block text-right text-xs mt-1 opacity-70' },
                    msg.timestamp.toLocaleTimeString()
                  )
                )
              )
            ),
            loading && React.createElement(
              'div',
              { className: 'flex justify-start' },
              React.createElement(
                'div',
                { className: 'max-w-[70%] p-3 rounded-lg shadow-sm bg-gray-200 text-gray-800 rounded-bl-none' },
                React.createElement(
                  'div',
                  { className: 'flex items-center space-x-2' },
                  React.createElement('div', { className: 'w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-0' }),
                  React.createElement('div', { className: 'w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150' }),
                  React.createElement('div', { className: 'w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300' })
                )
              )
            ),
            React.createElement('div', { ref: messagesEndRef })
          ),
      // Footer with input and history toggle
      React.createElement(
        'div',
        { className: 'p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-2 rounded-b-xl' },
        showHistory
          ? React.createElement(
              'button',
              {
                onClick: toggleHistory,
                className: 'px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200 flex-grow'
              },
              'Back to Chat'
            )
          : React.createElement(
              React.Fragment, // Use React.Fragment to group multiple children without adding a DOM node
              null,
              // Assume these elements are within a larger chat container div.


            React.createElement(
                  'div', // This is the new wrapping div for positioning
            { className: 'flex items-center p-4 bg-white border-t border-gray-200 sticky bottom-0 w-full' }, // Added classes here
              React.createElement(
                    'textarea',
              {
                className: 'flex-1 resize-none p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200 text-base',
                rows: 1,
                placeholder: 'Type your message...',
                value: input,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value),
                onKeyPress: handleKeyPress,
                disabled: loading
              }
            ),
            React.createElement(
              'button',
              {
                onClick: sendMessage,
                disabled: loading || input.trim() === '',
                className: 'ml-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed'
              },
              loading ? 'Sending...' : 'Send'
            ),
            React.createElement(
              'button',
              {
                onClick: toggleHistory,
                className: 'ml-2 px-4 py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200'
              },
              'Show History'
            )
          )
        )           
      )
    )
  );
}

export default App;
