const fs = require('fs');

let content = fs.readFileSync('src/store/chatStore.ts', 'utf8');

// Replace lines from 151 to 237 with basic initial state
const searchTarget1 = `
    // Smart Auto Web Search: Automatically detect if query needs web assistance
    const globalWebSearchEnabled = useSettingsStore.getState().settings.tools.webSearch;
    const autoWebDecision = detectWebSearchNeed(promptText);
    const shouldAutoEnableWebSearch = globalWebSearchEnabled && autoWebDecision.shouldSearch && webSearch === undefined;

    if (shouldAutoEnableWebSearch) {
      console.log(\`[AutoWebSearch] Enabled: \${autoWebDecision.reason} (\${autoWebDecision.category})\`);
    }

    let payloadSettings = JSON.parse(JSON.stringify(useSettingsStore.getState().settings));

    // Apply web search setting: explicit user override > auto-detection > default off
    if (webSearch !== undefined) {
      payloadSettings.tools = payloadSettings.tools || {};
      payloadSettings.tools.webSearch = webSearch;
    } else if (shouldAutoEnableWebSearch) {
      payloadSettings.tools = payloadSettings.tools || {};
      payloadSettings.tools.webSearch = true;
      // Add trusted domains for better search results
      if (autoWebDecision.domains) {
        payloadSettings.tools.webSearchDomains = autoWebDecision.domains;
      }
    } else {
      payloadSettings.tools = payloadSettings.tools || {};
      payloadSettings.tools.webSearch = false; // explicitly disable if auto is off or global is off
    }

    let finalModelUsed = (useSettingsStore.getState().settings.providers as any)[useSettingsStore.getState().settings.providers.activeProvider]?.modelName || 'gemini-2.5-pro';

    if (useSettingsStore.getState().settings.tools.smartRouting) {
      if (isImageGen) {
        get().setRoutingState('vision');
      } else {
        const activeProv = useSettingsStore.getState().settings.providers.activeProvider || 'gemini';
        const roles = useSettingsStore.getState().settings.tools.routingRoles || {} as any;

        const rVisionProv = roles.visionProvider || activeProv;
        const rCodingProv = roles.codingProvider || activeProv;
        const rDefaultProv = roles.defaultProvider || activeProv;

        const defaultModelName = (useSettingsStore.getState().settings.providers as any)[activeProv]?.modelName || 'gemini-2.5-pro';
        const defaultVisionModel = activeProv === 'gemini' ? 'gemini-2.5-pro' : (roles.vision || defaultModelName);
        const defaultCodingModel = activeProv === 'gemini' ? 'gemini-2.5-pro' : (roles.coding || defaultModelName);

        const rVision = roles.vision || defaultVisionModel;
        const rCoding = roles.coding || defaultCodingModel;
        const rDefault = roles.default || defaultModelName;

        // Use enhanced smart routing with weighted intent detection
        const intent = detectSmartRoutingIntent(text, !!imageUrl);
        get().setRoutingState(intent);

        // Helper to apply profile to provider config
        const applyProviderAndModel = (prov: string, modelOrProfileId: string) => {
          payloadSettings.providers.activeProvider = prov;
          if (prov === 'custom' && payloadSettings.providers.custom.profiles) {
            const profile = payloadSettings.providers.custom.profiles.find((p: any) => p.id === modelOrProfileId);
            if (profile) {
              payloadSettings.providers.custom.baseUrl = profile.baseUrl;
              payloadSettings.providers.custom.apiKey = profile.apiKey;
              payloadSettings.providers.custom.modelName = profile.modelName;
              payloadSettings.providers.custom.customHeaders = profile.customHeaders;
              payloadSettings.providers.custom.activeProfileId = profile.id;
              return profile.modelName || 'نامشخص';
            }
          }
          if ((payloadSettings.providers as any)[prov]) {
            (payloadSettings.providers as any)[prov].modelName = modelOrProfileId;
          }
          return modelOrProfileId;
        };

        if (intent === 'vision') {
            const actualName = applyProviderAndModel(rVisionProv, rVision);
            finalModelUsed = actualName + ' (هوشمند)';
        } else if (intent === 'coding') {
            const actualName = applyProviderAndModel(rCodingProv, rCoding);
            finalModelUsed = actualName + ' (هوشمند)';
        } else {
            const actualName = applyProviderAndModel(rDefaultProv, rDefault);
            finalModelUsed = actualName + ' (هوشمند)';
        }
      }
    } else {
      get().setRoutingState('general');
    }`;

const replace1 = `
    let payloadSettings = JSON.parse(JSON.stringify(useSettingsStore.getState().settings));
    let finalModelUsed = (useSettingsStore.getState().settings.providers as any)[useSettingsStore.getState().settings.providers.activeProvider]?.modelName || 'gemini-2.5-pro';
`;

content = content.replace(searchTarget1, replace1);

const searchTarget2 = `
    set({ isStreaming: true });
    const controller = new AbortController();
    abortController = controller;
    const requestStartTime = performance.now();
    let firstTokenTime: number | null = null;

    try {`;

const replace2 = `
    set({ isStreaming: true });
    const controller = new AbortController();
    abortController = controller;
    const requestStartTime = performance.now();
    let firstTokenTime: number | null = null;

    try {
      // 1. LLM Router Intent Detection
      const globalWebSearchEnabled = useSettingsStore.getState().settings.tools.webSearch;
      const smartRoutingEnabled = useSettingsStore.getState().settings.tools.smartRouting;
      
      let detectedIntent = 'general';
      let detectedWebSearch = false;

      // Only call router if it's not an image gen AND (webSearch is auto or smartRouting is on)
      if (!isImageGen && (smartRoutingEnabled || (globalWebSearchEnabled && webSearch === undefined))) {
        try {
          const intentContextMsgs = buildOptimizedContext(
            updatedMessages.slice(0, -1),
            { content: '', imageUrl: '', fileContext: '' },
            { maxRecentTurns: 4 }
          );
          const routerRes = await fetch('/api/chat/detect-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: intentContextMsgs,
              settings: payloadSettings,
            })
          });
          if (routerRes.ok) {
            const routerData = await routerRes.json();
            detectedIntent = routerData.intent || 'general';
            detectedWebSearch = !!routerData.webSearch;
          }
        } catch (err) {
          console.warn('[LLM Router] Failed to detect intent:', err);
        }
      } else if (isImageGen) {
        detectedIntent = 'vision';
      }

      // Apply web search setting: explicit user override > auto-detection > default off
      if (webSearch !== undefined) {
        payloadSettings.tools = payloadSettings.tools || {};
        payloadSettings.tools.webSearch = webSearch;
      } else if (globalWebSearchEnabled && detectedWebSearch) {
        payloadSettings.tools = payloadSettings.tools || {};
        payloadSettings.tools.webSearch = true;
      } else {
        payloadSettings.tools = payloadSettings.tools || {};
        payloadSettings.tools.webSearch = false;
      }

      // Apply Smart Routing
      if (smartRoutingEnabled) {
        get().setRoutingState(detectedIntent as any);

        const activeProv = useSettingsStore.getState().settings.providers.activeProvider || 'gemini';
        const roles = useSettingsStore.getState().settings.tools.routingRoles || {} as any;

        const rVisionProv = roles.visionProvider || activeProv;
        const rCodingProv = roles.codingProvider || activeProv;
        const rDefaultProv = roles.defaultProvider || activeProv;

        const defaultModelName = (useSettingsStore.getState().settings.providers as any)[activeProv]?.modelName || 'gemini-2.5-pro';
        const defaultVisionModel = activeProv === 'gemini' ? 'gemini-2.5-pro' : (roles.vision || defaultModelName);
        const defaultCodingModel = activeProv === 'gemini' ? 'gemini-2.5-pro' : (roles.coding || defaultModelName);

        const rVision = roles.vision || defaultVisionModel;
        const rCoding = roles.coding || defaultCodingModel;
        const rDefault = roles.default || defaultModelName;

        const applyProviderAndModel = (prov: string, modelOrProfileId: string) => {
          payloadSettings.providers.activeProvider = prov;
          if (prov === 'custom' && payloadSettings.providers.custom.profiles) {
            const profile = payloadSettings.providers.custom.profiles.find((p: any) => p.id === modelOrProfileId);
            if (profile) {
              payloadSettings.providers.custom.baseUrl = profile.baseUrl;
              payloadSettings.providers.custom.apiKey = profile.apiKey;
              payloadSettings.providers.custom.modelName = profile.modelName;
              payloadSettings.providers.custom.customHeaders = profile.customHeaders;
              payloadSettings.providers.custom.activeProfileId = profile.id;
              return profile.modelName || 'نامشخص';
            }
          }
          if ((payloadSettings.providers as any)[prov]) {
            (payloadSettings.providers as any)[prov].modelName = modelOrProfileId;
          }
          return modelOrProfileId;
        };

        if (detectedIntent === 'vision') {
            finalModelUsed = applyProviderAndModel(rVisionProv, rVision) + ' (هوشمند)';
        } else if (detectedIntent === 'coding') {
            finalModelUsed = applyProviderAndModel(rCodingProv, rCoding) + ' (هوشمند)';
        } else {
            finalModelUsed = applyProviderAndModel(rDefaultProv, rDefault) + ' (هوشمند)';
        }
      } else {
        get().setRoutingState('general');
      }

      // Update Assistant message model Used if smart routing changed it
      set({ conversations: get().conversations.map((c) => {
          if (c.id !== targetConv!.id) return c;
          const msgs = c.messages.map((m) =>
            m.id === assistantMessageId
              ? { ...m, modelUsed: isImageGen ? (imageEngine ? \`image-generation: \${imageEngine}\` : 'image-generation') : finalModelUsed }
              : m
          );
          return { ...c, messages: msgs, modelUsed: (useSettingsStore.getState().settings.providers[payloadSettings.providers.activeProvider]?.modelName) };
        }) });

      `;

content = content.replace(searchTarget2, replace2);

fs.writeFileSync('src/store/chatStore.ts', content);
console.log('Successfully patched chatStore.ts');
