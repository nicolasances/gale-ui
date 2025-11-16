export default function AgentsPage() {
  // Mock agents data based on GaleAgent manifest
  const agents = [
    {
      agentName: "TomeSectionClassifier",
      taskId: "topic.section.classify",
      description: "Agent for labelling sections of a Tome Topic. This agent analyzes the content of a section and assigns one or more predefined labels based on the content's characteristics.",
      inputSchema: {
        topicId: "string",
        topicCode: "string",
        sectionCode: "string",
        sectionIndex: "number"
      },
      outputSchema: {
        topicCode: "string",
        sectionCode: "string",
        sectionIndex: "number",
        labels: "array<string>"
      }
    },
    {
      agentName: "TopicPracticeGenerator",
      taskId: "topic.practice.generate",
      description: "Agent for generating practice exercises for a Tome Topic. This agent creates questions, flashcards, and practice activities based on topic content.",
      inputSchema: {
        topicId: "string",
        topicCode: "string",
        difficulty: "string"
      },
      outputSchema: {
        topicCode: "string",
        exercises: "array<object>",
        flashcards: "array<object>"
      }
    },
    {
      agentName: "ContentSummarizer",
      taskId: "content.summarize",
      description: "Agent that creates concise summaries of educational content. Uses advanced NLP to extract key concepts and main ideas from lengthy texts.",
      inputSchema: {
        contentId: "string",
        maxLength: "number",
        language: "string"
      },
      outputSchema: {
        contentId: "string",
        summary: "string",
        keyPoints: "array<string>"
      }
    },
    {
      agentName: "QuizOrchestrator",
      taskId: "quiz.orchestrate",
      description: "Orchestrator agent that coordinates quiz generation across multiple topics. Manages workflow between content retrieval, question generation, and validation agents.",
      inputSchema: {
        topicIds: "array<string>",
        questionCount: "number",
        difficulty: "string"
      },
      outputSchema: {
        quizId: "string",
        questions: "array<object>",
        status: "string"
      }
    },
    {
      agentName: "KnowledgeGraphBuilder",
      taskId: "knowledge.graph.build",
      description: "Agent that constructs knowledge graphs from educational content. Identifies entities, relationships, and hierarchies to create interconnected learning maps.",
      inputSchema: {
        topicCode: "string",
        depth: "number"
      },
      outputSchema: {
        topicCode: "string",
        nodes: "array<object>",
        edges: "array<object>"
      }
    }
  ];

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Agents</h1>
      <p className="text-gray-600 mb-8">Available agents registered in Gale</p>

      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.taskId}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{agent.agentName}</h2>
                <p className="text-sm text-blue-600 font-mono">{agent.taskId}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Active
              </span>
            </div>

            <p className="text-gray-700 mb-4">{agent.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Input Schema</h3>
                <div className="bg-gray-50 rounded p-3">
                  <pre className="text-xs text-gray-700 font-mono">
                    {JSON.stringify(agent.inputSchema, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Output Schema</h3>
                <div className="bg-gray-50 rounded p-3">
                  <pre className="text-xs text-gray-700 font-mono">
                    {JSON.stringify(agent.outputSchema, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
