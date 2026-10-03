window.LanternServices = (() => {
  const STORAGE_KEY = "lantern-state-v1";

  const blankState = () => ({
    profile: null,
    explorerAnswers: [],
    learning: {
      exploredTopics: [], conceptProgress: {}, quizResults: [], confidenceHistory: [],
      dismissedRecommendations: [], recentActivity: [], questionsAsked: 0, learningMinutes: 0
    },
    offline: {},
    familyGoals: []
  });

  const StorageService = {
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return saved?.learning ? saved : blankState();
      } catch { return blankState(); }
    },
    save(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); },
    reset() { localStorage.removeItem(STORAGE_KEY); }
  };

  const labelFor = (items, id) => items.find(item => item.id === id)?.label || id;

  const BridgeEngine = {
    recommendations(profile, dismissed = []) {
      if (!profile) return [];
      const direct = LanternData.bridges.filter(bridge =>
        profile.interests.includes(bridge.interest) && profile.learningGoals.includes(bridge.goal)
      );
      const relaxed = LanternData.bridges.filter(bridge =>
        profile.interests.includes(bridge.interest) && !direct.includes(bridge)
      );
      const unmatched = profile.interests.filter(interest =>
        ![...direct, ...relaxed].some(bridge => bridge.interest === interest)
      );
      const fallbackGoal = profile.learningGoals[0] || "critical-thinking";
      const generic = unmatched.map(interest => ({
        interest,
        goal: fallbackGoal,
        concepts: ["Patterns", "Evidence", "Systems", "Creative connections"],
        recommendations: [[
          `The hidden ideas inside ${labelFor(LanternData.interests, interest)}`,
          "Patterns",
          `Find surprising links between ${labelFor(LanternData.interests, interest).toLowerCase()} and your learning goals.`,
          "Starter",
          "Discovery path"
        ]]
      }));
      return [...direct, ...relaxed, ...generic].flatMap((bridge, bridgeIndex) => bridge.recommendations.map((item, itemIndex) => ({
        id: `${bridge.interest}-${bridge.goal}-${itemIndex}`,
        title: item[0], topic: item[1], summary: item[2], difficulty: item[3], contentType: item[4],
        linkedInterest: bridge.interest, linkedGoal: bridge.goal,
        reason: `You like ${labelFor(LanternData.interests, bridge.interest)} and ${labelFor(LanternData.goals, bridge.goal)} is one of your learning goals. This explores ${item[1].toLowerCase()}.`,
        parentInfluenced: profile.familyGoals?.includes(bridge.goal),
        colorIndex: bridgeIndex % 5
      }))).filter(item => !dismissed.includes(item.id));
    },
    graph(profile) {
      if (!profile) return [];
      const matched = LanternData.bridges.filter(bridge => profile.interests.includes(bridge.interest));
      const unmatched = profile.interests.filter(interest => !matched.some(bridge => bridge.interest === interest));
      const generic = unmatched.map(interest => ({
        interest,
        goal: profile.learningGoals[0] || "critical-thinking",
        concepts: ["Patterns", "Evidence", "Systems", "Creative connections"]
      }));
      return [...matched, ...generic]
        .map(bridge => ({
          interest: bridge.interest,
          label: labelFor(LanternData.interests, bridge.interest),
          goal: bridge.goal,
          concepts: bridge.concepts.map((name, index) => ({
            name,
            status: index === 0 ? "learned" : index === 1 ? "exploring" : index === 2 ? "discovered" : index === 3 ? "recommended" : "revisit"
          }))
        }));
    }
  };

  const IntentService = {
    classify(input) {
      const text = input.toLowerCase();
      if (/^https?:\/\/|^[\w.-]+\.[a-z]{2,}/.test(text)) return "NAVIGATE";
      if (/quiz|test me|question me/.test(text)) return "QUIZ";
      if (/compare|difference|versus|\bvs\b/.test(text)) return "COMPARE";
      if (/reliable|sources|research|evidence/.test(text)) return "RESEARCH";
      if (/explain|how|why|understand/.test(text)) return "EXPLAIN";
      if (/learn|lesson|path|teach/.test(text)) return "LEARN";
      if (/search|find|look up/.test(text)) return "SEARCH";
      return "LEARN";
    }
  };

  const TutorService = {
    localReply(input, profile) {
      const text = input.toLowerCase();
      const grade = profile?.grade || "7";
      if (/moon|orbit|satellite/.test(text)) return {
        lead: "Before we unpack it: what do you think would happen if the Moon suddenly stopped moving sideways?",
        hint: "Gravity pulls the Moon toward Earth, while its sideways speed keeps carrying it past Earth.",
        explanation: "The Moon is always falling toward Earth, but it moves sideways fast enough to keep missing it. That continuous curved fall is an orbit.",
        example: "Imagine throwing a ball farther and farther. With enough speed—and no air resistance—it would curve around Earth instead of landing.",
        challenge: "Would a slower satellite need to orbit closer to Earth or farther away?"
      };
      if (/car|aerodynamic|downforce|wing/.test(text)) return {
        lead: "What have you noticed about the shape of a race car compared with a family car?",
        hint: "Moving air can create pressure differences above and below a surface.",
        explanation: "A race car guides air so pressure pushes it toward the road. That downforce gives the tyres more grip when turning quickly.",
        example: "It is like an upside-down aeroplane wing: instead of lifting up, it pushes down.",
        challenge: "Why might too much downforce also slow the car on a straight road?"
      };
      if (/code|loop|game|robot/.test(text)) return {
        lead: "What small instruction would you want the computer to repeat?",
        hint: "Programs become easier when a repeated action is written once.",
        explanation: `At class ${grade} level, think of a loop as a repeat rule. It runs the same instructions until a count or condition says stop.`,
        example: "A game loop can check controls, move characters and redraw the screen many times each second.",
        challenge: "How would you stop a robot's loop when its distance sensor sees a wall?"
      };
      return {
        lead: "Before I explain, what do you already think is happening? Even a rough guess is useful.",
        hint: "Break the question into: what changes, what stays the same, and what evidence could test it.",
        explanation: `Let's explore this at a class ${grade} level. Start with the main idea, connect it to something familiar, then test it with an example.`,
        example: "We can turn your question into a small diagram, comparison or experiment.",
        challenge: "What is one prediction you could make before looking up the answer?"
      };
    }
  };

  const OfflineContentService = {
    status(state, id) { return state.offline[id] || "available"; },
    start(state, id, onUpdate) {
      state.offline[id] = "downloading";
      onUpdate("downloading");
      window.setTimeout(() => { state.offline[id] = "downloaded"; onUpdate("downloaded"); }, 1400);
    }
  };

  return { StorageService, BridgeEngine, IntentService, TutorService, OfflineContentService, blankState };
})();
