import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, X, Send, Sparkles, Star, Edit3, Check, ChevronDown, ChevronRight, Download, Trash2, ArrowLeft } from 'lucide-react';

const categories = [
  {
    id: 'content',
    title: 'Content Creation',
    description: 'Text, presentations, reports, communications',
  },
  {
    id: 'automation',
    title: 'Task Automation',
    description: 'Repetitive processes, workflows, scheduling',
  },
  {
    id: 'research',
    title: 'Research & Synthesis',
    description: 'Information retrieval, document analysis',
  },
  {
    id: 'data',
    title: 'Data & Insights',
    description: 'Analysis, visualization, pattern recognition',
  },
  {
    id: 'coding',
    title: 'Technical Work',
    description: 'Spreadsheets, scripts, tools, systems',
  },
  {
    id: 'ideation',
    title: 'Strategy & Ideation',
    description: 'Planning, brainstorming, problem-solving',
  }
];

const helpOptions = [
  { id: 'time', label: 'Save time on repetitive work' },
  { id: 'quality', label: 'Improve the quality of what I produce' },
  { id: 'capability', label: 'Take on things I can\'t do today' },
  { id: 'decisions', label: 'Make better decisions with data' },
  { id: 'overload', label: 'Keep up with information overload' },
  { id: 'scale', label: 'Scale my impact beyond my capacity' }
];

const STORAGE_KEYS = {
  notes: 'aiBrainstorm_notes',
  profile: 'aiBrainstorm_profile',
  chatMessages: 'aiBrainstorm_chatMessages',
  currentView: 'aiBrainstorm_currentView',
};

function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch { return defaultValue; }
}

const GENERATING_STEPS = [
  'Analyzing your profile',
  'Brainstorming ideas',
  'Tailoring to your role',
  'Organizing by category',
  'Polishing suggestions',
];

function GeneratingIndicator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep(s => (s + 1) % GENERATING_STEPS.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center max-w-xs mx-auto">
        {/* Animated sparkle icon */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <Sparkles
            className="w-16 h-16 text-gray-900 absolute inset-0"
            style={{ animation: 'spin 4s linear infinite' }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(26,26,26,0.08) 0%, transparent 70%)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Step label */}
        <p
          key={step}
          className="text-lg font-medium text-gray-900 mb-2"
          style={{ animation: 'fadeUp 0.4s ease-out' }}
        >
          {GENERATING_STEPS[step]}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-4">
          {GENERATING_STEPS.map((_, i) => (
            <span
              key={i}
              className="block w-2 h-2 rounded-full transition-all duration-500"
              style={{
                backgroundColor: i <= step ? '#1A1A1A' : '#D1D5DB',
                transform: i === step ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        <p className="text-sm text-gray-400 mt-6">Building your canvas&hellip;</p>
      </div>
    </div>
  );
}

export default function AIBrainstormCanvas() {
  const [currentView, setCurrentView] = useState(() => loadFromStorage(STORAGE_KEYS.currentView, 'intake'));
  const [profile, setProfile] = useState(() => loadFromStorage(STORAGE_KEYS.profile, {
    role: '',
    helpWith: [],
    responsibilities: ''
  }));

  const [notes, setNotes] = useState(() => loadFromStorage(STORAGE_KEYS.notes, {
    content: [],
    automation: [],
    research: [],
    data: [],
    coding: [],
    ideation: []
  }));

  const [expandedCategory, setExpandedCategory] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatCategory, setChatCategory] = useState(null);
  const [chatMessages, setChatMessages] = useState(() => loadFromStorage(STORAGE_KEYS.chatMessages, {}));
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editText, setEditText] = useState('');
  const [manualInput, setManualInput] = useState({});

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.currentView, JSON.stringify(currentView)); }, [currentView]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.chatMessages, JSON.stringify(chatMessages)); }, [chatMessages]);

  const toggleHelpOption = (id) => {
    setProfile(prev => ({
      ...prev,
      helpWith: prev.helpWith.includes(id) 
        ? prev.helpWith.filter(h => h !== id)
        : [...prev.helpWith, id]
    }));
  };

  const getProfileContext = () => {
    const helpLabels = profile.helpWith.map(id => 
      helpOptions.find(h => h.id === id)?.label
    ).join(', ');
    
    return `
MANAGER PROFILE:
- Role: ${profile.role}
- What they want help with: ${helpLabels}
- Key Responsibilities: ${profile.responsibilities}

Provide specific, actionable suggestions based on this context. Be concise. Each idea should be under 40 words.`;
  };

  const generateInitialIdeas = async () => {
    setIsGenerating(true);
    setCurrentView('canvas');
    
    const helpLabels = profile.helpWith.map(id => 
      helpOptions.find(h => h.id === id)?.label
    ).join(', ');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are helping a ${profile.role} brainstorm how to use AI. Their responsibilities: ${profile.responsibilities}. They want to: ${helpLabels}.

Generate 2-3 specific, actionable AI use case ideas for EACH of these 6 categories:
1. Content Creation (text, presentations, reports)
2. Task Automation (repetitive processes, workflows)
3. Research & Synthesis (information retrieval, analysis)
4. Data & Insights (analysis, visualization)
5. Technical Work (spreadsheets, scripts, tools)
6. Strategy & Ideation (planning, brainstorming)

Respond in this exact JSON format:
{
  "content": ["idea 1", "idea 2"],
  "automation": ["idea 1", "idea 2"],
  "research": ["idea 1", "idea 2"],
  "data": ["idea 1", "idea 2"],
  "coding": ["idea 1", "idea 2"],
  "ideation": ["idea 1", "idea 2"]
}

Each idea should be specific to their role, under 40 words, and immediately actionable. No generic suggestions.`,
          messages: [{ role: 'user', content: 'Generate the ideas now.' }]
        })
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '{}';
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const ideas = JSON.parse(jsonMatch[0]);
        const newNotes = {};
        
        Object.keys(ideas).forEach(catId => {
          if (Array.isArray(ideas[catId])) {
            newNotes[catId] = ideas[catId].map((text, idx) => ({
              id: crypto.randomUUID(),
              text: text.trim(),
              priority: false,
              source: 'ai'
            }));
          }
        });
        
        setNotes(prev => ({
          ...prev,
          ...newNotes
        }));
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
    }
    
    setIsGenerating(false);
    setExpandedCategory('content');
  };

  const addNote = (categoryId, text, source = 'manual') => {
    if (!text.trim()) return;
    setNotes(prev => ({
      ...prev,
      [categoryId]: [...prev[categoryId], { 
        id: crypto.randomUUID(),
        text: text.trim(), 
        priority: false,
        source 
      }]
    }));
  };

  const removeNote = (categoryId, noteId) => {
    setNotes(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter(note => note.id !== noteId)
    }));
  };

  const togglePriority = (categoryId, noteId) => {
    setNotes(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].map(note => 
        note.id === noteId ? { ...note, priority: !note.priority } : note
      )
    }));
  };

  const startEditing = (categoryId, note) => {
    setEditingNote({ categoryId, noteId: note.id });
    setEditText(note.text);
  };

  const saveEdit = () => {
    if (!editingNote || !editText.trim()) return;
    setNotes(prev => ({
      ...prev,
      [editingNote.categoryId]: prev[editingNote.categoryId].map(note =>
        note.id === editingNote.noteId ? { ...note, text: editText.trim() } : note
      )
    }));
    setEditingNote(null);
    setEditText('');
  };

  const openChat = (categoryId) => {
    setChatCategory(categoryId);
    setChatOpen(true);
    
    if (!chatMessages[categoryId]) {
      const cat = categories.find(c => c.id === categoryId);
      setChatMessages(prev => ({
        ...prev,
        [categoryId]: [{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Let's explore ${cat.title.toLowerCase()} ideas for your role. What specific challenges or opportunities come to mind?`
        }]
      }));
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatCategory || isLoading) return;

    const category = categories.find(c => c.id === chatCategory);
    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    const newMessages = [
      ...(chatMessages[chatCategory] || []),
      { id: crypto.randomUUID(), role: 'user', content: userMessage }
    ];
    setChatMessages(prev => ({ ...prev, [chatCategory]: newMessages }));
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are helping brainstorm AI applications for ${category.title}. ${getProfileContext()}

You MUST respond with valid JSON only — no other text. Use this exact format:
{
  "message": "Your conversational reply here. Ask a follow-up question to explore their needs. 1-3 sentences. Do not mention or list any ideas here.",
  "ideas": ["Specific actionable AI idea under 40 words", "Another idea"]
}

Rules:
- "message": natural conversation only — no idea references, no bullet points
- "ideas": always include 1-3 actionable ideas based on what the user said
- Both fields are required in every response
- Respond with the JSON object only, nothing before or after it`,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      const rawText = data.content?.[0]?.text || '';

      let chatText = "Tell me more about what you're working on.";
      let suggestions = [];

      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.message) chatText = parsed.message;
          if (Array.isArray(parsed.ideas)) suggestions = parsed.ideas.map(s => s.trim()).filter(Boolean);
        }
      } catch {
        chatText = rawText || chatText;
      }

      setChatMessages(prev => ({
        ...prev,
        [chatCategory]: [...newMessages, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: chatText,
          ...(suggestions.length > 0 && { suggestions })
        }]
      }));
    } catch (error) {
      setChatMessages(prev => ({
        ...prev,
        [chatCategory]: [...newMessages, { id: crypto.randomUUID(), role: 'assistant', content: "What aspects would you like to explore?" }]
      }));
    }
    
    setIsLoading(false);
  };

  const addSuggestionAsNote = (messageId, suggestion) => {
    addNote(chatCategory, suggestion, 'ai');
    setChatMessages(prev => ({
      ...prev,
      [chatCategory]: prev[chatCategory].map(m =>
        m.id === messageId
          ? { ...m, suggestions: m.suggestions?.filter(s => s !== suggestion) }
          : m
      )
    }));
  };

  const getTotalNotes = () => Object.values(notes).reduce((sum, arr) => sum + arr.length, 0);
  const getPriorityCount = () => Object.values(notes).flat().filter(n => n.priority).length;
  const hasExistingSession = () => getTotalNotes() > 0 || profile.role;

  const resetAll = () => {
    const defaults = {
      currentView: 'intake',
      profile: { role: '', helpWith: [], responsibilities: '' },
      notes: { content: [], automation: [], research: [], data: [], coding: [], ideation: [] },
      chatMessages: {},
    };
    setCurrentView(defaults.currentView);
    setProfile(defaults.profile);
    setNotes(defaults.notes);
    setChatMessages(defaults.chatMessages);
    setExpandedCategory(null);
    setChatOpen(false);
    setChatCategory(null);
  };

  const exportPlan = () => {
    const priorityNotes = Object.entries(notes).flatMap(([catId, catNotes]) => 
      catNotes.filter(n => n.priority).map(n => ({ ...n, category: categories.find(c => c.id === catId)?.title }))
    );
    const otherNotes = Object.entries(notes).flatMap(([catId, catNotes]) => 
      catNotes.filter(n => !n.priority).map(n => ({ ...n, category: categories.find(c => c.id === catId)?.title }))
    );

    let md = `# AI Integration Plan\n`;
    md += `**${profile.role}**\n\n`;
    md += `---\n\n`;
    
    if (priorityNotes.length > 0) {
      md += `## ⭐ Priority Ideas\n\n`;
      priorityNotes.forEach(n => {
        md += `- **${n.category}:** ${n.text}\n`;
      });
      md += `\n`;
    }
    
    if (otherNotes.length > 0) {
      md += `## All Ideas\n\n`;
      const byCategory = {};
      otherNotes.forEach(n => {
        if (!byCategory[n.category]) byCategory[n.category] = [];
        byCategory[n.category].push(n.text);
      });
      Object.entries(byCategory).forEach(([cat, ideas]) => {
        md += `### ${cat}\n`;
        ideas.forEach(idea => md += `- ${idea}\n`);
        md += `\n`;
      });
    }
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-integration-plan.md';
    a.click();
  };

  // Intake Screen
  if (currentView === 'intake') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-xl w-full">
          <div className="text-center mb-8 sm:mb-16">
            <h1 
              className="font-black text-gray-900 mb-4"
              style={{ 
                fontSize: 'clamp(40px, 7vw, 64px)',
                letterSpacing: '-2px',
                lineHeight: 1.1
              }}
            >
              Map Your AI Potential
            </h1>
            <p className="text-lg text-gray-600">Three quick questions, then we'll generate ideas tailored to you.</p>
          </div>

          <div className="space-y-10">
            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                What's your role?
              </label>
              <input
                type="text"
                value={profile.role}
                onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Marketing Director, Operations Manager"
                className="w-full px-5 py-4 bg-white rounded-2xl border-0 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
              />
            </div>

            {/* What would help */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                What would help you most?
              </label>
              <div className="grid grid-cols-1 gap-3">
                {helpOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleHelpOption(option.id)}
                    className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 ${
                      profile.helpWith.includes(option.id)
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                What are your main responsibilities?
              </label>
              <textarea
                value={profile.responsibilities}
                onChange={(e) => setProfile(prev => ({ ...prev, responsibilities: e.target.value }))}
                placeholder="e.g., Campaign planning, team coordination, stakeholder reporting"
                rows={3}
                className="w-full px-5 py-4 bg-white rounded-2xl border-0 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={generateInitialIdeas}
              disabled={!profile.role || profile.helpWith.length === 0 || !profile.responsibilities}
              className="w-full bg-gray-900 text-white px-10 py-5 rounded-full font-semibold text-lg hover:-translate-y-1 hover:shadow-lg transition-all duration-300 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              style={{ backgroundColor: profile.role && profile.helpWith.length > 0 && profile.responsibilities ? '#1A1A1A' : undefined }}
            >
              {getTotalNotes() > 0 ? 'Re-generate Ideas' : 'Generate Ideas'}
            </button>
            {hasExistingSession() && (
              <button
                onClick={resetAll}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors pt-2"
              >
                Start over with a clean slate
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Canvas View
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Header */}
      <header className="px-4 sm:px-6 py-5 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('intake')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back to profile"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile.role}</h1>
            <p className="text-sm text-gray-500">{getTotalNotes()} ideas · {getPriorityCount()} starred</p>
          </div>
        </div>
        <button
          onClick={exportPlan}
          className="flex items-center gap-2 bg-gray-900 text-white px-3 py-3 sm:px-6 rounded-full font-medium hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export Plan</span>
        </button>
      </header>

      {/* Loading State */}
      {isGenerating && <GeneratingIndicator />}

      {/* Categories */}
      {!isGenerating && (
        <div className="max-w-3xl mx-auto px-3 py-4 sm:p-6 space-y-4">
          {categories.map(category => {
            const isExpanded = expandedCategory === category.id;
            const categoryNotes = notes[category.id] || [];
            
            return (
              <div 
                key={category.id} 
                className="bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{categoryNotes.length} ideas</span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6">
                    {/* Notes Grid */}
                    <div className="space-y-3 mb-4">
                      {categoryNotes.map(note => (
                        <div
                          key={note.id}
                          className={`p-4 rounded-xl transition-all duration-300 group ${
                            note.priority 
                              ? 'bg-yellow-50 border-l-4 border-yellow-400' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          {editingNote?.categoryId === category.id && editingNote?.noteId === note.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={saveEdit}
                                  className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium"
                                >
                                  <Check className="w-3 h-3" /> Save
                                </button>
                                <button
                                  onClick={() => setEditingNote(null)}
                                  className="px-4 py-2 text-gray-500 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-gray-700 flex-1">{note.text}</p>
                              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => togglePriority(category.id, note.id)}
                                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors ${
                                    note.priority ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                                  }`}
                                >
                                  <Star className={`w-4 h-4 ${note.priority ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={() => startEditing(category.id, note)}
                                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeNote(category.id, note.id)}
                                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {categoryNotes.length === 0 && (
                        <p className="text-gray-400 text-center py-8">No ideas yet</p>
                      )}
                    </div>

                    {/* Add Manual Note */}
                    {manualInput[category.id] !== undefined ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={manualInput[category.id] || ''}
                          onChange={(e) => setManualInput(prev => ({ ...prev, [category.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && manualInput[category.id]?.trim()) {
                              addNote(category.id, manualInput[category.id]);
                              setManualInput(prev => ({ ...prev, [category.id]: undefined }));
                            }
                          }}
                          placeholder="Type your idea..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (manualInput[category.id]?.trim()) {
                                addNote(category.id, manualInput[category.id]);
                              }
                              setManualInput(prev => ({ ...prev, [category.id]: undefined }));
                            }}
                            className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setManualInput(prev => ({ ...prev, [category.id]: undefined }))}
                            className="px-4 py-2 text-gray-500 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setManualInput(prev => ({ ...prev, [category.id]: '' }))}
                          className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add idea
                        </button>
                        <button
                          onClick={() => openChat(category.id)}
                          className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Brainstorm more
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chat Drawer */}
      {chatOpen && chatCategory && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setChatOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed inset-0 sm:left-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">
                  {categories.find(c => c.id === chatCategory)?.title}
                </h3>
                <p className="text-sm text-gray-500">Brainstorm with AI</p>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(chatMessages[chatCategory] || []).map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                  {message.suggestions?.length > 0 && (
                    <div className="ml-2 space-y-1.5">
                      <p className="text-xs font-medium text-gray-400 ml-1">Add to canvas:</p>
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => addSuggestionAsNote(message.id, suggestion)}
                          className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm text-gray-700 flex items-start gap-2"
                        >
                          <Plus className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Describe a challenge or ask for ideas..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="p-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
