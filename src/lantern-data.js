window.LanternData = (() => {
  const interests = [
    ["space", "Space", "✦"], ["cars", "Cars", "◇"], ["robotics", "Robotics", "⌁"],
    ["gaming", "Gaming", "⌘"], ["sports", "Sports", "◉"], ["animals", "Animals", "♧"],
    ["nature", "Nature", "⌇"], ["science", "Science", "⚗"], ["coding", "Coding", "</>"],
    ["history", "History", "⌛"], ["art", "Art", "✎"], ["music", "Music", "♫"],
    ["reading", "Reading", "▤"], ["mathematics", "Mathematics", "∑"]
  ].map(([id, label, icon]) => ({ id, label, icon }));

  const goals = [
    ["science", "More Science"], ["mathematics", "Improve Maths"], ["english", "Improve English"],
    ["coding", "Learn Coding"], ["reading", "Read More"], ["nature", "Explore Nature"],
    ["critical-thinking", "Think Critically"]
  ].map(([id, label]) => ({ id, label }));

  const formats = ["Short videos", "Stories", "Experiments", "Visual guides", "Quizzes", "Projects"];

  const explorerQuestions = [
    {
      id: "sources", signal: "sourceEvaluation",
      question: "Two websites give different ages for the universe. What would you try first?",
      answers: ["Choose the first one", "Choose the answer I like", "Check who published both", "Ask AI and stop there", "Find another reliable source"]
    },
    {
      id: "curve", signal: "reasoning",
      question: "A football curves through the air. What would help you understand why?",
      answers: ["Watch it again", "Draw the forces on it", "Search for a slow-motion explanation", "Try a small experiment"]
    },
    {
      id: "robot", signal: "problemSolving",
      question: "Your robot turns left when the code says right. What do you do?",
      answers: ["Check one instruction at a time", "Rewrite everything", "Ask someone to fix it", "Test the motors separately"]
    },
    {
      id: "memory", signal: "learningStrategy",
      question: "You learned something cool yesterday but forgot part of it. What sounds useful?",
      answers: ["Explain it in my own words", "Read the same page faster", "Try a tiny quiz", "Connect it to something I know"]
    },
    {
      id: "claim", signal: "sourceEvaluation",
      question: "A video says a new battery lasts forever. What would make that claim stronger?",
      answers: ["Lots of likes", "A dramatic title", "Test results from reliable groups", "A famous presenter"]
    },
    {
      id: "stuck", signal: "persistence",
      question: "A maths puzzle has you stuck. Which next move would you prefer?",
      answers: ["Get a small hint", "See the full answer", "Draw the problem", "Try an easier version first"]
    },
    {
      id: "curiosity", signal: "curiosity",
      question: "You notice the Moon looks larger near the horizon. What would you do?",
      answers: ["Make a guess", "Compare it on different nights", "Look for an explanation", "Measure it in a photo"]
    },
    {
      id: "explain", signal: "recall",
      question: "After learning how an engine works, how would you check your understanding?",
      answers: ["Explain it without notes", "Read it once more", "Label a diagram", "Answer a challenge question"]
    }
  ];

  const bridges = [
    {
      interest: "cars", goal: "science",
      concepts: ["Aerodynamics", "Air pressure", "Friction", "Electric motors", "Battery chemistry"],
      recommendations: [
        ["How race cars stick to the road", "Aerodynamics", "A visual guide to downforce and fast-moving air.", "Explorer", "Visual guide"],
        ["What powers an electric car?", "Electric motors", "Follow energy from a battery to the wheels.", "Pathfinder", "Interactive lesson"]
      ]
    },
    {
      interest: "gaming", goal: "coding",
      concepts: ["Game logic", "Coordinates", "Loops", "Events", "Collision detection"],
      recommendations: [
        ["Build the logic behind a platform game", "Game logic", "Turn rules, events and loops into a playable idea.", "Starter", "Project"],
        ["Why games need coordinates", "Coordinates", "Use x and y to place and move game characters.", "Explorer", "Interactive lesson"]
      ]
    },
    {
      interest: "space", goal: "science",
      concepts: ["Gravity", "Orbits", "Satellites", "Light", "Relativity"],
      recommendations: [
        ["Why doesn't the Moon fall?", "Orbits", "See how falling and forward motion create an orbit.", "Explorer", "Story lesson"],
        ["A satellite's invisible path", "Gravity", "Explore the force that keeps worlds moving.", "Pathfinder", "Visual guide"]
      ]
    },
    {
      interest: "robotics", goal: "coding",
      concepts: ["Sensors", "Conditions", "Feedback loops", "Motors", "Automation"],
      recommendations: [
        ["Teach a robot to react", "Sensors", "Connect sensor readings to simple decisions in code.", "Starter", "Project"],
        ["How robots correct mistakes", "Feedback loops", "Discover how machines compare, adjust and try again.", "Explorer", "Visual guide"]
      ]
    },
    {
      interest: "sports", goal: "mathematics",
      concepts: ["Statistics", "Angles", "Trajectory", "Probability", "Measurement"],
      recommendations: [["The maths behind a perfect kick", "Angles", "Connect aim, force and trajectory on the pitch.", "Explorer", "Interactive lesson"]]
    },
    {
      interest: "nature", goal: "science",
      concepts: ["Ecosystems", "Adaptation", "Food webs", "Climate", "Biodiversity"],
      recommendations: [["Build an ecosystem web", "Food webs", "Trace how energy moves through a living system.", "Starter", "Activity"]]
    },
    {
      interest: "art", goal: "mathematics",
      concepts: ["Symmetry", "Patterns", "Ratio", "Perspective", "Geometry"],
      recommendations: [["Geometry hiding in art", "Symmetry", "Find transformations and patterns in striking designs.", "Starter", "Visual guide"]]
    },
    {
      interest: "reading", goal: "english",
      concepts: ["Inference", "Vocabulary", "Narrative", "Evidence", "Point of view"],
      recommendations: [["Read like a story detective", "Inference", "Use clues to discover what a writer implies.", "Starter", "Story lesson"]]
    }
  ];

  const challenges = [
    { topic: "Air pressure", text: "Why might a racing car need a wing if it never leaves the ground?", hint: "Think about which direction the wing pushes the air." },
    { topic: "Orbits", text: "If gravity pulls the Moon inward, why does it keep moving around Earth?", hint: "The Moon is also moving sideways very quickly." },
    { topic: "Game logic", text: "How would you tell a game character to jump only when it is touching the ground?", hint: "Try an if/then rule." }
  ];

  const offlineChannels = [
    { id: "science", icon: "⚗", title: "Science Explorer", accent: "#28c997", description: "Big ideas, safe experiments and clear visual explainers.", counts: "18 videos · 34 articles · 6 experiments · 3 quizzes", size: "186 MB" },
    { id: "space", icon: "✦", title: "Space Exploration", accent: "#8b7cff", description: "Planets, gravity, missions and the scale of our universe.", counts: "12 videos · 21 articles · 4 activities", size: "142 MB" },
    { id: "coding", icon: "</>", title: "Coding Basics", accent: "#ff9f43", description: "Logic, loops and small projects that work without internet.", counts: "10 lessons · 8 projects · 5 quizzes", size: "98 MB" },
    { id: "history", icon: "⌛", title: "History & Geography", accent: "#e96f82", description: "Timelines, maps and stories from around the world.", counts: "16 stories · 24 maps · 4 quizzes", size: "124 MB" },
    { id: "english", icon: "Aa", title: "English Skills", accent: "#49a9ff", description: "Reading, vocabulary and creative writing practice.", counts: "22 lessons · 12 stories · 8 quizzes", size: "110 MB" }
  ];

  const quiz = [
    { question: "What helps create downforce on a racing car?", answers: ["Air moving around its wings", "The colour of its tyres", "Only the engine size"], correct: 0, concept: "Aerodynamics" },
    { question: "Why can a satellite stay in orbit?", answers: ["There is no gravity", "It falls while moving sideways", "Space pushes it upward"], correct: 1, concept: "Orbits" },
    { question: "Which coding idea repeats an instruction?", answers: ["A coordinate", "A sensor", "A loop"], correct: 2, concept: "Loops" }
  ];

  return { interests, goals, formats, explorerQuestions, bridges, challenges, offlineChannels, quiz };
})();
